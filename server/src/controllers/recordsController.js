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
    res.status(500).json({ error: 'Erro ao buscar registro' });
  }
};

export const createRecord = async (req, res) => {
  try {
    const { medId, shiftStart, shiftEnd, qtyDelivered, photoUrl } = req.body;

    // Apenas farmacêuticos, chefes e admins podem criar registros de entrega
    if (req.user.role !== 'farmaceutico' && req.user.role !== 'chefe' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas farmacêuticos e chefes podem registrar entregas' });
    }

    if (!medId || qtyDelivered === undefined) {
      return res.status(400).json({ error: 'Medicamento e quantidade são obrigatórios' });
    }

    // Validação de plantão para farmacêuticos (com margem de 2 horas)
    if (req.user.role === 'farmaceutico') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Buscar plantão do usuário no dia
      const userShifts = await prisma.shift.findMany({
        where: {
          employeeId: req.user.id,
          start: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      if (userShifts.length > 0) {
        // Verificar se está dentro do horário com margem de 2 horas (antes ou depois)
        const TOLERANCE_HOURS = 2;
        const TOLERANCE_MS = TOLERANCE_HOURS * 60 * 60 * 1000;
        
        const isWithinShift = userShifts.some(shift => {
          const shiftStart = new Date(shift.start);
          const shiftEnd = new Date(shift.end);
          const allowedStart = new Date(shiftStart.getTime() - TOLERANCE_MS);
          const allowedEnd = new Date(shiftEnd.getTime() + TOLERANCE_MS);
          
          return now >= allowedStart && now <= allowedEnd;
        });

        if (!isWithinShift) {
          return res.status(403).json({ 
            error: 'Você só pode criar registros dentro do horário do seu plantão (com tolerância de 2 horas antes ou depois)' 
          });
        }
      }
      // Se não tem plantão no dia, permite criar (pode ser uma situação excepcional)
    }
    // Chefes e admins podem criar a qualquer momento

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
    res.status(500).json({ error: 'Erro ao criar registro' });
  }
};

export const receiveRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyReceived, notes } = req.body;

    // Apenas farmacêuticos, chefes e admins podem receber registros
    if (req.user.role !== 'farmaceutico' && req.user.role !== 'chefe' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas farmacêuticos podem receber entregas' });
    }

    if (qtyReceived === undefined) {
      return res.status(400).json({ error: 'Quantidade recebida é obrigatória' });
    }

    // Validar se farmacêutico tem plantão ativo (com 2h de tolerância)
    // Chefes e admins podem receber a qualquer momento
    if (req.user.role === 'farmaceutico') {
      const now = new Date();
      
      // Buscar plantões próximos (últimas 24h e próximas 24h)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userShifts = await prisma.shift.findMany({
        where: {
          employeeId: req.user.id,
          start: { 
            gte: yesterday,
            lte: tomorrow
          }
        }
      });

      if (userShifts.length === 0) {
        return res.status(403).json({ 
          error: 'Você precisa ter um plantão agendado para confirmar recebimento' 
        });
      }

      const TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 horas
      
      // Verificar se está dentro da janela de recebimento (início do plantão com tolerância)
      // OU dentro da janela de entrega (fim do plantão com tolerância)
      const isWithinShiftWindow = userShifts.some(shift => {
        const shiftStart = new Date(shift.start);
        const shiftEnd = new Date(shift.end);
        const allowedStart = new Date(shiftStart.getTime() - TOLERANCE_MS);
        const allowedEnd = new Date(shiftEnd.getTime() + TOLERANCE_MS);
        return now >= allowedStart && now <= allowedEnd;
      });

      if (!isWithinShiftWindow) {
        return res.status(403).json({ 
          error: 'Você só pode confirmar recebimento durante a janela de seu plantão (2h antes do início até 2h após o fim)' 
        });
      }
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
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const record = await prisma.record.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const photoUrl = `/uploads/records/${req.file.filename}`;

    const updatedRecord = await prisma.record.update({
      where: { id },
      data: { photoUrl }
    });

    await createAuditLog(id, 'UPDATE', 'photoUrl', record.photoUrl, photoUrl, req.user.email);

    res.json({ 
      message: 'Foto enviada com sucesso',
      photoUrl: photoUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
};
