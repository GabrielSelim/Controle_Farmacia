import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Criar solicitação de troca
export const createSwapRequest = async (req, res) => {
  try {
    const { shiftId, shiftDate, requesterId, requesterUsername, requesterName, targetId, targetUsername, targetName, targetShiftId, reason } = req.body;
    
    // Validar regras de troca por role
    if (targetId) {
      const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
      
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário alvo não encontrado' });
      }
      
      // Atendente: só pode trocar com outros atendentes
      if (req.user.role === 'atendente' && targetUser.role !== 'atendente') {
        return res.status(403).json({ error: 'Atendentes só podem trocar plantões com outros atendentes' });
      }
      
      // Chefe: só pode trocar com farmacêuticos e outros chefes
      if (req.user.role === 'chefe' && targetUser.role !== 'farmaceutico' && targetUser.role !== 'chefe') {
        return res.status(403).json({ error: 'Chefes só podem trocar plantões com farmacêuticos e outros chefes' });
      }
      
      // Farmacêutico: só pode trocar com outros farmacêuticos e chefes
      if (req.user.role === 'farmaceutico' && targetUser.role !== 'farmaceutico' && targetUser.role !== 'chefe') {
        return res.status(403).json({ error: 'Farmacêuticos só podem trocar plantões com outros farmacêuticos e chefes' });
      }
    }
    
    // Se tem targetShiftId, validar que o plantão pertence ao target
    if (targetShiftId) {
      const targetShift = await prisma.shift.findUnique({ where: { id: targetShiftId } });
      if (!targetShift) {
        return res.status(404).json({ error: 'Plantão do colega não encontrado' });
      }
      if (targetShift.employeeId !== targetId) {
        return res.status(400).json({ error: 'O plantão selecionado não pertence ao colega escolhido' });
      }
    }
    
    const swap = await prisma.shiftSwapRequest.create({
      data: {
        shiftId,
        shiftDate: new Date(shiftDate),
        requesterId,
        requesterUsername,
        requesterName,
        targetId,
        targetUsername,
        targetName,
        targetShiftId,
        reason,
        status: 'pendente'
      }
    });

    // Buscar informações dos plantões para a descrição
    const requesterShift = await prisma.shift.findUnique({ where: { id: shiftId } });
    const targetShift = targetShiftId ? await prisma.shift.findUnique({ where: { id: targetShiftId } }) : null;
    
    let description = `${requesterName} solicitou troca de plantão`;
    if (targetShift) {
      description += ` do dia ${new Date(shiftDate).toLocaleDateString('pt-BR')} com ${targetName} do dia ${new Date(targetShift.start).toLocaleDateString('pt-BR')}`;
    } else if (targetName) {
      description += ` com ${targetName} em ${new Date(shiftDate).toLocaleDateString('pt-BR')}`;
    } else {
      description += ` para qualquer disponível em ${new Date(shiftDate).toLocaleDateString('pt-BR')}`;
    }
    
    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'swap_requested',
        userId: requesterId,
        username: requesterUsername,
        fullName: requesterName,
        entityType: 'swap',
        entityId: swap.id,
        description,
        metadata: JSON.stringify({ shiftId, targetId, targetShiftId, reason })
      }
    });

    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar solicitação de troca' });
  }
};

// Listar solicitações de troca
export const listSwapRequests = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const user = req.user;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    // Se for atendente, só pode ver trocas onde ele é parte
    if (user.role === 'atendente') {
      where.OR = [
        { requesterId: user.id },
        { targetId: user.id }
      ];
    } else if (userId) {
      where.OR = [
        { requesterId: userId },
        { targetId: userId }
      ];
    }

    const swaps = await prisma.shiftSwapRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(swaps);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar solicitações de troca' });
  }
};

// Responder solicitação de troca (aceitar/recusar)
export const respondSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'aceito' ou 'recusado'
    
    const swap = await prisma.shiftSwapRequest.findUnique({ where: { id } });
    if (!swap) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (swap.status !== 'pendente') {
      return res.status(400).json({ error: 'Esta solicitação já foi respondida' });
    }

    const updated = await prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date()
      }
    });

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: status === 'aceito' ? 'swap_accepted' : 'swap_rejected',
        userId: req.user?.id || swap.targetId,
        username: req.user?.username || swap.targetUsername,
        fullName: req.user?.name || swap.targetName,
        entityType: 'swap',
        entityId: id,
        description: `${swap.targetName} ${status === 'aceito' ? 'aceitou' : 'recusou'} a troca de plantão solicitada por ${swap.requesterName}`,
        metadata: JSON.stringify({ requesterId: swap.requesterId, shiftDate: swap.shiftDate })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao responder solicitação' });
  }
};

// Aprovar troca (chefe/admin)
export const approveSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const swap = await prisma.shiftSwapRequest.findUnique({ where: { id } });
    if (!swap) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (swap.status !== 'aceito') {
      return res.status(400).json({ error: 'Apenas solicitações aceitas podem ser aprovadas' });
    }

    const updated = await prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status: 'aprovado',
        approvedBy: req.user?.username,
        approvedAt: new Date()
      }
    });

    // Se tem targetShiftId, fazer troca bilateral
    if (swap.targetShiftId) {
      // Trocar ambos os plantões
      await prisma.shift.update({
        where: { id: swap.shiftId },
        data: { employeeId: swap.targetId } // Plantão do solicitante vai para o alvo
      });
      
      await prisma.shift.update({
        where: { id: swap.targetShiftId },
        data: { employeeId: swap.requesterId } // Plantão do alvo vai para o solicitante
      });
    } else {
      // Troca simples - apenas transfere o plantão
      await prisma.shift.update({
        where: { id: swap.shiftId },
        data: { employeeId: swap.targetId }
      });
    }

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'swap_approved',
        userId: req.user?.id,
        username: req.user?.username,
        fullName: req.user?.name || req.user?.username || 'Administrador',
        entityType: 'swap',
        entityId: id,
        description: `${req.user?.name || req.user?.username || 'Administrador'} aprovou a troca de plantão entre ${swap.requesterName} e ${swap.targetName}`,
        metadata: JSON.stringify({ shiftId: swap.shiftId })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar troca' });
  }
};

// Cancelar solicitação
export const cancelSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const swap = await prisma.shiftSwapRequest.findUnique({ where: { id } });
    if (!swap) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (swap.requesterId !== req.user?.id) {
      return res.status(403).json({ error: 'Apenas o solicitante pode cancelar' });
    }

    const updated = await prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status: 'cancelado'
      }
    });

    // Registrar na timeline
    await prisma.activityLog.create({
      data: {
        type: 'swap_cancelled',
        userId: req.user?.id,
        username: req.user?.username,
        fullName: req.user?.name,
        entityType: 'swap',
        entityId: id,
        description: `${req.user?.name} cancelou a solicitação de troca de plantão`,
        metadata: JSON.stringify({ shiftId: swap.shiftId })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar solicitação' });
  }
};
