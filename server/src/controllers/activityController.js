import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Listar atividades (timeline)
export const listActivities = async (req, res) => {
  try {
    const { type, userId, startDate, endDate, limit = 50 } = req.query;
    
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar atividades' });
  }
};

// Obter estatísticas de atividades
export const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Atividades de hoje
    const todayActivities = await prisma.activityLog.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Registros criados hoje
    const recordsCreatedToday = await prisma.activityLog.count({
      where: {
        type: 'record_created',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Registros recebidos hoje
    const recordsReceivedToday = await prisma.activityLog.count({
      where: {
        type: 'record_received',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Solicitações de troca pendentes
    const pendingSwaps = await prisma.shiftSwapRequest.count({
      where: { status: 'pendente' }
    });

    // Ausências hoje
    const absencesToday = await prisma.absence.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json({
      todayActivities,
      recordsCreatedToday,
      recordsReceivedToday,
      pendingSwaps,
      absencesToday
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

// Registrar atividade manualmente (helper function)
export const logActivity = async (type, userId, userEmail, userName, entityType, entityId, description, metadata = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        userId,
        userEmail,
        userName,
        entityType,
        entityId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (error) {
  }
};
