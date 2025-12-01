import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixApprovedSwaps() {
  try {
    console.log('Corrigindo status de trocas aprovadas...');
    
    // Encontrar trocas com approvedBy mas status ainda "aceito"
    const swapsToFix = await prisma.shiftSwapRequest.findMany({
      where: {
        status: 'aceito',
        approvedBy: { not: null }
      }
    });

    console.log(`Encontradas ${swapsToFix.length} trocas para corrigir`);

    if (swapsToFix.length > 0) {
      // Atualizar todas para "aprovado"
      const result = await prisma.shiftSwapRequest.updateMany({
        where: {
          status: 'aceito',
          approvedBy: { not: null }
        },
        data: {
          status: 'aprovado'
        }
      });

      console.log(`✅ ${result.count} trocas corrigidas com sucesso!`);
    } else {
      console.log('✅ Nenhuma troca precisa ser corrigida');
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir trocas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApprovedSwaps();
