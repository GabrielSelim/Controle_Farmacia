import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetando senha do admin...');

  const passwordHash = await bcrypt.hash('teste123', 10);
  
  // Deletar e recriar o admin
  await prisma.user.deleteMany({
    where: { username: 'gabriel.sanz' }
  });

  const admin = await prisma.user.create({
    data: {
      id: 'admin-001',
      username: 'gabriel.sanz',
      name: 'Gabriel Sanz',
      passwordHash: passwordHash,
      role: 'admin',
      active: true,
      firstLogin: false
    }
  });

  console.log('✅ Admin resetado com sucesso!');
  console.log('   Username:', admin.username);
  console.log('   Password: teste123');
  console.log('   Hash:', passwordHash);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
