/*
  Warnings:

  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- UpdateData
UPDATE "users" 
SET "phone" = '09' || LPAD(CAST(FLOOR(RANDOM() * 100000000) AS TEXT), 8, '0') 
WHERE "phone" IS NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
