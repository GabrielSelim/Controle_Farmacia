import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listShifts = async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    const user = req.user;

    console.log('Listando plantões - Query:', { startDate, endDate, date });

    const where = {};
    
    // Se for assistente, só pode ver os próprios plantões
    if (user.role === 'assistente') {
      where.employeeId = user.id;
    }
    
    if (date) {
      // Filtrar por um dia específico
      // Garantir que a data seja interpretada no fuso horário local
      const [year, month, day] = date.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      console.log('Filtro de data:', { dayStart, dayEnd });
      
      where.OR = [
        { start: { gte: dayStart, lte: dayEnd } },
        { end: { gte: dayStart, lte: dayEnd } },
        { AND: [{ start: { lte: dayStart } }, { end: { gte: dayEnd } }] }
      ];
    } else if (startDate || endDate) {
      where.start = {};
      if (startDate) where.start.gte = new Date(startDate);
      if (endDate) where.start.lte = new Date(endDate);
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

    console.log('Plantões encontrados:', shifts.length);

    res.json({ shifts });
  } catch (error) {
    console.error('List shifts error:', error);
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
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Erro ao buscar plantão' });
  }
};

export const createShift = async (req, res) => {
  try {
    const { start, end, employeeId } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
    }

    const shift = await prisma.shift.create({
      data: {
        start: new Date(start),
        end: new Date(end),
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
    console.error('Create shift error:', error);
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
    console.error('Update shift error:', error);
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
    console.error('Delete shift error:', error);
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

    console.log('Dados recebidos:', { employeeId, pattern, startDate, endDate, shiftStart, shiftEnd, customDays });

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
        
        console.log('Criando plantão:', { start: shiftStartTime, end: shiftEndTime, employeeId });
        
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

    console.log('Total de plantões a criar:', shifts.length);

    // Criar todos os plantões
    await prisma.shift.createMany({
      data: shifts
    });
    
    console.log('Plantões criados com sucesso');
    
    res.json({ 
      message: `${shifts.length} plantão${shifts.length > 1 ? 'ões' : ''} criado${shifts.length > 1 ? 's' : ''} com sucesso`,
      count: shifts.length 
    });
  } catch (error) {
    console.error('Create recurring shifts error:', error);
    res.status(500).json({ error: 'Erro ao criar plantões recorrentes' });
  }
};
