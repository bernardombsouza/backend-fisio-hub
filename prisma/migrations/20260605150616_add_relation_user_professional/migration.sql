/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `nextAvailableDate` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `crefito` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Professional` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "crefito" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" REAL NOT NULL DEFAULT 0,
    "lng" REAL NOT NULL DEFAULT 0,
    "distanceKm" REAL NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "consultPrice" REAL NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "clinicName" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL NOT NULL DEFAULT 0,
    "totalPatients" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("bio", "city", "clinicName", "consultPrice", "crefito", "distanceKm", "experienceYears", "id", "isVerified", "lat", "lng", "location", "rating", "reviewCount", "slotDuration", "specialty", "state", "successRate", "tags", "totalPatients") SELECT "bio", "city", "clinicName", "consultPrice", "crefito", "distanceKm", "experienceYears", "id", "isVerified", "lat", "lng", "location", "rating", "reviewCount", "slotDuration", "specialty", "state", "successRate", "tags", "totalPatients" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
CREATE UNIQUE INDEX "Professional_crefito_key" ON "Professional"("crefito");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "fullName", "id", "password", "role") SELECT "avatarUrl", "createdAt", "email", "fullName", "id", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
