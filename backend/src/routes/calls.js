import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get recent calls (for display panel)
router.get('/', async (req, res) => {
  try {
    const { type, limit = 5 } = req.query;

    const where = {};

    // Only get today's calls
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    where.createdAt = { gte: startOfDay };

    if (type) {
      where.type = type;
    }

    const calls = await prisma.call.findMany({
      where,
      include: {
        ticket: {
          include: {
            sector: true
          }
        },
        user: {
          select: { id: true, name: true, desk: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(calls);
  } catch (error) {
    console.error('List calls error:', error);
    res.status(500).json({ error: 'Erro ao listar chamadas' });
  }
});

// Get call statistics
router.get('/stats', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalTickets, waitingReception, waitingSector, completed] = await Promise.all([
      prisma.ticket.count({
        where: { createdAt: { gte: startOfDay } }
      }),
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfDay },
          status: 'WAITING_RECEPTION'
        }
      }),
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfDay },
          status: 'WAITING_SECTOR'
        }
      }),
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfDay },
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      totalTickets,
      waitingReception,
      waitingSector,
      completed,
      inProgress: totalTickets - waitingReception - waitingSector - completed
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
