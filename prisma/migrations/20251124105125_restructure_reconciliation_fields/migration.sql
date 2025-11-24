/*
  Warnings:

  - You are about to drop the column `cashSales` on the `reconciliations` table. All the data in the column will be lost.
  - You are about to drop the column `expectedOpeningBalance` on the `reconciliations` table. All the data in the column will be lost.
  - You are about to drop the column `expectedTotalSales` on the `reconciliations` table. All the data in the column will be lost.
  - You are about to drop the column `openingVariance` on the `reconciliations` table. All the data in the column will be lost.
  - You are about to drop the column `openingVarianceExplanation` on the `reconciliations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `reconciliations` DROP COLUMN `cashSales`,
    DROP COLUMN `expectedOpeningBalance`,
    DROP COLUMN `expectedTotalSales`,
    DROP COLUMN `openingVariance`,
    DROP COLUMN `openingVarianceExplanation`,
    ADD COLUMN `withdrawalRecipient` VARCHAR(100) NULL;
