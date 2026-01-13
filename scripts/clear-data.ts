import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('Clearing existing data...');
    
    // Delete in correct order to respect foreign key constraints
    await prisma.auditLog.deleteMany({});
    await prisma.branchBalanceTransaction.deleteMany({});
    await prisma.reconciliation.deleteMany({});
    await prisma.cashRequisition.deleteMany({});
    await prisma.fuelCoupon.deleteMany({});
    await prisma.imprest.deleteMany({});
    await prisma.cashier.deleteMany({});
    await prisma.branchBalance.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.branch.deleteMany({});
    
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
