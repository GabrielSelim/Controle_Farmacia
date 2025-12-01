import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listShifts = async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    const user = req.user;

    const where = {};
    
    // Se for atendente, só pode ver os próprios plantões
    if (user.role === 'atendente') {
      where.employeeId = user.id;
    }
    
    if (date) {
      // Filtrar por um dia específico
      // Garantir que a data seja interpretada no fuso horário local
      const [year, month, day] = date.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      where.OR = [
        { start: { gte: dayStart, lte: dayEnd } },
        { end: { gte: dayStart, lte: dayEnd } },
        { AND: [{ start: { lte: dayStart } }, { end: { gte: dayEnd } }] }
      ];
    } else if (startDate || endDate) {
      // Filtrar por período
      where.OR = [
        // Plantões que começam no período
        {
          start: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
          }
        },
        // Plantões que terminam no período
        {
          end: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
          }
        },
        // Plantões que atravessam todo o período
        ...(startDate && endDate ? [{
          AND: [
            { start: { lte: new Date(startDate) } },
            { end: { gte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) } }
          ]
        }] : [])
      ];
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { start: 'asc' }
    });

    res.json({ shifts });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar plantões' });
  }
};

export const getShift = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            telefone: true,
            role: true
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    res.json({ shift });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar plantão' });
  }
};

export const createShift = async (req, res) => {
  try {
    const { start, end, employeeId } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
    }

    const shiftStart = new Date(start);
    const shiftEnd = new Date(end);

    // Validar se há conflito de horário para o funcionário
    if (employeeId) {
      const conflictingShifts = await prisma.shift.findMany({
        where: {
          employeeId: employeeId,
          OR: [
            // Caso 1: Plantão existente começa antes e termina depois do novo (engloba)
            {
              AND: [
                { start: { lte: shiftStart } },
                { end: { gte: shiftEnd } }
              ]
            },
            // Caso 2: Plantão existente começa durante o novo
            {
              AND: [
                { start: { gte: shiftStart } },
                { start: { lt: shiftEnd } }
              ]
            },
            // Caso 3: Plantão existente termina durante o novo
            {
              AND: [
                { end: { gt: shiftStart } },
                { end: { lte: shiftEnd } }
              ]
            },
            // Caso 4: Novo plantão engloba o existente completamente
            {
              AND: [
                { start: { gte: shiftStart } },
                { end: { lte: shiftEnd } }
              ]
            }
          ]
        },
        include: {
          employee: {
            select: { name: true, email: true }
          }
        }
      });

      if (conflictingShifts.length > 0) {
        const conflict = conflictingShifts[0];
        const employeeName = conflict.employee?.name || conflict.employee?.email || 'Funcionário';
        return res.status(400).json({ 
          error: `${employeeName} já possui um plantão no mesmo horário (${new Date(conflict.start).toLocaleString('pt-BR')} - ${new Date(conflict.end).toLocaleString('pt-BR')})`
        });
      }
    }

    const shift = await prisma.shift.create({
      data: {
        start: shiftStart,
        end: shiftEnd,
        employeeId: employeeId || null,
        createdBy: req.user.email
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({ shift });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar plantão' });
  }
};

export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, employeeId, notificationSent } = req.body;

    const updateData = {};
    
    if (start !== undefined) updateData.start = new Date(start);
    if (end !== undefined) updateData.end = new Date(end);
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (notificationSent !== undefined) updateData.notificationSent = notificationSent;

    // Validar conflitos de horário se estiver alterando funcionário, data ou hora
    if (employeeId && (start !== undefined || end !== undefined)) {
      const currentShift = await prisma.shift.findUnique({ where: { id } });
      
      const shiftStart = start ? new Date(start) : currentShift.start;
      const shiftEnd = end ? new Date(end) : currentShift.end;

      const conflictingShifts = await prisma.shift.findMany({
        where: {
          id: { not: id }, // Excluir o próprio plantão da verificação
          employeeId: employeeId,
          OR: [
            // Caso 1: Plantão existente começa antes e termina depois do novo (engloba)
            {
              AND: [
                { start: { lte: shiftStart } },
                { end: { gte: shiftEnd } }
              ]
            },
            // Caso 2: Plantão existente começa durante o novo
            {
              AND: [
                { start: { gte: shiftStart } },
                { start: { lt: shiftEnd } }
              ]
            },
            // Caso 3: Plantão existente termina durante o novo
            {
              AND: [
                { end: { gt: shiftStart } },
                { end: { lte: shiftEnd } }
              ]
            },
            // Caso 4: Novo plantão engloba o existente completamente
            {
              AND: [
                { start: { gte: shiftStart } },
                { end: { lte: shiftEnd } }
              ]
            }
          ]
        },
        include: {
          employee: {
            select: { name: true, email: true }
          }
        }
      });

      if (conflictingShifts.length > 0) {
        const conflict = conflictingShifts[0];
        const employeeName = conflict.employee?.name || conflict.employee?.email || 'Funcionário';
        return res.status(400).json({ 
          error: `${employeeName} já possui um plantão no mesmo horário (${new Date(conflict.start).toLocaleString('pt-BR')} - ${new Date(conflict.end).toLocaleString('pt-BR')})`
        });
      }
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({ shift });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar plantão' });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.shift.delete({
      where: { id }
    });

    res.json({ message: 'Plantão deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar plantão' });
  }
};

