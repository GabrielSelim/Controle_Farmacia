import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestShifts() {
  try {
    console.log('🔧 Criando plantões de teste para o cenário de troca...\n');
    
    // Buscar os usuários
    const farm1 = await prisma.user.findUnique({
      where: { email: 'farmaceutico1@farmacia.com' }
    });
    
    const farm2 = await prisma.user.findUnique({
      where: { email: 'farmaceutico2@farmacia.com' }
    });
    
    if (!farm1 || !farm2) {
      console.log('❌ Usuários não encontrados');
      return;
    }
    
    // Criar plantão para farmaceutico1: 30/11/2025 às 06:30-18:30
    const shift1Start = new Date('2025-11-30T06:30:00');
    const shift1End = new Date('2025-11-30T18:30:00');
    
    const shift1 = await prisma.shift.create({
      data: {
        start: shift1Start,
        end: shift1End,
        employeeId: farm1.id,
        createdBy: 'admin@farmacia.com'
      }
    });
    
    console.log(`✅ Plantão criado para ${farm1.name}:`);
    console.log(`   Data: ${new Date(shift1.start).toLocaleDateString('pt-BR')}`);
    console.log(`   Horário: ${new Date(shift1.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift1.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    console.log(`   ID: ${shift1.id}\n`);
    
    // Criar plantão para farmaceutico2: 18/12/2025 às 18:30-06:30 (próximo dia)
    const shift2Start = new Date('2025-12-18T18:30:00');
    const shift2End = new Date('2025-12-19T06:30:00');
    
    const shift2 = await prisma.shift.create({
      data: {
        start: shift2Start,
        end: shift2End,
        employeeId: farm2.id,
        createdBy: 'admin@farmacia.com'
      }
    });
    
    console.log(`✅ Plantão criado para ${farm2.name}:`);
    console.log(`   Data: ${new Date(shift2.start).toLocaleDateString('pt-BR')}`);
    console.log(`   Horário: ${new Date(shift2.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift2.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    console.log(`   ID: ${shift2.id}\n`);
    
    console.log('🎯 Cenário de teste pronto!\n');
    console.log('📝 Para testar a troca bilateral:');
    console.log('1. Login: farmaceutico1@farmacia.com / farm123');
    console.log('2. Vá em "Trocas" e clique "Solicitar Troca"');
    console.log(`3. Selecione seu plantão de 30/11/2025 às 06:30`);
    console.log(`4. Selecione trocar com: ${farm2.name}`);
    console.log(`5. Selecione o plantão do colega: 18/12/2025 às 18:30`);
    console.log('6. Preencha o motivo e envie');
    console.log('7. Login: farmaceutico2@farmacia.com / farm456 e aceite');
    console.log('8. Login: chefe@farmacia.com / chefe123 e aprove');
    console.log('9. Verifique que ambos os plantões foram trocados!\n');
    
  } catch (error) {
    console.error('❌ Erro ao criar plantões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestShifts();
