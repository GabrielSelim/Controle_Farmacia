import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      passwordHash: true
    }
  });

  console.log('📋 Usuários no banco:');
  console.log(JSON.stringify(users, null, 2));
  
  const meds = await prisma.medicamento.findMany();
  console.log('\n💊 Medicamentos no banco:');
  console.log(JSON.stringify(meds, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
