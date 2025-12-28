import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// List sectors (public for dropdown in reception)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;

    const where = {};
    if (active === 'true') {
      where.active = true;
    }

    const sectors = await prisma.sector.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(sectors);
  } catch (error) {
    console.error('List sectors error:', error);
    res.status(500).json({ error: 'Erro ao listar setores' });
  }
});

// Get sector by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!sector) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }

    res.json(sector);
  } catch (error) {
    console.error('Get sector error:', error);
    res.status(500).json({ error: 'Erro ao buscar setor' });
  }
});

// Create sector (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, room, type } = req.body;

    if (!name || !room) {
      return res.status(400).json({ error: 'Nome e sala são obrigatórios' });
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        room,
        type: type || 'CONSULTATION'
      }
    });

    res.status(201).json(sector);
  } catch (error) {
    console.error('Create sector error:', error);
    res.status(500).json({ error: 'Erro ao criar setor' });
  }
});

// Update sector (Admin only)
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, room, type, active } = req.body;

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(room && { room }),
        ...(type && { type }),
        ...(active !== undefined && { active })
      }
    });

    res.json(sector);
  } catch (error) {
    console.error('Update sector error:', error);
    res.status(500).json({ error: 'Erro ao atualizar setor' });
  }
});

// Delete sector (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sector.update({
      where: { id },
      data: { active: false }
    });

    res.json({ message: 'Setor desativado com sucesso' });
  } catch (error) {
    console.error('Delete sector error:', error);
    res.status(500).json({ error: 'Erro ao desativar setor' });
  }
});

export default router;
