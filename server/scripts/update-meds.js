import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando medicamentos antigos...');

  // Deletar todos os registros de medicamentos primeiro (dependência)
  console.log('🗑️  Removendo registros de medicamentos...');
  await prisma.record.deleteMany({});
  console.log('✅ Registros removidos');

  // Deletar todos os medicamentos
  await prisma.medicamento.deleteMany({});
  console.log('✅ Medicamentos antigos removidos');

  // Criar apenas os Misoprostol
  const meds = [
    { code: 'MISO25', name: 'Misoprostol 25mcg', unit: 'comprimido(s)', location: '' },
    { code: 'MISO200', name: 'Misoprostol 200mcg', unit: 'comprimido(s)', location: '' }
  ];

  for (const medData of meds) {
    const med = await prisma.medicamento.create({
      data: medData
    });
    console.log('✅ Medicamento criado:', med.name);
  }

  console.log('\n🎉 Medicamentos atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
