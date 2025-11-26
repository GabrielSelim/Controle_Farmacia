import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });

    console.log('\n📋 Usuários no banco de dados:\n');
    console.table(users);
    console.log(`\nTotal: ${users.length} usuários`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
