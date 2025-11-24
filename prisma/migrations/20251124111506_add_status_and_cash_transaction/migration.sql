/*
  Warnings:

  - Made the column `varianceCategory` on table `reconciliations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `reconciliations` MODIFY `varianceCategory` ENUM('NO_VARIANCE', 'MINOR_SHORTAGE', 'MINOR_OVERAGE', 'MAJOR_SHORTAGE', 'MAJOR_OVERAGE', 'CRITICAL_SHORTAGE', 'CRITICAL_OVERAGE') NOT NULL;
