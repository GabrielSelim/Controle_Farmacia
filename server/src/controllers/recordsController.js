import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAuditLog(recordId, action, field, oldValue, newValue, userEmail) {
  await prisma.auditLog.create({
    data: {
      recordId,
      action,
      field,
      oldValue: oldValue ? String(oldValue) : null,
      newValue: newValue ? String(newValue) : null,
      userEmail
    }
  });
}

export const listRecords = async (req, res) => {
  try {
    const { medId, startDate, endDate, status, userId } = req.query;

    const where = {};
    
    if (medId) where.medId = medId;
    if (status) where.status = status;
    
    if (userId) {
      where.OR = [
        { deliveredById: userId },
        { receivedById: userId }
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.record.findMany({
      where,
      include: {
        med: true,
        deliveredBy: {
          select: { id: true, name: true, email: true }
        },
        receivedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ records });
  } catch (error) {
    console.error('List records error:', error);
    res.status(500).json({ error: 'Erro ao listar registros' });
  }
};

export const getRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        med: true,
        deliveredBy: {
          select: { id: true, name: true, email: true }
        },
        receivedBy: {
          select: { id: true, name: true, email: true }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ error: 'Erro ao buscar registro' });
  }
};

export const createRecord = async (req, res) => {
  try {
    const { medId, shiftStart, shiftEnd, qtyDelivered, photoUrl } = req.body;

    // Apenas farmacêuticos e chefes podem criar registros de entrega
    if (req.user.role !== 'farmaceutico' && req.user.role !== 'chefe') {
      return res.status(403).json({ error: 'Apenas farmacêuticos podem registrar entregas' });
    }

    if (!medId || qtyDelivered === undefined) {
      return res.status(400).json({ error: 'Medicamento e quantidade são obrigatórios' });
    }

    const record = await prisma.record.create({
      data: {
        medId,
        shiftStart: shiftStart ? new Date(shiftStart) : null,
        shiftEnd: shiftEnd ? new Date(shiftEnd) : null,
        qtyDelivered,
        deliveredById: req.user.id,
        deliveredAt: new Date(),
        photoUrl,
        status: 'pendente',
        createdBy: req.user.email
      },
      include: {
        med: true,
        deliveredBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Criar log de auditoria
    await createAuditLog(
      record.id,
      'CREATE',
      null,
      null,
      null,
      req.user.email
    );

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'record_created',
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name || req.user.email,
        entityType: 'record',
        entityId: record.id,
        description: `${req.user.name || req.user.email} registrou entrega de ${record.med.name}`,
        metadata: JSON.stringify({ medId, qtyDelivered })
      }
    });

    res.status(201).json({ record });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Erro ao criar registro' });
  }
};

export const receiveRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyReceived, notes } = req.body;

    // Apenas farmacêuticos e chefes podem receber registros
    if (req.user.role !== 'farmaceutico' && req.user.role !== 'chefe') {
      return res.status(403).json({ error: 'Apenas farmacêuticos podem receber entregas' });
    }

    if (qtyReceived === undefined) {
      return res.status(400).json({ error: 'Quantidade recebida é obrigatória' });
    }

    const existingRecord = await prisma.record.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    if (existingRecord.receivedById) {
      return res.status(400).json({ error: 'Registro já foi recebido' });
    }

    // Determinar status baseado na quantidade
    let status = 'finalizado';
    if (qtyReceived !== existingRecord.qtyDelivered) {
      status = 'discrepancia';
    }

    const record = await prisma.record.update({
      where: { id },
      data: {
        qtyReceived,
        receivedById: req.user.id,
        receivedAt: new Date(),
        status
      },
      include: {
        med: true,
        deliveredBy: {
          select: { id: true, name: true, email: true }
        },
        receivedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Criar log de auditoria
    await createAuditLog(
      record.id,
      'RECEIVE',
      'qtyReceived',
      null,
      qtyReceived,
      req.user.email
    );

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'record_received',
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name || req.user.email,
        entityType: 'record',
        entityId: record.id,
        description: `${req.user.name || req.user.email} confirmou recebimento de ${record.med.name}${status === 'discrepancia' ? ' (com discrepância)' : ''}`,
        metadata: JSON.stringify({ qtyReceived, qtyDelivered: existingRecord.qtyDelivered, status })
      }
    });

    res.json({ record });
  } catch (error) {
    console.error('Receive record error:', error);
    res.status(500).json({ error: 'Erro ao receber registro' });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyDelivered, qtyReceived, status, photoUrl } = req.body;

    // Apenas chefe ou admin pode editar registros
    if (req.user.role !== 'chefe' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas chefes ou administradores podem editar registros' });
    }

    const existingRecord = await prisma.record.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const updateData = {};
    
    // Criar logs de auditoria para cada campo alterado
    if (qtyDelivered !== undefined && qtyDelivered !== existingRecord.qtyDelivered) {
      updateData.qtyDelivered = qtyDelivered;
      await createAuditLog(id, 'UPDATE', 'qtyDelivered', existingRecord.qtyDelivered, qtyDelivered, req.user.email);
    }

    if (qtyReceived !== undefined && qtyReceived !== existingRecord.qtyReceived) {
      updateData.qtyReceived = qtyReceived;
      await createAuditLog(id, 'UPDATE', 'qtyReceived', existingRecord.qtyReceived, qtyReceived, req.user.email);
    }

    if (status !== undefined && status !== existingRecord.status) {
      updateData.status = status;
      await createAuditLog(id, 'UPDATE', 'status', existingRecord.status, status, req.user.email);
    }

    if (photoUrl !== undefined && photoUrl !== existingRecord.photoUrl) {
      updateData.photoUrl = photoUrl;
      await createAuditLog(id, 'UPDATE', 'photoUrl', existingRecord.photoUrl, photoUrl, req.user.email);
    }

    const record = await prisma.record.update({
      where: { id },
      data: updateData,
      include: {
        med: true,
        deliveredBy: {
          select: { id: true, name: true, email: true }
        },
        receivedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({ record });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Apenas admin pode deletar
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar registros' });
    }

    const existingRecord = await prisma.record.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    // Criar log antes de deletar
    await createAuditLog(id, 'DELETE', null, JSON.stringify(existingRecord), null, req.user.email);

    await prisma.record.delete({
      where: { id }
    });

    res.json({ message: 'Registro deletado com sucesso' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Erro ao deletar registro' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { recordId, startDate, endDate } = req.query;

    const where = {};
    
    if (recordId) where.recordId = recordId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        record: {
          include: {
            med: {
              select: { name: true, code: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
};
