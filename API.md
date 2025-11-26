# 📡 API Documentation - Controle de Medicamentos

## Base URL
```
http://localhost:3001/api
```

## 🔐 Autenticação

Todas as rotas (exceto `/auth/login`) requerem token JWT no header:
```
Authorization: Bearer <seu_token_jwt>
```

---

## 📋 Endpoints

### **AUTH** - Autenticação

#### `POST /api/auth/login`
Login no sistema

**Body:**
```json
{
  "email": "admin@farmacia.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@farmacia.com",
    "name": "Administrador",
    "role": "admin"
  }
}
```

#### `POST /api/auth/register`
Criar novo usuário (requer: admin)

**Body:**
```json
{
  "email": "novo@farmacia.com",
  "name": "Novo Usuário",
  "password": "senha123",
  "role": "farmaceutico",
  "telefone": "5516999999999",
  "telefone_whatsapp": "5516999999999"
}
```

#### `GET /api/auth/me`
Obter dados do usuário logado

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@farmacia.com",
    "name": "Administrador",
    "role": "admin",
    "telefone": "5516999999999",
    "active": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### **USERS** - Usuários

#### `GET /api/users`
Listar todos os usuários

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@farmacia.com",
      "name": "Administrador",
      "role": "admin",
      "telefone": "5516999999999",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/users/:id`
Obter usuário por ID

#### `PUT /api/users/:id`
Atualizar usuário

**Body:**
```json
{
  "name": "Nome Atualizado",
  "telefone": "5516988888888",
  "callmebot_key": "sua_api_key_aqui"
}
```

#### `DELETE /api/users/:id`
Desativar usuário (soft delete) (requer: admin)

---

### **MEDS** - Medicamentos

#### `GET /api/meds`
Listar todos os medicamentos

**Response 200:**
```json
{
  "meds": [
    {
      "id": "uuid",
      "code": "MED001",
      "name": "Morfina 10mg",
      "unit": "ampola",
      "location": "Armário A - Prateleira 1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/meds`
Criar medicamento (requer: chefe ou admin)

**Body:**
```json
{
  "code": "MED009",
  "name": "Novo Medicamento",
  "unit": "comprimido",
  "location": "Armário C"
}
```

#### `PUT /api/meds/:id`
Atualizar medicamento (requer: chefe ou admin)

#### `DELETE /api/meds/:id`
Deletar medicamento (requer: chefe ou admin)

---

### **SHIFTS** - Plantões

#### `GET /api/shifts`
Listar plantões

**Query params:**
- `startDate` (opcional): filtrar por data início (ISO string)
- `endDate` (opcional): filtrar por data fim (ISO string)

**Response 200:**
```json
{
  "shifts": [
    {
      "id": "uuid",
      "start": "2024-01-15T08:00:00.000Z",
      "end": "2024-01-15T16:00:00.000Z",
      "pharmacist": {
        "id": "uuid",
        "name": "João Farmacêutico",
        "email": "farmaceutico1@farmacia.com"
      },
      "assistants": "email1@exemplo.com;email2@exemplo.com",
      "notificationSent": false,
      "createdBy": "admin@farmacia.com"
    }
  ]
}
```

#### `POST /api/shifts`
Criar plantão (requer: chefe ou admin)

**Body:**
```json
{
  "start": "2024-01-20T08:00:00.000Z",
  "end": "2024-01-20T16:00:00.000Z",
  "pharmacistId": "uuid_do_usuario",
  "assistants": "email1@exemplo.com;email2@exemplo.com"
}
```

#### `PUT /api/shifts/:id`
Atualizar plantão (requer: chefe ou admin)

#### `DELETE /api/shifts/:id`
Deletar plantão (requer: chefe ou admin)

---

### **RECORDS** - Registros de Contagem

#### `GET /api/records`
Listar registros

**Query params:**
- `medId` (opcional): filtrar por medicamento
- `status` (opcional): filtrar por status (pendente, finalizado, discrepancia)
- `startDate` (opcional): filtrar por data início
- `endDate` (opcional): filtrar por data fim
- `userId` (opcional): filtrar por usuário (entregue ou recebido)

**Response 200:**
```json
{
  "records": [
    {
      "id": "uuid",
      "med": {
        "id": "uuid",
        "code": "MED001",
        "name": "Morfina 10mg",
        "unit": "ampola"
      },
      "date": "2024-01-15T10:30:00.000Z",
      "qtyDelivered": 10,
      "qtyReceived": 10,
      "deliveredBy": {
        "id": "uuid",
        "name": "João Farmacêutico",
        "email": "farmaceutico1@farmacia.com"
      },
      "receivedBy": {
        "id": "uuid",
        "name": "Maria Farmacêutica",
        "email": "farmaceutico2@farmacia.com"
      },
      "deliveredAt": "2024-01-15T08:00:00.000Z",
      "receivedAt": "2024-01-15T16:00:00.000Z",
      "status": "finalizado",
      "photoUrl": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### `GET /api/records/:id`
Obter registro por ID (inclui audit logs)

**Response 200:**
```json
{
  "record": {
    "id": "uuid",
    "med": { ... },
    "date": "2024-01-15T10:30:00.000Z",
    "qtyDelivered": 10,
    "qtyReceived": 10,
    "deliveredBy": { ... },
    "receivedBy": { ... },
    "deliveredAt": "2024-01-15T08:00:00.000Z",
    "receivedAt": "2024-01-15T16:00:00.000Z",
    "status": "finalizado",
    "photoUrl": null,
    "auditLogs": [
      {
        "id": "uuid",
        "action": "CREATE",
        "field": null,
        "oldValue": null,
        "newValue": null,
        "userEmail": "farmaceutico1@farmacia.com",
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "id": "uuid",
        "action": "RECEIVE",
        "field": "qtyReceived",
        "oldValue": null,
        "newValue": "10",
        "userEmail": "farmaceutico2@farmacia.com",
        "createdAt": "2024-01-15T16:00:00.000Z"
      }
    ]
  }
}
```

#### `POST /api/records`
Criar registro de entrega

**Body:**
```json
{
  "medId": "uuid_do_medicamento",
  "qtyDelivered": 10,
  "shiftStart": "2024-01-15T08:00:00.000Z",
  "shiftEnd": "2024-01-15T16:00:00.000Z",
  "photoUrl": "https://exemplo.com/foto.jpg"
}
```

**Response 201:**
```json
{
  "record": {
    "id": "uuid",
    "medId": "uuid_do_medicamento",
    "med": { ... },
    "qtyDelivered": 10,
    "deliveredBy": { ... },
    "deliveredAt": "2024-01-15T10:30:00.000Z",
    "status": "pendente",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### `POST /api/records/:id/receive`
Confirmar recebimento

**Body:**
```json
{
  "qtyReceived": 10
}
```

**Response 200:**
```json
{
  "record": {
    "id": "uuid",
    "qtyReceived": 10,
    "receivedBy": { ... },
    "receivedAt": "2024-01-15T16:00:00.000Z",
    "status": "finalizado"
  }
}
```

#### `PUT /api/records/:id`
Editar registro (requer: chefe ou admin)

**Body:**
```json
{
  "qtyDelivered": 12,
  "qtyReceived": 12,
  "status": "finalizado"
}
```

#### `DELETE /api/records/:id`
Deletar registro (requer: admin)

#### `GET /api/records/audit-logs`
Obter logs de auditoria (requer: chefe ou admin)

**Query params:**
- `recordId` (opcional): filtrar por registro
- `startDate` (opcional): filtrar por data início
- `endDate` (opcional): filtrar por data fim

---

### **NOTIFY** - Notificações

#### `POST /api/notify/send-whatsapp`
Enviar mensagem WhatsApp

**Body:**
```json
{
  "email": "farmaceutico1@farmacia.com",
  "message": "Lembrete: você tem plantão amanhã às 08:00"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "WhatsApp enviado com sucesso",
  "result": { ... }
}
```

**Rate limit:** 10 requisições por IP a cada 15 minutos

#### `POST /api/notify/shift/:shiftId`
Enviar notificação para plantão (requer: chefe ou admin)

**Response 200:**
```json
{
  "success": true,
  "message": "Notificações enviadas com sucesso"
}
```

#### `POST /api/notify/schedule-calendar`
Criar evento no Google Calendar (requer: chefe ou admin)

**Body:**
```json
{
  "title": "Plantão - João",
  "description": "Plantão de 8h às 16h",
  "start": "2024-01-20T08:00:00.000Z",
  "end": "2024-01-20T16:00:00.000Z",
  "attendees": ["email1@exemplo.com", "email2@exemplo.com"]
}
```

---

## 🔒 Permissões por Role

| Endpoint | farmaceutico | chefe | admin |
|----------|--------------|-------|-------|
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /auth/register | ❌ | ❌ | ✅ |
| GET /users | ✅ | ✅ | ✅ |
| PUT /users/:id (próprio) | ✅ | ✅ | ✅ |
| PUT /users/:id (outros) | ❌ | ❌ | ✅ |
| DELETE /users/:id | ❌ | ❌ | ✅ |
| GET /meds | ✅ | ✅ | ✅ |
| POST /meds | ❌ | ✅ | ✅ |
| PUT/DELETE /meds | ❌ | ✅ | ✅ |
| GET /shifts | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /shifts | ❌ | ✅ | ✅ |
| GET /records | ✅ | ✅ | ✅ |
| POST /records | ✅ | ✅ | ✅ |
| POST /records/:id/receive | ✅ | ✅ | ✅ |
| PUT /records/:id | ❌ | ✅ | ✅ |
| DELETE /records/:id | ❌ | ❌ | ✅ |
| POST /notify/send-whatsapp | ✅* | ✅ | ✅ |
| POST /notify/shift/:id | ❌ | ✅ | ✅ |

\* Farmacêuticos só podem enviar para si mesmos

---

## ❌ Códigos de Erro

| Código | Significado |
|--------|-------------|
| 400 | Bad Request - dados inválidos |
| 401 | Unauthorized - token inválido ou ausente |
| 403 | Forbidden - sem permissão para esta ação |
| 404 | Not Found - recurso não encontrado |
| 500 | Internal Server Error - erro no servidor |

**Exemplo de resposta de erro:**
```json
{
  "error": "Token não fornecido"
}
```

---

## 🧪 Testando com cURL

### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farmacia.com","password":"admin123"}'
```

### Listar registros (com token):
```bash
curl -X GET http://localhost:3001/api/records \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar registro:
```bash
curl -X POST http://localhost:3001/api/records \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "medId":"UUID_DO_MEDICAMENTO",
    "qtyDelivered":10
  }'
```

---

## 📚 Recursos Adicionais

- **Prisma Studio**: visualizar banco de dados
  ```bash
  cd server
  npx prisma studio
  ```

- **Health Check**: `GET /health` (não requer auth)

- **Logs**: servidor imprime logs no console durante desenvolvimento

---

**Documentação completa da API** ✅
