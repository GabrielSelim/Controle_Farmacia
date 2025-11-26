import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeMockUsers() {
  console.log('🗑️  Removendo usuários mockados...');

  const mockEmails = [
    'admin@farmacia.com',
    'chefe@farmacia.com',
    'chefe2@farmacia.com',
    'farmaceutico1@farmacia.com',
    'farmaceutico2@farmacia.com'
  ];

  try {
    // Verificar se existem registros, plantões ou outras referências
    for (const email of mockEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (user) {
        // Verificar dependências
        const records = await prisma.record.count({
          where: {
            OR: [
              { deliveredById: user.id },
              { receivedById: user.id }
            ]
          }
        });

        const shifts = await prisma.shift.count({
          where: { employeeId: user.id }
        });

        console.log(`📊 ${user.name}:`);
        console.log(`   - Registros: ${records}`);
        console.log(`   - Plantões: ${shifts}`);

        // Remover referências antes de deletar
        if (shifts > 0) {
          await prisma.shift.deleteMany({
            where: { employeeId: user.id }
          });
          console.log(`   ✅ Plantões removidos`);
        }

        if (records > 0) {
          await prisma.record.deleteMany({
            where: {
              OR: [
                { deliveredById: user.id },
                { receivedById: user.id }
              ]
            }
          });
          console.log(`   ✅ Registros removidos`);
        }

        // Remover atividades
        await prisma.activityLog.deleteMany({
          where: { userId: user.id }
        });

        // Remover ausências
        await prisma.absence.deleteMany({
          where: { userId: user.id }
        });

        // Remover trocas
        await prisma.shiftSwapRequest.deleteMany({
          where: {
            OR: [
              { requesterId: user.id },
              { targetId: user.id }
            ]
          }
        });

        // Deletar usuário
        await prisma.user.delete({ where: { email } });
        console.log(`   ✅ Usuário ${user.name} removido`);
      }
    }

    console.log('\n🎉 Usuários mockados removidos com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeMockUsers();
