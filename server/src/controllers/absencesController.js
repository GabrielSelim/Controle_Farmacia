import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Criar ausência
export const createAbsence = async (req, res) => {
  try {
    const { userId, userEmail, userName, date, reason, description } = req.body;
    
    const absence = await prisma.absence.create({
      data: {
        userId,
        userEmail,
        userName,
        date: new Date(date),
        reason: reason || 'folga',
        description
      }
    });

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'absence_created',
        userId: req.user?.id || userId,
        userEmail: req.user?.email || userEmail,
        userName: req.user?.name || userName,
        entityType: 'absence',
        entityId: absence.id,
        description: `${userName} marcou ausência em ${new Date(date).toLocaleDateString('pt-BR')} - ${reason}`,
        metadata: JSON.stringify({ reason, description })
      }
    });

    res.status(201).json(absence);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ausência' });
  }
};

// Listar ausências
export const listAbsences = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const where = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    if (userId) {
      where.userId = userId;
    }

    const absences = await prisma.absence.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json(absences);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar ausências' });
  }
};

// Deletar ausência
export const deleteAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    
    const absence = await prisma.absence.findUnique({ where: { id } });
    if (!absence) {
      return res.status(404).json({ error: 'Ausência não encontrada' });
    }

    await prisma.absence.delete({ where: { id } });

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'absence_deleted',
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system',
        userName: req.user?.name || 'System',
        entityType: 'absence',
        entityId: id,
        description: `Ausência de ${absence.userName} em ${new Date(absence.date).toLocaleDateString('pt-BR')} foi removida`
      }
    });

    res.json({ message: 'Ausência removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar ausência' });
  }
};
