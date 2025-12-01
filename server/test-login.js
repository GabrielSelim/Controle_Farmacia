import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLogin() {
  const username = 'gabriel.sanz';
  const password = 'teste123';

  console.log('🔍 Testando login...');
  console.log('Username:', username);
  console.log('Password:', password);

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  console.log('\n✅ Usuário encontrado:');
  console.log('  ID:', user.id);
  console.log('  Username:', user.username);
  console.log('  Name:', user.name);
  console.log('  Role:', user.role);
  console.log('  Active:', user.active);
  console.log('  Hash no banco:', user.passwordHash);

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  console.log('\n🔐 Teste de senha:');
  console.log('  Senha fornecida:', password);
  console.log('  Senha válida?', isValidPassword ? '✅ SIM' : '❌ NÃO');

  // Gerar novo hash para comparar
  const newHash = await bcrypt.hash(password, 10);
  console.log('\n🆕 Novo hash gerado:', newHash);
  const testNew = await bcrypt.compare(password, newHash);
  console.log('  Novo hash funciona?', testNew ? '✅ SIM' : '❌ NÃO');

  await prisma.$disconnect();
}

testLogin().catch(console.error);
