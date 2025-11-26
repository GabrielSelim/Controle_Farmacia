import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addInitialUsers() {
  try {
    console.log('🌱 Adicionando usuários iniciais...');

    // Hash da senha padrão
    const passwordHash = await bcrypt.hash('senha123', 10);

    const users = [
      {
        email: 'elizandra.stephanie@hotmail.com',
        name: 'Elizandra Stephanie',
        passwordHash,
        role: 'chefe',
        telefone: '5567999999999',
        telefone_whatsapp: '5567999999999',
        active: true
      },
      {
        email: 'eng.gabrielsanz@hotmail.com',
        name: 'Gabriel Sanz',
        passwordHash,
        role: 'admin',
        telefone: '5567996871777',
        telefone_whatsapp: '5567996871777',
        active: true
      },
      {
        email: 'thayscristina@hotmail.com',
        name: 'Thays Cristina',
        passwordHash,
        role: 'chefe',
        telefone: '5567999998888',
        telefone_whatsapp: '5567999998888',
        active: true
      }
    ];

    for (const userData of users) {
      // Verificar se usuário já existe
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`⏭️  Usuário ${userData.email} já existe, pulando...`);
        continue;
      }

      const user = await prisma.user.create({
        data: userData
      });

      console.log(`✅ Criado: ${user.name} (${user.email}) - ${user.role}`);
    }

    console.log('\n✨ Usuários iniciais adicionados com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('Todos os usuários têm senha: senha123\n');
    users.forEach(u => {
      console.log(`${u.name} (${u.role}): ${u.email}`);
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar usuários:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addInitialUsers();
