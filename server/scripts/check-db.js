import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });
    
    console.log(`📊 Total de usuários: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      console.log('⚠️  O banco foi resetado pela migration. Você precisa:');
      console.log('   1. Reiniciar o servidor backend (ele recriará os dados iniciais)');
      console.log('   2. Ou executar o seed manualmente: npx prisma db seed\n');
    } else {
      users.forEach(u => {
        console.log(`👤 ${u.name || u.email}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Ativo: ${u.active ? 'Sim' : 'Não'}\n`);
      });
    }
    
    const shifts = await prisma.shift.count();
    console.log(`📅 Total de plantões: ${shifts}`);
    
    const records = await prisma.record.count();
    console.log(`📦 Total de registros: ${records}`);
    
    const swaps = await prisma.shiftSwapRequest.count();
    console.log(`🔄 Total de solicitações de troca: ${swaps}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
