# ⚡ Guia Rápido de Inicialização

## 🚀 Começar do Zero (Primeira vez)

### 1️⃣ Backend

```powershell
# Navegar para a pasta do servidor
cd server

# Instalar dependências
npm install

# Criar arquivo .env
copy .env.example .env

# IMPORTANTE: Editar .env e adicionar valores reais para:
# JWT_SECRET=alguma_senha_secreta_forte
# CALLMEBOT_MASTER_KEY=outra_senha_para_criptografia

# Executar migrations do banco
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# Popular banco com dados de teste
npm run seed

# Iniciar servidor
npm run dev
```

Servidor rodando em: http://localhost:3001

### 2️⃣ Frontend

Abra outro terminal:

```powershell
# Navegar para pasta web
cd web

# Instalar dependências
npm install

# Criar arquivo .env
copy .env.example .env

# Iniciar aplicação
npm run dev
```

Aplicação rodando em: http://localhost:3000

### 3️⃣ Acessar Sistema

1. Abra o navegador em http://localhost:3000
2. Use uma das credenciais de teste:
   - **Admin**: admin@farmacia.com / admin123
   - **Chefe**: chefe@farmacia.com / chefe123
   - **Farmacêutico**: farmaceutico1@farmacia.com / farm123

---

## 🔄 Iniciar Projeto Existente

Se você já instalou tudo e quer apenas rodar:

### Terminal 1 - Backend:
```powershell
cd server
npm run dev
```

### Terminal 2 - Frontend:
```powershell
cd web
npm run dev
```

---

## 📊 Comandos Úteis

### Backend

```powershell
# Ver estrutura do banco no navegador
cd server
npx prisma studio

# Resetar banco (CUIDADO: apaga tudo!)
npx prisma migrate reset

# Popular novamente com dados de teste
npm run seed

# Ver logs em tempo real
npm run dev
```

### Frontend

```powershell
# Build para produção
cd web
npm run build

# Testar build de produção
npm run preview
```

---

## 🐛 Problemas Comuns

### ❌ Erro: "Cannot find module '@prisma/client'"
**Solução:**
```powershell
cd server
npx prisma generate
```

### ❌ Erro: "Port 3001 is already in use"
**Solução:** Matar processo na porta 3001:
```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3001

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID [PID] /F
```

### ❌ Frontend não conecta ao backend
**Solução:**
1. Verificar se backend está rodando (http://localhost:3001/health)
2. Verificar arquivo `web/.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```
3. Reiniciar frontend

### ❌ Erro ao fazer login
**Solução:**
1. Verificar se o seed foi executado:
   ```powershell
   cd server
   npm run seed
   ```
2. Usar credenciais corretas (veja seção "Acessar Sistema" acima)

---

## 📱 Testar Notificações WhatsApp

1. Obter API Key do CallMeBot:
   - Acesse: https://www.callmebot.com/blog/free-api-whatsapp-messages/
   - Siga as instruções para vincular seu WhatsApp

2. No sistema:
   - Login como admin
   - Vá em "Usuários"
   - Edite um usuário
   - Adicione:
     - Telefone: 5516999999999 (seu número com DDI)
     - CallMeBot API Key: (a chave que você obteve)

3. Testar:
   - Vá em "Plantões"
   - Crie um plantão para o usuário configurado
   - Clique no ícone 📢 para enviar notificação

---

## 📦 Estrutura de Arquivos

```
Controle_Farmacia/
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Auth, roles
│   │   ├── services/      # CallMeBot, Calendar
│   │   └── utils/         # Crypto
│   ├── prisma/
│   │   └── schema.prisma  # Schema do banco
│   ├── scripts/
│   │   └── seed.js        # Popular banco
│   └── package.json
│
├── web/                    # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Context API (Auth)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # API client
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── README.md              # Documentação principal
├── DEPLOY.md              # Guia de deploy
└── QUICKSTART.md          # Este arquivo
```

---

## 🎯 Próximos Passos

1. ✅ Testar todas as funcionalidades localmente
2. 📝 Personalizar dados de seed para sua farmácia
3. 🎨 Ajustar cores/logos no Tailwind se desejar
4. 🚀 Fazer deploy seguindo `DEPLOY.md`
5. 📱 Configurar WhatsApp para notificações
6. 👥 Criar usuários reais no sistema

---

## 💡 Dicas

- **Prisma Studio**: ferramenta visual para ver/editar banco de dados
  ```powershell
  cd server
  npx prisma studio
  ```

- **Logs de Audit**: todos acessíveis em "Registros" > "Ver detalhes" > "Histórico de Alterações"

- **Roles**:
  - **farmaceutico**: pode criar registros e confirmar recebimentos
  - **chefe**: pode editar registros + gerenciar plantões
  - **admin**: acesso total + gestão de usuários

---

**🎉 Pronto! Seu sistema está configurado e funcionando!**

Qualquer dúvida, consulte o README.md ou DEPLOY.md.
