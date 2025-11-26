import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkShifts() {
  try {
    console.log('🔍 Verificando plantões de novembro e dezembro 2025...\n');
    
    const shifts = await prisma.shift.findMany({
      where: {
        start: {
          gte: new Date('2025-11-01'),
          lte: new Date('2025-12-31')
        }
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
      },
      orderBy: {
        start: 'asc'
      }
    });
    
    console.log(`📊 Total de plantões encontrados: ${shifts.length}\n`);
    
    // Agrupar por funcionário
    const byEmployee = {};
    shifts.forEach(shift => {
      const email = shift.employee?.email || 'sem-funcionario';
      if (!byEmployee[email]) {
        byEmployee[email] = {
          name: shift.employee?.name || shift.employee?.email || 'Não atribuído',
          shifts: []
        };
      }
      byEmployee[email].shifts.push({
        id: shift.id,
        date: new Date(shift.start).toLocaleDateString('pt-BR'),
        time: new Date(shift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(shift.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    });
    
    // Mostrar plantões por funcionário
    for (const [email, data] of Object.entries(byEmployee)) {
      console.log(`👤 ${data.name} (${email})`);
      console.log(`   Total de plantões: ${data.shifts.length}`);
      
      // Mostrar alguns plantões
      const toShow = data.shifts.slice(0, 10);
      toShow.forEach(shift => {
        console.log(`   📅 ${shift.date} das ${shift.time} às ${shift.endTime} (ID: ${shift.id})`);
      });
      
      if (data.shifts.length > 10) {
        console.log(`   ... e mais ${data.shifts.length - 10} plantões`);
      }
      console.log();
    }
    
    // Buscar especificamente plantões nos dias mencionados
    console.log('🔎 Procurando plantões específicos mencionados:\n');
    
    const shift18 = shifts.find(s => {
      const date = new Date(s.start);
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return date.getDate() === 18 && (time === '18:30' || time === '18:00');
    });
    
    const shift30 = shifts.find(s => {
      const date = new Date(s.start);
      const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return date.getDate() === 30 && (time === '06:30' || time === '07:00');
    });
    
    if (shift18) {
      console.log(`✅ Plantão dia 18:`);
      console.log(`   Funcionário: ${shift18.employee?.name || shift18.employee?.email}`);
      console.log(`   Data/Hora: ${new Date(shift18.start).toLocaleString('pt-BR')}`);
      console.log(`   ID: ${shift18.id}\n`);
    } else {
      console.log(`❌ Não encontrado plantão no dia 18 às 18:30\n`);
    }
    
    if (shift30) {
      console.log(`✅ Plantão dia 30:`);
      console.log(`   Funcionário: ${shift30.employee?.name || shift30.employee?.email}`);
      console.log(`   Data/Hora: ${new Date(shift30.start).toLocaleString('pt-BR')}`);
      console.log(`   ID: ${shift30.id}\n`);
    } else {
      console.log(`❌ Não encontrado plantão no dia 30 às 06:30\n`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar plantões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShifts();
