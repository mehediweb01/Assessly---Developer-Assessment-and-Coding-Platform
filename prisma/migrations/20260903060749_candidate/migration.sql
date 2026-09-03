/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "candidates_phone_key" ON "candidates"("phone");
