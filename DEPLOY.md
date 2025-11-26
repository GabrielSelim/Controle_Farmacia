# 🚀 Guia de Deploy - Controle de Medicamentos

## Railway (Recomendado para Backend)

### Passo 1: Preparar o Backend

1. Certifique-se de que o `package.json` do servidor tem o script:
```json
"scripts": {
  "start": "node src/index.js"
}
```

2. Adicione arquivo `railway.json` na pasta `server`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npx prisma migrate deploy"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Passo 2: Deploy no Railway

1. Acesse https://railway.app
2. Conecte sua conta GitHub
3. Clique em "New Project" > "Deploy from GitHub repo"
4. Selecione o repositório
5. Configure **Root Directory**: `server`
6. Adicione banco Postgres:
   - Clique em "+ New" > "Database" > "Add PostgreSQL"
   - Railway criará automaticamente `DATABASE_URL`

7. Adicione variáveis de ambiente:
```
JWT_SECRET=sua_senha_super_secreta_aqui_gere_algo_forte
CALLMEBOT_MASTER_KEY=outra_chave_secreta_para_criptografia
PORT=3001
NODE_ENV=production
```

8. Após deploy, execute seed (uma vez):
   - Abra terminal do Railway
   - Execute: `npm run seed`

### Passo 3: Atualizar Schema para Postgres

No `server/prisma/schema.prisma`, altere:
```prisma
datasource db {
  provider = "postgresql"  // era "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit e push. Railway fará redeploy automaticamente.

---

## Vercel (Recomendado para Frontend)

### Passo 1: Preparar o Frontend

1. Certifique-se de que `vite.config.js` está correto:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});
```

### Passo 2: Deploy no Vercel

1. Acesse https://vercel.com
2. Clique em "Add New" > "Project"
3. Importe seu repositório do GitHub
4. Configure:
   - **Root Directory**: `web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Adicione variável de ambiente:
```
VITE_API_URL=https://seu-backend.railway.app/api
```
   (substitua pela URL real do Railway)

6. Deploy!

---

## Render (Alternativa para Backend)

### Web Service

1. Acesse https://render.com
2. Crie novo **Web Service**
3. Conecte repositório GitHub
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

5. Adicione banco Postgres:
   - Crie novo **PostgreSQL** no Render
   - Copie a **Internal Database URL**
   - Adicione como variável `DATABASE_URL`

6. Outras variáveis de ambiente:
```
JWT_SECRET=sua_senha_secreta
CALLMEBOT_MASTER_KEY=outra_chave_secreta
PORT=3001
NODE_ENV=production
```

---

## Heroku (Alternativa para Backend)

### Passo 1: Instalar Heroku CLI

```bash
npm install -g heroku
heroku login
```

### Passo 2: Criar App

```bash
cd server
heroku create nome-do-seu-app
```

### Passo 3: Adicionar Postgres

```bash
heroku addons:create heroku-postgresql:mini
```

### Passo 4: Configurar Variáveis

```bash
heroku config:set JWT_SECRET="sua_senha_secreta"
heroku config:set CALLMEBOT_MASTER_KEY="outra_chave_secreta"
heroku config:set NODE_ENV=production
```

### Passo 5: Deploy

```bash
# Atualizar schema.prisma para postgresql
git add .
git commit -m "Prepare for Heroku"
git push heroku main
```

### Passo 6: Executar Migrations e Seed

```bash
heroku run npx prisma migrate deploy
heroku run npm run seed
```

---

## Netlify (Alternativa para Frontend)

1. Acesse https://netlify.com
2. "Add new site" > "Import an existing project"
3. Conecte GitHub
4. Configure:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `web/dist`

5. Variáveis de ambiente:
```
VITE_API_URL=https://seu-backend.herokuapp.com/api
```

---

## 🔧 Troubleshooting

### Erro de CORS

Se o frontend não conseguir se conectar ao backend, adicione no `server/src/app.js`:

```javascript
app.use(cors({
  origin: ['https://seu-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Migrations não rodam

Execute manualmente:
```bash
# Railway/Render/Heroku
heroku run npx prisma migrate deploy
# ou
railway run npx prisma migrate deploy
```

### Banco SQLite em produção

❌ **Não recomendado!** SQLite não funciona bem em ambientes serverless.

✅ Use **PostgreSQL** (Railway/Render/Heroku oferecem planos gratuitos)

### CallMeBot não funciona

1. Verifique se `CALLMEBOT_MASTER_KEY` está configurada
2. Certifique-se de que usuários têm `callmebot_key` cadastrada
3. Telefone deve estar no formato internacional: `5516999999999`

---

## 📊 Monitoramento

### Logs do Backend

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail
```

**Render:**
- Acesse dashboard > Logs

### Health Check

Acesse `https://seu-backend.com/health` para verificar se está online.

---

## 🔄 Atualizações

Após fazer mudanças no código:

1. Commit e push para GitHub
2. Railway/Vercel/Netlify fazem **auto-deploy**
3. Heroku: `git push heroku main`

Para atualizar schema do banco:
1. Criar migration localmente: `npx prisma migrate dev --name nome_da_migration`
2. Commit schema + migrations
3. Deploy fará `prisma migrate deploy` automaticamente

---

## 📝 Checklist Final

- [ ] Backend rodando com banco Postgres
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas
- [ ] Seed executado (usuários criados)
- [ ] Frontend rodando e conectado ao backend
- [ ] CORS configurado corretamente
- [ ] HTTPS habilitado (Railway/Vercel fazem automaticamente)
- [ ] Teste de login funcionando
- [ ] Teste de criação de registro
- [ ] Teste de notificação WhatsApp (opcional, se configurado)

---

**Boa sorte com o deploy! 🚀**
