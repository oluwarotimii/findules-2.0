import { prisma } from './lib/prisma';

async function checkBranch() {
  try {
    console.log('Checking if branch BR-002 exists...');
    const branch = await prisma.branch.findUnique({
      where: { branchId: 'BR-002' }
    });
    
    console.log('Branch found:', branch);
    
    if (!branch) {
      console.log('Branch BR-002 does not exist in the database');
      return;
    }
    
    console.log('Branch exists, checking if we can create a cashier...');
    
    // Try to create a cashier to reproduce the issue
    const newCashier = await prisma.cashier.create({
      data: {
        name: 'Test Cashier',
        branchId: 'BR-002',
        status: 'ACTIVE'
      }
    });
    
    console.log('Cashier created successfully:', newCashier);
    
    // Clean up - delete the test cashier
    await prisma.cashier.delete({
      where: { id: newCashier.id }
    });
    
    console.log('Test cashier cleaned up');
  } catch (error) {
    console.error('Error in checkBranch:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranch();