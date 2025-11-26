/*
  Warnings:

  - You are about to drop the column `assistants` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `pharmacistId` on the `Shift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShiftSwapRequest" ADD COLUMN "targetShiftId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "employeeId" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("createdBy", "end", "id", "notificationSent", "start") SELECT "createdBy", "end", "id", "notificationSent", "start" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
