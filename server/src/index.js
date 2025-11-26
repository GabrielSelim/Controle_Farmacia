import dotenv from 'dotenv';
import app from './app.js';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API base: http://localhost:${PORT}/api`);
});
