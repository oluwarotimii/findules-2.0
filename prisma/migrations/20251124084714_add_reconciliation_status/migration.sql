-- DropForeignKey
ALTER TABLE `reconciliations` DROP FOREIGN KEY `reconciliations_cashierId_fkey`;

-- AlterTable
ALTER TABLE `reconciliations` ADD COLUMN `status` ENUM('ACTIVE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    MODIFY `cashierId` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE INDEX `reconciliations_status_idx` ON `reconciliations`(`status`);

-- AddForeignKey
ALTER TABLE `reconciliations` ADD CONSTRAINT `reconciliations_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `cashiers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
