-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `passwordHash` TEXT NOT NULL,
    `role` ENUM('STAFF', 'MANAGER') NOT NULL DEFAULT 'STAFF',
    `branchId` VARCHAR(20) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_branchId_idx`(`branchId`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `branchId` VARCHAR(20) NOT NULL,
    `branchName` VARCHAR(100) NOT NULL,
    `branchCode` VARCHAR(10) NOT NULL,
    `location` VARCHAR(100) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`branchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_requisitions` (
    `requisitionNo` VARCHAR(20) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` ENUM('OPERATIONAL', 'TRAVEL', 'SUPPLIES', 'EMERGENCY', 'OTHER') NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `purpose` TEXT NOT NULL,
    `requestedBy` VARCHAR(100) NOT NULL,
    `dateNeeded` DATE NOT NULL,
    `dateRecorded` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedBy` VARCHAR(20) NOT NULL,
    `status` ENUM('RECORDED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'RECORDED',
    `paymentDate` DATE NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE') NULL,
    `paymentReference` VARCHAR(50) NULL,
    `amountPaid` DECIMAL(15, 2) NULL,
    `paidBy` VARCHAR(20) NULL,
    `branchId` VARCHAR(20) NOT NULL,

    INDEX `cash_requisitions_branchId_status_idx`(`branchId`, `status`),
    INDEX `cash_requisitions_dateRecorded_idx`(`dateRecorded`),
    INDEX `cash_requisitions_status_idx`(`status`),
    INDEX `cash_requisitions_requestedBy_idx`(`requestedBy`),
    INDEX `cash_requisitions_department_idx`(`department`),
    INDEX `cash_requisitions_category_idx`(`category`),
    INDEX `cash_requisitions_dateNeeded_idx`(`dateNeeded`),
    INDEX `cash_requisitions_recordedBy_fkey`(`recordedBy`),
    PRIMARY KEY (`requisitionNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reconciliations` (
    `serialNumber` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL,
    `cashierId` VARCHAR(20) NOT NULL,
    `cashierName` VARCHAR(100) NOT NULL,
    `branchId` VARCHAR(20) NOT NULL,
    `shift` ENUM('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT') NOT NULL,
    `expectedOpeningBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `actualOpeningBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `openingVariance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `openingVarianceExplanation` TEXT NULL,
    `expectedTotalSales` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `actualTotalSales` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `posTransactionsAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `cashSales` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `discountsGiven` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `refundsIssued` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `turnOver` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `cashWithdrawn` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `withdrawalDetails` LONGTEXT NULL,
    `tellerNo` VARCHAR(20) NULL,
    `bankName` VARCHAR(100) NULL,
    `branchLocation` VARCHAR(100) NULL,
    `depositSlipNo` VARCHAR(50) NULL,
    `depositSlipUpload` VARCHAR(255) NULL,
    `transfersOut` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `transferDetails` LONGTEXT NULL,
    `expectedClosingBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `actualClosingBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `overageShortage` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `varianceCategory` ENUM('NO_VARIANCE', 'MINOR_SHORTAGE', 'MINOR_OVERAGE', 'MAJOR_SHORTAGE', 'MAJOR_OVERAGE', 'CRITICAL_SHORTAGE', 'CRITICAL_OVERAGE') NULL,
    `remarks` TEXT NULL,
    `cashierSignature` VARCHAR(255) NULL,
    `supervisorName` VARCHAR(100) NULL,
    `supervisorSignature` VARCHAR(255) NULL,
    `supervisorComments` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedBy` VARCHAR(20) NOT NULL,
    `approvalStatus` ENUM('PENDING_REVIEW', 'SUBMITTED') NOT NULL DEFAULT 'SUBMITTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByIp` VARCHAR(45) NULL,
    `lastModifiedBy` VARCHAR(20) NULL,

    INDEX `reconciliations_branchId_date_idx`(`branchId`, `date`),
    INDEX `reconciliations_cashierId_date_idx`(`cashierId`, `date`),
    INDEX `reconciliations_date_idx`(`date`),
    INDEX `reconciliations_varianceCategory_idx`(`varianceCategory`),
    INDEX `reconciliations_shift_idx`(`shift`),
    PRIMARY KEY (`serialNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cashiers` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `branchId` VARCHAR(20) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cashiers_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_coupons` (
    `documentCode` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL,
    `staffName` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(100) NULL,
    `vehicleType` VARCHAR(100) NULL,
    `plateNumber` VARCHAR(20) NULL,
    `purpose` TEXT NULL,
    `fuelType` ENUM('PETROL', 'DIESEL') NOT NULL,
    `quantityLitres` DECIMAL(10, 2) NOT NULL,
    `estimatedAmount` DECIMAL(15, 2) NOT NULL,
    `createdBy` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `branchId` VARCHAR(20) NOT NULL,
    `pdfGenerated` BOOLEAN NOT NULL DEFAULT false,
    `pdfFilePath` VARCHAR(255) NULL,

    INDEX `fuel_coupons_branchId_date_idx`(`branchId`, `date`),
    INDEX `fuel_coupons_date_idx`(`date`),
    INDEX `fuel_coupons_staffName_idx`(`staffName`),
    INDEX `fuel_coupons_department_idx`(`department`),
    INDEX `fuel_coupons_fuelType_idx`(`fuelType`),
    INDEX `fuel_coupons_plateNumber_idx`(`plateNumber`),
    INDEX `fuel_coupons_createdBy_fkey`(`createdBy`),
    PRIMARY KEY (`documentCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imprest` (
    `imprestNo` VARCHAR(20) NOT NULL,
    `staffName` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `category` ENUM('TRANSPORT', 'MEALS', 'SUPPLIES', 'OTHER') NOT NULL,
    `purpose` TEXT NOT NULL,
    `dateIssued` DATE NOT NULL,
    `issuedBy` VARCHAR(20) NOT NULL,
    `status` ENUM('ISSUED', 'RETIRED', 'OVERDUE') NOT NULL DEFAULT 'ISSUED',
    `dateRetired` DATE NULL,
    `amountSpent` DECIMAL(15, 2) NULL,
    `balance` DECIMAL(15, 2) NULL,
    `receipts` LONGTEXT NULL,
    `retirementNotes` TEXT NULL,
    `retiredBy` VARCHAR(20) NULL,
    `branchId` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `imprest_branchId_status_idx`(`branchId`, `status`),
    INDEX `imprest_dateIssued_idx`(`dateIssued`),
    INDEX `imprest_dateRetired_idx`(`dateRetired`),
    INDEX `imprest_status_idx`(`status`),
    INDEX `imprest_staffName_idx`(`staffName`),
    INDEX `imprest_category_idx`(`category`),
    INDEX `imprest_issuedBy_fkey`(`issuedBy`),
    INDEX `imprest_retiredBy_fkey`(`retiredBy`),
    PRIMARY KEY (`imprestNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(30) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `module` VARCHAR(50) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    INDEX `audit_logs_module_idx`(`module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_requisitions` ADD CONSTRAINT `cash_requisitions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_requisitions` ADD CONSTRAINT `cash_requisitions_recordedBy_fkey` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reconciliations` ADD CONSTRAINT `reconciliations_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reconciliations` ADD CONSTRAINT `reconciliations_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `cashiers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cashiers` ADD CONSTRAINT `cashiers_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_coupons` ADD CONSTRAINT `fuel_coupons_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_coupons` ADD CONSTRAINT `fuel_coupons_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imprest` ADD CONSTRAINT `imprest_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`branchId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imprest` ADD CONSTRAINT `imprest_issuedBy_fkey` FOREIGN KEY (`issuedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imprest` ADD CONSTRAINT `imprest_retiredBy_fkey` FOREIGN KEY (`retiredBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
