Projeto: controle-medicamento-web
Objetivo: criar um site simples para gerenciar contagens de medicamento controlado em trocas de plantão.
Requisitos principais: autenticação com roles (farmacêutico / chefe / admin); registrar contagens (entrega + recebimento) com assinaturas (email + timestamp); histórico/audit log; escalas com notificações (Google Calendar push + WhatsApp via CallMeBot); permissões (somente chefe pode editar registros); envio de WhatsApp via CallMeBot usando callmebot_key armazenada por usuário; painel web responsivo e simples para 6–10 usuários.
Tech stack sugerido: Frontend React (Vite) + Tailwind, Backend Node.js + Express, DB SQLite via Prisma, autenticação JWT, env vars para segredos, deploy em Vercel (frontend) + Railway/Render/Heroku (backend) ou tudo em um único serviço.

PARTE 1 — Estrutura do projeto (prompt)

Cole no Copilot e peça para gerar arquivos/estrutura.

Gere a estrutura de projeto para "controle-medicamento-web" com estas pastas e arquivos iniciais:
- /server
  - package.json
  - src/index.js            (entry Express)
  - src/app.js
  - src/routes/auth.js
  - src/routes/users.js
  - src/routes/shifts.js
  - src/routes/meds.js
  - src/routes/records.js
  - src/routes/notify.js
  - src/controllers/*.js
  - src/middleware/auth.js
  - src/middleware/roles.js
  - src/services/callmebot.js
  - src/services/calendar.js (opcional)
  - prisma/schema.prisma
  - scripts/seed.js
- /web (frontend)
  - package.json
  - vite + React app
  - src/main.jsx
  - src/App.jsx
  - src/pages/Login.jsx
  - src/pages/Dashboard.jsx
  - src/pages/Shifts.jsx
  - src/pages/Records.jsx
  - src/pages/AdminUsers.jsx
  - src/components/* (Form, Table, Navbar, ProtectedRoute)
  - styles: Tailwind config
- README.md with instruções para rodar localmente (server e web)

PARTE 2 — Schema do banco (Prisma) (cole este prompt para gerar o schema)

Gere um arquivo prisma/schema.prisma com provider = "sqlite" e modelos:

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String?
  passwordHash    String?
  role            String   // 'farmaceutico' | 'chefe' | 'admin'
  telefone        String?  // número formato internacional: 5516799...
  telefone_whatsapp String? // opcional, mas mantenha
  callmebot_key   String?  // armazenar encriptado ou proteger via perms
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  shifts          Shift[]
  recordsDelivered Record[] @relation("deliveredBy")
  recordsReceived  Record[] @relation("receivedBy")
}

model Medicamento {
  id        String @id @default(uuid())
  code      String @unique
  name      String
  unit      String
  location  String?
  createdAt DateTime @default(now())
}

model Shift {
  id          String   @id @default(uuid())
  start       DateTime
  end         DateTime
  pharmacist  User?    @relation(fields: [pharmacistId], references: [id])
  pharmacistId String?
  assistants  String?  // emails separados por ;
  notificationSent Boolean @default(false)
  createdBy   String?
}

model Record {
  id             String   @id @default(uuid())
  medId          String
  med            Medicamento @relation(fields:[medId], references:[id])
  date           DateTime @default(now())
  shiftStart     DateTime?
  shiftEnd       DateTime?
  qtyDelivered   Int?
  qtyReceived    Int?
  deliveredById  String?  // FK para User
  deliveredBy    User?    @relation("deliveredBy", fields:[deliveredById], references:[id])
  receivedById   String?
  receivedBy     User?    @relation("receivedBy", fields:[receivedById], references:[id])
  deliveredAt    DateTime?
  receivedAt     DateTime?
  photoUrl       String?
  status         String   // 'pendente'|'finalizado'|'discrepancia'
  createdBy      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  auditLogs      AuditLog[]
}

model AuditLog {
  id          String  @id @default(uuid())
  recordId    String?
  action      String
  field       String?
  oldValue    String?
  newValue    String?
  userEmail   String?
  createdAt   DateTime @default(now())
}


PARTE 3 — Prompt para gerar backend (Express + Prisma + Auth)

Gere o backend Node.js/Express com Prisma seguindo essas regras:

1. Autenticação:
  - Endpoints: POST /api/auth/register (apenas admin pode criar outros), POST /api/auth/login (email + senha) -> retorna JWT.
  - Passwords salvos com bcrypt (salt 10).
  - Middleware auth.js valida JWT, anexa req.user = {id, email, role}.
  - Middleware roles.js protege rotas por roles (ex: onlyAdmin, onlyChefeOrAdmin).

2. Rotas principais:
  - /api/users [GET, POST, PUT, DELETE] (admin only / partial)
  - /api/shifts [GET, POST, PUT] (chefe/admin)
  - /api/meds [GET, POST] (chefe/admin)
  - /api/records:
      POST /api/records -> cria registro de entrega (deliver) com deliveredBy = user
      POST /api/records/:id/receive -> atualiza com receivedBy, marca recebidoAt
      GET /api/records -> filtrável por medId, date range, user
  - /api/notify/send-whatsapp -> body: { email, message } -> envia via CallMeBot usando callmebot_key do usuário (use service sendWhatsAppToUserByEmail)
  - /api/notify/schedule-calendar -> cria evento no Google Calendar do owner (usar OAuth credenciais opcionais)

3. Service callmebot.js:
  - Função sendWhatsApp(phoneWithCountry, key, message) -> faz UrlFetch (node-fetch / axios) para https://api.callmebot.com/whatsapp.php?phone=...&text=...&apikey=...
  - Função sendWhatsAppToUserByEmail(email, message) -> procura user no DB, pega telefone e key, e usa sendWhatsApp.

4. Segurança:
  - Não logar callmebot_key em texto plano nos logs.
  - Proteger endpoint /api/notify/send-whatsapp para roles chefes/admins (ou permitir enviar para self).
  - Armazenar callmebot_key criptografada no DB (ex: usar crypto AES com chave em ENV var CALLMEBOT_MASTER_KEY) — se Copilot puder gerar, implementar encrypt/decrypt utils.

5. Seeds:
  - scripts/seed.js cria 3 usuários (2 chefes e 1 admin) com senhas temporárias, e alguns medicamentos para teste.

6. README parte server: instruções para instalar, .env.example e rodar (prisma migrate dev, npm run dev).

PARTE 4 — Prompt para gerar frontend (React + Tailwind)

Gere um frontend React (Vite) com Tailwind CSS. Requisitos:

1. Autenticação:
  - Página /login com email+senha; após login guarda JWT no localStorage; usa contexto AuthContext.
  - ProtectedRoute que redireciona para /login se token inválido.

2. Páginas:
  - / (Dashboard): resumo de registros pendentes, próximos plantões, botão rápido "Registrar entrega".
  - /shifts: lista e formulário para criar/editar shifts (chefe/admin).
  - /records: tabela com histórico, filtros (med, data, user), botão "ver detalhes" e "solicitar alteração".
  - /records/new: formulário rápido para registrar entrega (med, quantidade, foto upload) e assinar (confirmação). Depois o usuário no turno seguinte abre o mesmo registro e registra recebimento.
  - /admin/users: CRUD de usuários (apenas admin).
  - Navbar com logout, nome do usuário e indicador de role.

3. Componente de Notificações:
  - Permite disparar teste de WhatsApp (botão "Enviar lembrete" em cada shift) — chama /api/notify/send-whatsapp.

4. Design:
  - Use Tailwind para layout limpo, mobile-first.
  - Use controles simples: inputs, selects, date/time pickers. Mostrar modais para confirmar assinaturas.

5. Integração:
  - Todas as requisições ao backend com axios, incluindo header Authorization: Bearer <token>.
  - Upload de foto: enviar para endpoint /api/records/:id/photo (pode salvar no filesystem ou em base64 no DB para teste).

6. README frontend: como rodar (npm install, npm run dev), e como apontar para o backend (REACT_APP_API_URL).

PARTE 5 — Prompt para segurança e variáveis de ambiente

Crie .env.example com:
JWT_SECRET=uma_senha_secreta_gera_pelo_dev
DATABASE_URL="file:./dev.db"
CALLMEBOT_MASTER_KEY=uma_chave_secreta_para_criptografia
GOOGLE_CLIENT_ID= (opcional)
GOOGLE_CLIENT_SECRET= (opcional)
GOOGLE_CALENDAR_ID=primary

Inclua instruções no README:
- Nunca commitar .env real.
- Para armazenar callmebot_key, o servidor deve criptografar antes de salvar:
  encrypted = encrypt(callmebot_key, CALLMEBOT_MASTER_KEY)
  decrypt quando for enviar
- Rotas sensíveis protegidas por roles.


PARTE 6 — Prompt para testes / seed / execução local

Gere scripts:
- npm run seed -> executa scripts/seed.js que cria usuários admin/chefes e alguns medicamentos.
- npm run dev -> inicia server com nodemon
- Teste manual:
  1) Rodar prisma migrate dev --name init
  2) npm run seed
  3) npm run dev
  4) No frontend, rodar npm run dev
  5) Registrar entrega no frontend e verificar registro no DB
  6) Colocar callmebot_key de teste para usuário e chamar endpoint /api/notify/send-whatsapp

PARTE 7 — Prompt para deploy e considerações finais

Gere instruções rápidas de deploy:
- Backend: deploy em Railway/Render/Heroku — configurar env vars, habilitar migrations e seed.
- Frontend: deploy em Vercel apontando REACT_APP_API_URL para a URL do backend.
- Para usar Google Calendar: criar credenciais OAuth e salvar GOOGLE_CLIENT_ID/SECRET no env, realizar OAuth flow server-side.
- Para produção: usar Postgres em vez de SQLite (mudar DATABASE_URL).
- Auditoria: conservar AuditLog imutável; não permitir que admin delete logs sem razão; export CSV periódicos.

Observações / extras (cole para Copilot gerar utilitários)

Função encrypt/decrypt com Node.js crypto (AES-256-GCM): gerar utilitário src/utils/crypto.js.

Limitar taxa de envio de WhatsApp (rate limiter) para evitar abuso.

Opcional: autenticação via Google OAuth: gerar fluxo /auth/google com passport or google-auth-library.