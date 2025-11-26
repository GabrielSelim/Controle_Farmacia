import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encrypt } from '../src/utils/crypto.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Senha padrão para todos
  const defaultPassword = await bcrypt.hash('senha123', SALT_ROUNDS);

  // Criar usuário admin - Gabriel Sanz
  const admin = await prisma.user.upsert({
    where: { email: 'eng.gabrielsanz@hotmail.com' },
    update: {},
    create: {
      email: 'eng.gabrielsanz@hotmail.com',
      name: 'Gabriel Sanz',
      passwordHash: defaultPassword,
      role: 'admin',
      telefone: '5567996871777',
      active: true
    }
  });
  console.log('✅ Admin criado:', admin.email);

  // Criar usuário chefe 1 - Elizandra Stephanie
  const chefe1 = await prisma.user.upsert({
    where: { email: 'elizandra.stephanie@hotmail.com' },
    update: {},
    create: {
      email: 'elizandra.stephanie@hotmail.com',
      name: 'Elizandra Stephanie',
      passwordHash: defaultPassword,
      role: 'chefe',
      telefone: '5567999999999',
      active: true
    }
  });
  console.log('✅ Chefe 1 criado:', chefe1.email);

  // Criar usuário chefe 2 - Thays Cristina
  const chefe2 = await prisma.user.upsert({
    where: { email: 'thayscristina@hotmail.com' },
    update: {},
    create: {
      email: 'thayscristina@hotmail.com',
      name: 'Thays Cristina',
      passwordHash: defaultPassword,
      role: 'chefe',
      telefone: '5567999998888',
      active: true
    }
  });
  console.log('✅ Chefe 2 criado:', chefe2.email);

  // Criar medicamentos controlados (apenas Misoprostol)
  const meds = [
    { code: 'MISO25', name: 'Misoprostol 25mcg', unit: 'comprimido(s)', location: '' },
    { code: 'MISO200', name: 'Misoprostol 200mcg', unit: 'comprimido(s)', location: '' }
  ];

  for (const medData of meds) {
    const med = await prisma.medicamento.upsert({
      where: { code: medData.code },
      update: {},
      create: medData
    });
    console.log('✅ Medicamento criado:', med.name);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('Admin: eng.gabrielsanz@hotmail.com / senha123');
  console.log('Chefe 1: elizandra.stephanie@hotmail.com / senha123');
  console.log('Chefe 2: thayscristina@hotmail.com / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
