import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  emitNewTicket,
  emitCallReception,
  emitTicketForwarded,
  emitCallSector,
  emitTicketCompleted,
  emitTicketUpdated
} from '../socket/handlers.js';

const router = Router();
const prisma = new PrismaClient();

// Get ticket prefix based on type
const getTicketPrefix = (type) => {
  switch (type) {
    case 'CONSULTATION': return 'C';
    case 'EMERGENCY': return 'A';
    case 'PRIORITY': return 'P';
    default: return 'G';
  }
};

// Get or create daily counter
const getNextNumber = async (type) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let counter = await prisma.dailyCounter.findUnique({
    where: { date: today }
  });

  if (!counter) {
    counter = await prisma.dailyCounter.create({
      data: { date: today }
    });
  }

  const field = type.toLowerCase();
  const nextNumber = counter[field] + 1;

  await prisma.dailyCounter.update({
    where: { date: today },
    data: { [field]: nextNumber }
  });

  return nextNumber;
};

// Create ticket (Totem)
router.post('/', async (req, res) => {
  try {
    const { cpfPrefix, type } = req.body;

    if (!cpfPrefix || cpfPrefix.length !== 5) {
      return res.status(400).json({ error: 'CPF deve ter 5 dígitos' });
    }

    if (!['CONSULTATION', 'EMERGENCY', 'PRIORITY'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de atendimento inválido' });
    }

    const nextNumber = await getNextNumber(type);
    const prefix = getTicketPrefix(type);
    const ticketNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        cpfPrefix,
        type
      }
    });

    const io = req.app.get('io');
    emitNewTicket(io, ticket);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Erro ao criar senha' });
  }
});

// List tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, sectorId, today } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (sectorId) {
      where.sectorId = sectorId;
    }

    if (today === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        sector: true,
        calledBy: {
          select: { id: true, name: true, desk: true }
        }
      },
      orderBy: [
        { type: 'asc' }, // Priority first
        { createdAt: 'asc' }
      ]
    });

    res.json(tickets);
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: 'Erro ao listar senhas' });
  }
});

// Call ticket (Reception)
router.patch('/:id/call', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'IN_RECEPTION',
        calledById: req.user.id,
        calledAt: new Date()
      }
    });

    // Create call record
    const call = await prisma.call.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        message: `Senha ${ticket.number} - CPF ${ticket.cpfPrefix}***`,
        type: 'RECEPTION',
        desk: req.user.desk || 'Guichê 1'
      }
    });

    const io = req.app.get('io');
    emitCallReception(io, {
      ...call,
      ticket,
      user: { name: req.user.name, desk: req.user.desk }
    });
    emitTicketUpdated(io, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Call ticket error:', error);
    res.status(500).json({ error: 'Erro ao chamar senha' });
  }
});

// Forward ticket to sector
router.patch('/:id/forward', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { sectorId, patientName } = req.body;

    if (!sectorId) {
      return res.status(400).json({ error: 'Setor é obrigatório' });
    }

    if (!patientName) {
      return res.status(400).json({ error: 'Nome do paciente é obrigatório' });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'WAITING_SECTOR',
        sectorId,
        patientName,
        forwardedAt: new Date()
      },
      include: {
        sector: true
      }
    });

    const io = req.app.get('io');
    emitTicketForwarded(io, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Forward ticket error:', error);
    res.status(500).json({ error: 'Erro ao encaminhar paciente' });
  }
});

// Call ticket (Sector/Doctor)
router.patch('/:id/call-sector', authenticate, authorize('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'IN_SECTOR',
        calledById: req.user.id,
        calledAt: new Date()
      },
      include: {
        sector: true
      }
    });

    // Create call record
    const call = await prisma.call.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        message: `${ticket.patientName} - ${ticket.sector?.name || 'Setor'}`,
        type: 'SECTOR',
        room: ticket.sector?.room
      }
    });

    const io = req.app.get('io');
    emitCallSector(io, {
      ...call,
      ticket,
      sector: ticket.sector,
      user: { name: req.user.name }
    });
    emitTicketUpdated(io, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Call sector error:', error);
    res.status(500).json({ error: 'Erro ao chamar paciente' });
  }
});

// Complete ticket
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    const io = req.app.get('io');
    emitTicketCompleted(io, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Complete ticket error:', error);
    res.status(500).json({ error: 'Erro ao finalizar atendimento' });
  }
});

// Cancel ticket
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    const io = req.app.get('io');
    emitTicketUpdated(io, ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ error: 'Erro ao cancelar senha' });
  }
});

export default router;
