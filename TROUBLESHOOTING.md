# 🔧 Troubleshooting - Controle de Medicamentos

## 📋 Índice
- [Problemas Comuns](#problemas-comuns)
- [Erros de Backend](#erros-de-backend)
- [Erros de Frontend](#erros-de-frontend)
- [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
- [Problemas de Deploy](#problemas-de-deploy)
- [Notificações WhatsApp](#notificações-whatsapp)

---

## Problemas Comuns

### ❌ "Cannot find module '@prisma/client'"

**Causa:** Prisma Client não foi gerado após mudanças no schema.

**Solução:**
```powershell
cd server
npx prisma generate
```

### ❌ "Port 3001 is already in use"

**Causa:** Outra aplicação ou processo anterior ainda está usando a porta.

**Solução Windows:**
```powershell
# Ver processo usando a porta
netstat -ano | findstr :3001

# Matar processo (substitua 1234 pelo PID encontrado)
taskkill /PID 1234 /F
```

**Solução alternativa:**
Alterar porta no `.env`:
```
PORT=3002
```

### ❌ "Error: P1001: Can't reach database server"

**Causa:** Banco de dados não está acessível ou DATABASE_URL incorreta.

**Solução:**
1. Verificar se DATABASE_URL no `.env` está correta
2. Para SQLite local: verificar se arquivo existe em `server/prisma/dev.db`
3. Para PostgreSQL: verificar credenciais e conectividade

```powershell
cd server
npx prisma studio  # Tenta abrir interface visual
```

### ❌ "Token inválido ou expirado" ao fazer requisições

**Causa:** JWT expirado ou JWT_SECRET diferente entre ambiente de criação e validação.

**Solução:**
1. Fazer login novamente
2. Verificar se JWT_SECRET no `.env` não mudou
3. Limpar localStorage do navegador (F12 → Application → Local Storage → Clear)

---

## Erros de Backend

### ❌ "bcrypt Error: data must be a string and salt must either be a salt string or a number of rounds"

**Causa:** Tentativa de hash de senha undefined/null.

**Solução:**
Verificar se `password` está sendo enviado no body:
```javascript
if (!password) {
  return res.status(400).json({ error: 'Senha é obrigatória' });
}
```

### ❌ "ValidationError: child failed because [email is required]"

**Causa:** Dados obrigatórios faltando na requisição.

**Solução:**
Verificar se todos os campos obrigatórios estão sendo enviados:
```javascript
// authController.js
const { email, password } = req.body;
if (!email || !password) {
  return res.status(400).json({ error: 'Email e senha são obrigatórios' });
}
```

### ❌ "Error: secretOrPrivateKey must have a value"

**Causa:** JWT_SECRET não definido no `.env`.

**Solução:**
```powershell
# Verificar se .env existe
cd server
type .env

# Se não existir, criar a partir do exemplo
copy .env.example .env

# Editar e adicionar JWT_SECRET
notepad .env
```

### ❌ Erro ao descriptografar callmebot_key

**Causa:** CALLMEBOT_MASTER_KEY mudou ou não está definida.

**Solução:**
1. Verificar `.env`:
   ```
   CALLMEBOT_MASTER_KEY=sua_chave_aqui
   ```
2. Se mudou, as chaves antigas não funcionarão mais
3. Usuários precisarão recadastrar callmebot_key

---

## Erros de Frontend

### ❌ "Failed to fetch" ou "Network Error"

**Causa:** Frontend não consegue conectar ao backend.

**Solução:**
1. Verificar se backend está rodando: http://localhost:3001/health
2. Verificar `web/.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```
3. Reiniciar frontend: Ctrl+C e `npm run dev`

### ❌ "Uncaught ReferenceError: process is not defined"

**Causa:** Variável de ambiente acessada incorretamente.

**Solução:**
Em Vite, usar `import.meta.env` ao invés de `process.env`:
```javascript
// ❌ Errado
const API_URL = process.env.VITE_API_URL;

// ✅ Correto
const API_URL = import.meta.env.VITE_API_URL;
```

### ❌ Componente não renderiza ou tela branca

**Causa:** Erro de JavaScript não tratado.

**Solução:**
1. Abrir Console do navegador (F12)
2. Verificar erros em vermelho
3. Adicionar error boundaries:
```jsx
// App.jsx
<React.StrictMode>
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
</React.StrictMode>
```

### ❌ "Cannot read property 'map' of undefined"

**Causa:** Tentativa de mapear array antes de carregar dados.

**Solução:**
```jsx
// ❌ Errado
{records.map(record => ...)}

// ✅ Correto
{records && records.length > 0 ? (
  records.map(record => ...)
) : (
  <p>Nenhum registro</p>
)}
```

---

## Problemas de Banco de Dados

### ❌ "Migration failed: already applied"

**Causa:** Tentativa de aplicar migration que já existe.

**Solução:**
```powershell
cd server

# Ver status das migrations
npx prisma migrate status

# Se necessário, resetar (CUIDADO: apaga dados!)
npx prisma migrate reset

# Aplicar migrations
npx prisma migrate deploy
```

### ❌ "Unique constraint failed on the fields: (`email`)"

**Causa:** Tentativa de criar usuário com email já existente.

**Solução:**
1. Verificar se email já existe antes de criar
2. Usar `upsert` ao invés de `create` se apropriado
3. Melhorar mensagem de erro:
```javascript
try {
  await prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
  throw error;
}
```

### ❌ "Foreign key constraint failed"

**Causa:** Tentativa de deletar registro que tem dependências.

**Solução:**
1. Usar soft delete (campo `active: false`)
2. Ou deletar dependências primeiro
3. Ou configurar cascade delete no schema:
```prisma
model Record {
  medId String
  med   Medicamento @relation(fields: [medId], references: [id], onDelete: Cascade)
}
```

### ❌ Banco SQLite locked

**Causa:** Múltiplos processos tentando acessar o banco.

**Solução:**
1. Fechar Prisma Studio se estiver aberto
2. Verificar se não há múltiplas instâncias do servidor
3. Considerar usar PostgreSQL em vez de SQLite

---

## Problemas de Deploy

### ❌ Build falha no Vercel: "Module not found: Can't resolve..."

**Causa:** Dependência faltando ou caminho de importação incorreto.

**Solução:**
```powershell
# Verificar se todas as dependências estão no package.json
cd web
npm install

# Testar build localmente
npm run build
```

### ❌ Railway/Heroku: "Application error"

**Causa:** Variáveis de ambiente faltando ou erro no start.

**Solução:**
1. Verificar logs:
   ```bash
   railway logs
   # ou
   heroku logs --tail
   ```

2. Verificar variáveis de ambiente:
   - JWT_SECRET
   - DATABASE_URL
   - CALLMEBOT_MASTER_KEY

3. Verificar script de start no package.json:
   ```json
   "scripts": {
     "start": "node src/index.js"
   }
   ```

### ❌ CORS error em produção

**Causa:** Frontend em domínio diferente do backend.

**Solução:**
No `server/src/app.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://seu-app.vercel.app'
  ],
  credentials: true
}));
```

### ❌ PostgreSQL: "relation does not exist"

**Causa:** Migrations não foram executadas no banco de produção.

**Solução:**
```bash
# Railway
railway run npx prisma migrate deploy

# Heroku
heroku run npx prisma migrate deploy

# Render (via dashboard ou CLI)
```

---

## Notificações WhatsApp

### ❌ "Usuário não possui callmebot_key configurada"

**Causa:** CallMeBot API key não cadastrada para o usuário.

**Solução:**
1. Login como admin
2. Ir em "Usuários"
3. Editar usuário
4. Adicionar CallMeBot API Key
5. Obter key em: https://www.callmebot.com/blog/free-api-whatsapp-messages/

### ❌ "CallMeBot API returned status 400"

**Causa:** Telefone inválido ou API key incorreta.

**Solução:**
1. Telefone deve estar no formato: `5516999999999` (sem + ou espaços)
2. Verificar se API key foi obtida corretamente do CallMeBot
3. Testar manualmente:
```
https://api.callmebot.com/whatsapp.php?phone=5516999999999&text=teste&apikey=SUA_KEY
```

### ❌ "Error decrypting callmebot_key"

**Causa:** CALLMEBOT_MASTER_KEY mudou desde que a key foi salva.

**Solução:**
1. Usuário precisa recadastrar CallMeBot API key
2. Ou restaurar CALLMEBOT_MASTER_KEY original
3. **IMPORTANTE:** Nunca mudar CALLMEBOT_MASTER_KEY em produção sem plano de migração

---

## 🛠️ Ferramentas de Debug

### Prisma Studio
Visualizar banco de dados:
```powershell
cd server
npx prisma studio
```

### Postman / Insomnia
Testar API manualmente:
1. POST http://localhost:3001/api/auth/login
2. Copiar token
3. Adicionar header nas outras requisições:
   ```
   Authorization: Bearer SEU_TOKEN
   ```

### Chrome DevTools
- F12 → Console: ver erros JavaScript
- F12 → Network: ver requisições HTTP
- F12 → Application → Local Storage: ver token JWT

### VSCode REST Client
Criar arquivo `test.http`:
```http
### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@farmacia.com",
  "password": "admin123"
}

### Listar registros
GET http://localhost:3001/api/records
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 📞 Checklist de Debug

Quando algo não funciona:

- [ ] Backend está rodando? → `http://localhost:3001/health`
- [ ] Frontend está rodando? → `http://localhost:3000`
- [ ] Variáveis de ambiente configuradas? → `.env` existe e está correto
- [ ] Migrations aplicadas? → `npx prisma migrate status`
- [ ] Seed executado? → Fazer login com credenciais de teste
- [ ] Token JWT válido? → Verificar localStorage no navegador
- [ ] CORS configurado? → Verificar origin no backend
- [ ] Logs do servidor? → Ver console onde `npm run dev` está rodando
- [ ] Logs do navegador? → F12 → Console

---

## 🆘 Última Opção: Reset Completo

Se tudo mais falhar:

```powershell
# Backend
cd server
rm -rf node_modules
rm prisma/dev.db*
npm install
npx prisma generate
npx prisma migrate reset --force
npm run seed
npm run dev

# Frontend (em outro terminal)
cd web
rm -rf node_modules
npm install
npm run dev
```

---

## 📚 Logs Úteis

### Habilitar logs detalhados do Prisma:
```javascript
// server/src/app.js
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Log de requisições no Express:
```javascript
// server/src/app.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

**Ainda com problemas?**

1. Verifique os logs completos
2. Procure o erro específico neste documento
3. Verifique issues no GitHub (se projeto for open-source)
4. Entre em contato com o suporte/desenvolvedor

---

**Guia de Troubleshooting Completo** ✅
