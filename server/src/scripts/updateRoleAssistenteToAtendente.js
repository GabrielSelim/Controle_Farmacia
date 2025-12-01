import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRoles() {
  try {
    console.log('Atualizando roles de "assistente" para "atendente"...');
    
    // Atualizar usuários
    const usersResult = await prisma.user.updateMany({
      where: {
        role: 'assistente'
      },
      data: {
        role: 'atendente'
      }
    });

    console.log(`✅ ${usersResult.count} usuário(s) atualizado(s)`);

    // Verificar se há outros registros que precisam ser atualizados
    const remainingUsers = await prisma.user.count({
      where: { role: 'assistente' }
    });

    if (remainingUsers === 0) {
      console.log('✅ Todos os registros foram atualizados com sucesso!');
    } else {
      console.log(`⚠️ Ainda existem ${remainingUsers} usuário(s) com role "assistente"`);
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoles();
