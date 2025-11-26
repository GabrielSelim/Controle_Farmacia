import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPass(name) {
  testResults.passed++;
  testResults.tests.push({ name, status: 'PASS' });
  log(`✓ ${name}`, 'green');
}

function testFail(name, error) {
  testResults.failed++;
  testResults.tests.push({ name, status: 'FAIL', error });
  log(`✗ ${name}`, 'red');
  if (error) log(`  Error: ${error}`, 'red');
}

async function testEnvVariables() {
  log('\n1. Testando Variáveis de Ambiente...', 'blue');
  
  try {
    if (process.env.JWT_SECRET) {
      testPass('JWT_SECRET está configurado');
    } else {
      testFail('JWT_SECRET não está configurado');
    }

    if (process.env.DATABASE_URL) {
      testPass('DATABASE_URL está configurado');
    } else {
      testFail('DATABASE_URL não está configurado');
    }

    if (process.env.CALLMEBOT_MASTER_KEY) {
      testPass('CALLMEBOT_MASTER_KEY está configurado');
    } else {
      testFail('CALLMEBOT_MASTER_KEY não está configurado');
    }
  } catch (error) {
    testFail('Erro ao verificar variáveis de ambiente', error.message);
  }
}

async function testDatabaseConnection() {
  log('\n2. Testando Conexão com Banco de Dados...', 'blue');
  
  try {
    await prisma.$connect();
    testPass('Conexão com banco de dados estabelecida');
    
    const userCount = await prisma.user.count();
    testPass(`Banco possui ${userCount} usuários`);
    
    if (userCount === 0) {
      log('  Aviso: Execute "npm run seed" para popular o banco', 'yellow');
    }
  } catch (error) {
    testFail('Erro ao conectar no banco de dados', error.message);
  }
}

async function testServerHealth() {
  log('\n3. Testando Servidor HTTP...', 'blue');
  
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/health`);
    
    if (response.ok) {
      testPass('Servidor está respondendo');
      const data = await response.json();
      log(`  Status: ${data.status}`, 'green');
    } else {
      testFail('Servidor retornou erro', `Status ${response.status}`);
    }
  } catch (error) {
    testFail('Não foi possível conectar ao servidor', error.message);
    log('  Execute "npm run dev" para iniciar o servidor', 'yellow');
  }
}

async function testAuthEndpoint() {
  log('\n4. Testando Endpoint de Autenticação...', 'blue');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@farmacia.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token && data.user) {
        testPass('Login funciona corretamente');
        return data.token;
      } else {
        testFail('Login retornou resposta inválida');
        return null;
      }
    } else {
      const error = await response.json();
      testFail('Erro no login', error.error || `Status ${response.status}`);
      log('  Execute "npm run seed" se usuário não existir', 'yellow');
      return null;
    }
  } catch (error) {
    testFail('Erro ao testar autenticação', error.message);
    return null;
  }
}

async function testProtectedEndpoint(token) {
  log('\n5. Testando Endpoint Protegido...', 'blue');
  
  if (!token) {
    testFail('Sem token para testar endpoint protegido');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      testPass('Autenticação JWT funciona');
      log(`  Usuário: ${data.user.email} (${data.user.role})`, 'green');
    } else {
      testFail('Erro ao acessar endpoint protegido', `Status ${response.status}`);
    }
  } catch (error) {
    testFail('Erro ao testar endpoint protegido', error.message);
  }
}

async function testPrismaModels() {
  log('\n6. Testando Models do Prisma...', 'blue');
  
  try {
    // Testar User model
    const users = await prisma.user.findMany();
    testPass(`Model User: ${users.length} registros`);

    // Testar Medicamento model
    const meds = await prisma.medicamento.findMany();
    testPass(`Model Medicamento: ${meds.length} registros`);

    // Testar Shift model
    const shifts = await prisma.shift.findMany();
    testPass(`Model Shift: ${shifts.length} registros`);

    // Testar Record model
    const records = await prisma.record.findMany();
    testPass(`Model Record: ${records.length} registros`);

    // Testar AuditLog model
    const logs = await prisma.auditLog.findMany();
    testPass(`Model AuditLog: ${logs.length} registros`);
  } catch (error) {
    testFail('Erro ao testar models', error.message);
  }
}

async function testCryptoUtils() {
  log('\n7. Testando Utilitários de Criptografia...', 'blue');
  
  try {
    const { encrypt, decrypt } = await import('./src/utils/crypto.js');
    
    const testText = 'test_api_key_123';
    const encrypted = encrypt(testText, process.env.CALLMEBOT_MASTER_KEY);
    const decrypted = decrypt(encrypted, process.env.CALLMEBOT_MASTER_KEY);
    
    if (decrypted === testText) {
      testPass('Criptografia/Descriptografia funciona');
    } else {
      testFail('Erro na criptografia', 'Texto descriptografado não corresponde');
    }
  } catch (error) {
    testFail('Erro ao testar criptografia', error.message);
  }
}

async function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('RESUMO DOS TESTES', 'blue');
  log('='.repeat(60), 'blue');
  
  const total = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);
  
  log(`\nTotal de testes: ${total}`);
  log(`Passou: ${testResults.passed}`, testResults.passed === total ? 'green' : 'yellow');
  log(`Falhou: ${testResults.failed}`, testResults.failed === 0 ? 'green' : 'red');
  log(`Taxa de sucesso: ${passRate}%`, passRate == 100 ? 'green' : 'yellow');
  
  if (testResults.failed > 0) {
    log('\n⚠️  Alguns testes falharam. Verifique os erros acima.', 'yellow');
    log('Consulte TROUBLESHOOTING.md para ajuda.', 'yellow');
  } else {
    log('\n✅ Todos os testes passaram! Sistema está funcionando corretamente.', 'green');
  }
  
  log('\n' + '='.repeat(60), 'blue');
}

async function main() {
  log('╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   CONTROLE DE MEDICAMENTOS - SUITE DE TESTES          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  await testEnvVariables();
  await testDatabaseConnection();
  await testServerHealth();
  
  const token = await testAuthEndpoint();
  await testProtectedEndpoint(token);
  
  await testPrismaModels();
  await testCryptoUtils();
  
  await printSummary();
}

main()
  .catch((error) => {
    log('\n❌ Erro crítico durante testes:', 'red');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(testResults.failed > 0 ? 1 : 0);
  });
