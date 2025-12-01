import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Deletar usuário existente se houver
  await prisma.user.deleteMany({
    where: { username: 'gabriel.sanz' }
  });

  // Criar usuário admin
  const passwordHash = await bcrypt.hash('teste123', 10);
  
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

  console.log('✅ Usuário admin criado:', admin.username);

  // Criar medicamentos
  const med1 = await prisma.medicamento.upsert({
    where: { code: 'MISO200' },
    update: {},
    create: {
      id: 'med-001',
      code: 'MISO200',
      name: 'MISOPROSTOL 200 MCG',
      unit: 'comprimido',
      location: 'Armário de Controlados'
    }
  });

  const med2 = await prisma.medicamento.upsert({
    where: { code: 'MISO25' },
    update: {},
    create: {
      id: 'med-002',
      code: 'MISO25',
      name: 'MISOPROSTOL 25 MCG',
      unit: 'comprimido',
      location: 'Armário de Controlados'
    }
  });

  console.log('✅ Medicamentos criados:', med1.code, med2.code);
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
