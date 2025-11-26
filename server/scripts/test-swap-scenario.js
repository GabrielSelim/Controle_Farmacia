import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSwapScenario() {
  try {
    console.log('🔍 Verificando cenário de troca de plantões...\n');
    
    // Buscar os usuários
    const farmaceutico1 = await prisma.user.findUnique({
      where: { email: 'farmaceutico1@hotmail.com' }
    });
    
    const farmaceutico2 = await prisma.user.findUnique({
      where: { email: 'farmaceutico2@hotmail.com' }
    });
    
    if (!farmaceutico1 || !farmaceutico2) {
      console.log('❌ Usuários não encontrados no banco de dados');
      return;
    }
    
    console.log('✅ Usuários encontrados:');
    console.log(`   📌 ${farmaceutico1.name} (${farmaceutico1.email})`);
    console.log(`   📌 ${farmaceutico2.name} (${farmaceutico2.email})\n`);
    
    // Buscar plantão do farmaceutico1 no dia 30/11 às 06:30
    const shift1 = await prisma.shift.findFirst({
      where: {
        employeeId: farmaceutico1.id,
        start: {
          gte: new Date('2025-11-30T00:00:00'),
          lt: new Date('2025-12-01T00:00:00')
        }
      }
    });
    
    // Buscar plantão do farmaceutico2 no dia 18/12 às 18:30
    const shift2 = await prisma.shift.findFirst({
      where: {
        employeeId: farmaceutico2.id,
        start: {
          gte: new Date('2025-12-18T00:00:00'),
          lt: new Date('2025-12-19T00:00:00')
        }
      }
    });
    
    console.log('📅 Plantões identificados:\n');
    
    if (shift1) {
      console.log(`✅ Plantão do ${farmaceutico1.name}:`);
      console.log(`   ID: ${shift1.id}`);
      console.log(`   Data: ${new Date(shift1.start).toLocaleDateString('pt-BR')}`);
      console.log(`   Horário: ${new Date(shift1.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift1.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      console.log(`   Funcionário atual: ${shift1.employeeId}\n`);
    } else {
      console.log(`❌ Plantão do ${farmaceutico1.name} no dia 30/11 não encontrado\n`);
    }
    
    if (shift2) {
      console.log(`✅ Plantão do ${farmaceutico2.name}:`);
      console.log(`   ID: ${shift2.id}`);
      console.log(`   Data: ${new Date(shift2.start).toLocaleDateString('pt-BR')}`);
      console.log(`   Horário: ${new Date(shift2.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift2.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      console.log(`   Funcionário atual: ${shift2.employeeId}\n`);
    } else {
      console.log(`❌ Plantão do ${farmaceutico2.name} no dia 18/12 não encontrado\n`);
    }
    
    if (shift1 && shift2) {
      console.log('📝 Instruções para teste:\n');
      console.log('1. Faça login com: farmaceutico1@hotmail.com');
      console.log('2. Vá para a página de Trocas de Plantão');
      console.log('3. Clique em "Solicitar Troca"');
      console.log(`4. Selecione seu plantão: ${new Date(shift1.start).toLocaleDateString('pt-BR')} às ${new Date(shift1.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      console.log(`5. Selecione trocar com: ${farmaceutico2.name}`);
      console.log(`6. Selecione o plantão do colega: ${new Date(shift2.start).toLocaleDateString('pt-BR')} às ${new Date(shift2.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      console.log('7. Adicione um motivo e envie a solicitação');
      console.log('8. Faça login com farmaceutico2@hotmail.com e aceite a troca');
      console.log('9. Faça login com chefe (eng.gabrielsanz@hotmail.com) e aprove a troca');
      console.log('10. Verifique que ambos os plantões foram trocados\n');
      
      console.log('🎯 Resultado esperado após aprovação:');
      console.log(`   • Plantão de 30/11 às 06:30 ficará com ${farmaceutico2.name}`);
      console.log(`   • Plantão de 18/12 às 18:30 ficará com ${farmaceutico1.name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar cenário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSwapScenario();
