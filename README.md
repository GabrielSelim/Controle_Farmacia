# Controle de Medicamentos Controlados

Sistema web para gerenciar contagens de medicamentos controlados em trocas de plantão farmacêutico.

## 📋 Funcionalidades

- ✅ **Autenticação com Roles**: farmacêutico, chefe e admin
- ✅ **Registro de Contagens**: entrega e recebimento com assinaturas digitais (email + timestamp)
- ✅ **Histórico e Audit Log**: rastreamento completo de alterações
- ✅ **Gestão de Escalas**: agendamento de plantões
- ✅ **Notificações WhatsApp**: via CallMeBot API
- ✅ **Permissões**: somente chefes podem editar registros existentes
- ✅ **Interface Responsiva**: design adaptado para desktop e mobile

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express**: servidor HTTP
- **Prisma**: ORM com banco SQLite
- **JWT**: autenticação
- **bcrypt**: hash de senhas
- **node-fetch**: chamadas HTTP para APIs externas

### Frontend
- **React** + **Vite**: interface do usuário
- **React Router**: navegação SPA
- **Tailwind CSS**: estilização
- **Axios**: requisições HTTP

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### 1. Backend

```bash
cd server

# Instalar dependências
npm install

# Criar arquivo .env (copiar de .env.example)
copy .env.example .env

# Editar .env e configurar:
# JWT_SECRET=sua_senha_secreta_jwt
# CALLMEBOT_MASTER_KEY=sua_chave_para_criptografia
# DATABASE_URL="file:./dev.db"

# Executar migrations do Prisma
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# Popular banco com dados iniciais
npm run seed

# Iniciar servidor
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

### 2. Frontend

```bash
cd web

# Instalar dependências
npm install

# Criar arquivo .env (copiar de .env.example)
copy .env.example .env

# Editar .env e configurar:
# VITE_API_URL=http://localhost:3001/api

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 👤 Credenciais de Teste

Após executar o seed, você terá estes usuários disponíveis:

| Email | Senha | Role |
|-------|-------|------|
| admin@farmacia.com | admin123 | admin |
| chefe@farmacia.com | chefe123 | chefe |
| chefe2@farmacia.com | chefe456 | chefe |
| farmaceutico1@farmacia.com | farm123 | farmaceutico |
| farmaceutico2@farmacia.com | farm456 | farmaceutico |

## 📱 Configuração do WhatsApp (CallMeBot)

Para habilitar notificações via WhatsApp:

1. Acesse: https://www.callmebot.com/blog/free-api-whatsapp-messages/
2. Siga as instruções para obter sua API Key
3. No sistema, vá em **Admin > Usuários** e edite o usuário
4. Cole a API Key no campo **CallMeBot API Key**
5. Informe o número de telefone no formato internacional (ex: 5516999999999)

## 🔐 Segurança

- **Senhas**: armazenadas com bcrypt (salt rounds: 10)
- **JWT**: tokens com validade de 7 dias
- **CallMeBot Keys**: criptografadas com AES-256-GCM antes de salvar no banco
- **Rate Limiting**: máximo de 10 notificações por IP a cada 15 minutos
- **Audit Log**: todas as alterações em registros são rastreadas

## 📊 Estrutura do Banco de Dados

### Models Principais:

- **User**: usuários do sistema (farmacêuticos, chefes, admins)
- **Medicamento**: cadastro de medicamentos controlados
- **Shift**: escalas de plantão
- **Record**: registros de contagem (entrega + recebimento)
- **AuditLog**: logs de auditoria (imutáveis)

## 🔄 Fluxo de Uso

1. **Farmacêutico A** (saindo):
   - Acessa sistema e registra nova contagem
   - Seleciona medicamento e quantidade
   - Confirma entrega (assinatura digital)

2. **Farmacêutico B** (entrando):
   - Acessa registro pendente
   - Confere quantidade recebida
   - Confirma recebimento (assinatura digital)

3. **Sistema**:
   - Compara quantidade entregue vs recebida
   - Marca como "finalizado" se igual, ou "discrepância" se diferente
   - Registra em audit log

4. **Chefe/Admin**:
   - Pode editar registros (com rastreamento em audit log)
   - Gerencia escalas
   - Envia notificações de lembrete via WhatsApp

## 🌐 Deploy

### Backend (Railway/Render/Heroku)

1. Criar conta no serviço escolhido
2. Conectar repositório
3. Configurar variáveis de ambiente:
   - `JWT_SECRET`
   - `CALLMEBOT_MASTER_KEY`
   - `DATABASE_URL` (Postgres para produção)
4. Para Postgres, alterar `provider` no schema.prisma:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Executar migrations: `npx prisma migrate deploy`
6. Executar seed: `npm run seed`

### Frontend (Vercel)

1. Criar conta no Vercel
2. Importar repositório
3. Configurar:
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicionar variável de ambiente:
   - `VITE_API_URL`: URL do backend deployado

## 📦 Scripts Disponíveis

### Backend
- `npm run dev`: inicia servidor em modo desenvolvimento
- `npm start`: inicia servidor em modo produção
- `npm run seed`: popula banco com dados iniciais
- `npm run prisma:migrate`: executa migrations
- `npm run prisma:generate`: gera Prisma Client

### Frontend
- `npm run dev`: inicia aplicação em modo desenvolvimento
- `npm run build`: compila para produção
- `npm run preview`: preview da build de produção

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso interno da farmácia.

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o administrador do sistema.

---

**Desenvolvido com ❤️ para gestão farmacêutica**
