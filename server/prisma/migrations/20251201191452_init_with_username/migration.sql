-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "telefone" TEXT,
    "telefone_whatsapp" TEXT,
    "callmebot_key" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "employeeId" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftStart" DATETIME,
    "shiftEnd" DATETIME,
    "qtyDelivered" INTEGER,
    "qtyReceived" INTEGER,
    "deliveredById" TEXT,
    "receivedById" TEXT,
    "deliveredAt" DATETIME,
    "receivedAt" DATETIME,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Record_medId_fkey" FOREIGN KEY ("medId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Record_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "username" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "description" TEXT,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShiftSwapRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "shiftDate" DATETIME NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterUsername" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "targetId" TEXT,
    "targetUsername" TEXT,
    "targetName" TEXT,
    "targetShiftId" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "respondedAt" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_code_key" ON "Medicamento"("code");

-- Seed Data
-- Admin user (password: teste123)
INSERT INTO "User" ("id", "username", "name", "passwordHash", "role", "active", "firstLogin", "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'gabriel.sanz',
  'Gabriel Sanz',
  '$2b$10$rBV2cSLhK.Y5z3qXKx6c7.R3PbJ7QmVEWxZJQGxF8K7yN0zX9xQKi',
  'admin',
  1,
  0,
  datetime('now'),
  datetime('now')
);

-- Medicamentos
INSERT INTO "Medicamento" ("id", "code", "name", "unit", "location", "createdAt")
VALUES 
(
  'med-001',
  'MISO200',
  'MISOPROSTOL 200 MCG',
  'comprimido',
  'Armário de Controlados',
  datetime('now')
),
(
  'med-002',
  'MISO25',
  'MISOPROSTOL 25 MCG',
  'comprimido',
  'Armário de Controlados',
  datetime('now')
);
