/*
  Warnings:

  - You are about to drop the column `shift` on the `reconciliations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `reconciliations_shift_idx` ON `reconciliations`;

-- AlterTable
ALTER TABLE `reconciliations` DROP COLUMN `shift`;
