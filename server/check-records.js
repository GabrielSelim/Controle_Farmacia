import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecords() {
  const count = await prisma.record.count();
  console.log('Total de registros:', count);
  
  const activities = await prisma.activityLog.count();
  console.log('Total de atividades:', activities);
  
  if (count > 0) {
    const records = await prisma.record.findMany({
      take: 5,
      include: {
        med: true,
        deliveredBy: true,
        receivedBy: true
      }
    });
    console.log('\nPrimeiros 5 registros:');
    records.forEach(r => {
      console.log(`- ID: ${r.id}, Med: ${r.med?.name}, Status: ${r.status}, Data: ${r.date}`);
    });
  }
  
  const recentActivities = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('\nÚltimas 5 atividades:');
  recentActivities.forEach(a => {
    console.log(`- ${a.type}: ${a.description} (entityId: ${a.entityId})`);
  });
  
  await prisma.$disconnect();
}

checkRecords();