// Criar plantões recorrentes
export const createRecurringShifts = async (req, res) => {
  try {
    const { 
      employeeId, 
      pattern, // '12x36', 'weekdays', 'custom'
      startDate, 
      endDate, 
      shiftStart, // hora de início (ex: '08:00')
      shiftEnd,   // hora de fim (ex: '20:00')
      customDays  // para pattern 'custom': [0,1,2,3,4] (dom a sáb)
    } = req.body;

    if (!shiftStart || !shiftEnd) {
      return res.status(400).json({ error: 'Horários de início e fim são obrigatórios' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Período (data inicial e final) é obrigatório' });
    }

    const shifts = [];
    
    // Parse das datas garantindo fuso horário local
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const [startHour, startMin] = shiftStart.split(':').map(Number);
    const [endHour, endMin] = shiftEnd.split(':').map(Number);

    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      let shouldCreate = false;
      
      if (pattern === '12x36') {
        // 12x36: trabalha dia sim, dia não
        const daysDiff = Math.floor((currentDate - start) / (1000 * 60 * 60 * 24));
        shouldCreate = daysDiff % 2 === 0;
      } else if (pattern === 'weekdays') {
        // Segunda a Sexta - criar plantão em todos os dias úteis do período
        const dayOfWeek = currentDate.getDay();
        shouldCreate = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (pattern === 'custom' && customDays) {
        // Dias específicos da semana
        shouldCreate = customDays.includes(currentDate.getDay());
      }
      
      if (shouldCreate) {
        const shiftStartTime = new Date(currentDate);
        shiftStartTime.setHours(startHour, startMin, 0, 0);
        
        const shiftEndTime = new Date(currentDate);
        shiftEndTime.setHours(endHour, endMin, 0, 0);
        
        // Se o plantão termina no dia seguinte (ex: 20h às 08h)
        if (shiftEndTime <= shiftStartTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1);
        }
        
        shifts.push({
          start: shiftStartTime,
          end: shiftEndTime,
          employeeId: employeeId || null,
          createdBy: req.user.email
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (shifts.length === 0) {
      return res.status(400).json({ error: 'Nenhum plantão seria criado com esses parâmetros' });
    }

    // Validar conflitos antes de criar
    if (employeeId) {
      for (const shift of shifts) {
        const conflictingShifts = await prisma.shift.findMany({
          where: {
            employeeId: employeeId,
            OR: [
              // Caso 1: Plantão existente começa antes e termina depois do novo (engloba)
              {
                AND: [
                  { start: { lte: shift.start } },
                  { end: { gte: shift.end } }
                ]
              },
              // Caso 2: Plantão existente começa durante o novo
              {
                AND: [
                  { start: { gte: shift.start } },
                  { start: { lt: shift.end } }
                ]
              },
              // Caso 3: Plantão existente termina durante o novo
              {
                AND: [
                  { end: { gt: shift.start } },
                  { end: { lte: shift.end } }
                ]
              },
              // Caso 4: Novo plantão engloba o existente completamente
              {
                AND: [
                  { start: { gte: shift.start } },
                  { end: { lte: shift.end } }
                ]
              }
            ]
          },
          include: {
            employee: {
              select: { name: true, email: true }
            }
          }
        });

        if (conflictingShifts.length > 0) {
          const conflict = conflictingShifts[0];
          const employeeName = conflict.employee?.name || conflict.employee?.email || 'Funcionário';
          return res.status(400).json({ 
            error: `${employeeName} já possui um plantão no mesmo horário (${new Date(conflict.start).toLocaleString('pt-BR')} - ${new Date(conflict.end).toLocaleString('pt-BR')}). Não é possível criar plantões duplicados.`
          });
        }
      }
    }

    // Criar todos os plantões
    await prisma.shift.createMany({
      data: shifts
    });
    
    res.json({ 
      message: `${shifts.length} plantão${shifts.length > 1 ? 'ões' : ''} criado${shifts.length > 1 ? 's' : ''} com sucesso`,
      count: shifts.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar plantões recorrentes' });
  }
};
