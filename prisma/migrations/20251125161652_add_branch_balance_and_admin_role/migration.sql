-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('STAFF', 'BRANCH_ADMIN', 'MANAGER') NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `branch_balances` (
    `id` VARCHAR(20) NOT NULL,
    `branchId` VARCHAR(20) NOT NULL,
    `openingBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `currentBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `totalIssued` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `totalRetired` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `lastUpdated` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `branch_balances_branchId_key`(`branchId`),
    INDEX `branch_balances_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branch_balance_transactions` (
    `id` VARCHAR(20) NOT NULL,
    `branchBalanceId` VARCHAR(20) NOT NULL,
    `transactionType` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `balanceBefore` DECIMAL(15, 2) NOT NULL,
    `balanceAfter` DECIMAL(15, 2) NOT NULL,
    `reference` VARCHAR(50) NULL,
    `performedBy` VARCHAR(20) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `branch_balance_transactions_branchBalanceId_idx`(`branchBalanceId`),
    INDEX `branch_balance_transactions_transactionType_idx`(`transactionType`),
    INDEX `branch_balance_transactions_createdAt_idx`(`createdAt`),
    INDEX `branch_balance_transactions_performedBy_idx`(`performedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `branch_balances` ADD CONSTRAINT `branch_balances_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branch_balance_transactions` ADD CONSTRAINT `branch_balance_transactions_branchBalanceId_fkey` FOREIGN KEY (`branchBalanceId`) REFERENCES `branch_balances`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branch_balance_transactions` ADD CONSTRAINT `branch_balance_transactions_performedBy_fkey` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
