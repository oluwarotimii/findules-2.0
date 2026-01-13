import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Define date range: December 1, 2024 to January 13, 2026
const startDate = new Date('2024-12-01');
const endDate = new Date('2026-01-13');
const dateRange = [];

// Generate all dates in the range
const currentDate = new Date(startDate);
while (currentDate <= endDate) {
  dateRange.push(new Date(currentDate));
  currentDate.setDate(currentDate.getDate() + 1);
}

async function seedData() {
  console.log('Starting to seed performance data...');
  
  // Create 8 branches
  const branches = [];
  for (let i = 0; i < 8; i++) {
    const branch = await prisma.branch.create({
      data: {
        branchId: `BR${String(i + 1).padStart(3, '0')}`,
        branchName: `Branch ${faker.company.name()} ${i + 1}`,
        branchCode: `B${i + 1}`,
        location: faker.location.city(),
        status: 'ACTIVE',
      },
    });
    branches.push(branch);
    console.log(`Created branch: ${branch.branchName}`);
  }

  // Create 2 users per branch (16 total users)
  const users = [];
  for (const branch of branches) {
    for (let j = 0; j < 2; j++) {
      const role = j === 0 ? 'MANAGER' : 'STAFF'; // First user is manager, second is staff
      const user = await prisma.user.create({
        data: {
          id: `USR${branch.branchId}${j + 1}`,
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: `user${j + 1}_${branch.branchId.toLowerCase()}@example.com`,
          passwordHash: await hash('password123', 10),
          role: role,
          branchId: branch.branchId,
          status: 'ACTIVE',
        },
      });
      users.push(user);
      console.log(`Created user: ${user.name} (${user.role}) at ${branch.branchName}`);
    }
  }

  // Create 16 cashiers (one for each user)
  const cashiers = [];
  for (const user of users) {
    const branch = branches.find(b => b.branchId === user.branchId)!;
    const cashier = await prisma.cashier.create({
      data: {
        id: `CSH${user.id.slice(-6)}`,
        name: user.name,
        branchId: branch.branchId,
        status: 'ACTIVE',
      },
    });
    cashiers.push(cashier);
    console.log(`Created cashier: ${cashier.name} at ${branch.branchName}`);
  }

  // Create branch balances for each branch
  for (const branch of branches) {
    await prisma.branchBalance.create({
      data: {
        branchId: branch.branchId,
        openingBalance: faker.number.int({ min: 50000, max: 200000 }),
        currentBalance: faker.number.int({ min: 50000, max: 200000 }),
        totalIssued: 0,
        totalRetired: 0,
      },
    });
    console.log(`Created branch balance for: ${branch.branchName}`);
  }

  // Track previous day's closing balances for each branch
  const previousClosingBalances: Record<string, number> = {};

  // Initialize previous closing balances for each branch
  for (const branch of branches) {
    previousClosingBalances[branch.branchId] = faker.number.float({ min: 50000, max: 100000, precision: 0.01 });
  }

  // Generate daily data for each day in the range
  let recordCount = 0;
  for (const date of dateRange) {
    console.log(`Processing date: ${date.toISOString().split('T')[0]} (${++recordCount}/${dateRange.length})`);

    for (const branch of branches) {
      // Create 1 fuel coupon per day per branch
      await prisma.fuelCoupon.create({
        data: {
          documentCode: `FC-${branch.branchCode}-${date.toISOString().split('T')[0].replace(/-/g, '')}-${faker.string.numeric(4)}`,
          date: date,
          staffName: faker.person.fullName(),
          department: faker.commerce.department(),
          unit: faker.location.state(),
          vehicleType: faker.vehicle.type(),
          plateNumber: faker.vehicle.vrm(),
          purpose: faker.lorem.sentence(),
          fuelType: faker.helpers.arrayElement(['PETROL', 'DIESEL']),
          quantityLitres: faker.number.float({ min: 10, max: 100, precision: 0.01 }),
          estimatedAmount: faker.number.float({ min: 5000, max: 50000, precision: 0.01 }),
          createdBy: users.find(u => u.branchId === branch.branchId)?.id || users[0].id,
          branchId: branch.branchId,
        },
      });

      // Create 10 imprest transactions per day per branch
      for (let i = 0; i < 10; i++) {
        const issuingUser = users.find(u => u.branchId === branch.branchId)!;

        await prisma.imprest.create({
          data: {
            imprestNo: `IMP-${branch.branchCode}-${date.toISOString().split('T')[0].replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
            staffName: faker.person.fullName(),
            amount: faker.number.float({ min: 5000, max: 50000, precision: 0.01 }),
            category: faker.helpers.arrayElement(['TRANSPORT', 'MEALS', 'SUPPLIES', 'OTHER']),
            purpose: faker.lorem.sentence(),
            dateIssued: date,
            issuedBy: issuingUser.id,
            status: 'ISSUED',
            branchId: branch.branchId,
          },
        });
      }

      // Create reconciliation records occasionally (every 5 days)
      if (date.getDate() % 5 === 0) {
        const cashier = cashiers.find(c => c.branchId === branch.branchId)!;

        // Calculate opening balance based on previous day's closing balance
        const openingBalance = previousClosingBalances[branch.branchId];

        // Calculate various amounts for the reconciliation
        const actualTotalSales = faker.number.float({ min: 50000, max: 200000, precision: 0.01 });
        const posTransactionsAmount = faker.number.float({ min: 30000, max: 150000, precision: 0.01 });
        const cashTransaction = faker.number.float({ min: 20000, max: 80000, precision: 0.01 });
        const discountsGiven = faker.number.float({ min: 1000, max: 5000, precision: 0.01 });
        const refundsIssued = faker.number.float({ min: 500, max: 3000, precision: 0.01 });
        const turnOver = faker.number.float({ min: 45000, max: 180000, precision: 0.01 });
        const cashWithdrawn = faker.number.float({ min: 5000, max: 25000, precision: 0.01 });
        const transfersIn = faker.number.float({ min: 0, max: 10000, precision: 0.01 });
        const transfersOut = faker.number.float({ min: 0, max: 10000, precision: 0.01 });

        // Calculate expected closing balance based on opening balance and transactions
        const expectedClosingBalance = openingBalance + actualTotalSales - discountsGiven - refundsIssued + transfersIn - transfersOut;

        // Calculate actual closing balance with some variance for realistic reconciliation
        const variance = faker.number.float({ min: -1000, max: 1000, precision: 0.01 });
        const actualClosingBalance = expectedClosingBalance + variance;

        // Update the previous closing balance for next calculation
        previousClosingBalances[branch.branchId] = actualClosingBalance;

        await prisma.reconciliation.create({
          data: {
            serialNumber: `REC-${branch.branchCode}-${date.toISOString().split('T')[0].replace(/-/g, '')}`,
            date: date,
            cashierId: cashier.id,
            cashierName: cashier.name,
            branchId: branch.branchId,
            actualOpeningBalance: openingBalance,
            actualTotalSales: actualTotalSales,
            posTransactionsAmount: posTransactionsAmount,
            cashTransaction: cashTransaction,
            discountsGiven: discountsGiven,
            refundsIssued: refundsIssued,
            turnOver: turnOver,
            cashWithdrawn: cashWithdrawn,
            withdrawalRecipient: faker.person.fullName(),
            withdrawalDetails: faker.lorem.sentence(),
            transfersIn: transfersIn,
            transfersOut: transfersOut,
            transferDetails: faker.lorem.sentence(),
            tellerNo: `TLR${faker.string.numeric(3)}`,
            bankName: faker.finance.accountName(),
            branchLocation: branch.location,
            depositSlipNo: `DS${faker.string.alphanumeric(8)}`,
            expectedClosingBalance: expectedClosingBalance,
            actualClosingBalance: actualClosingBalance,
            overageShortage: variance,
            varianceCategory: variance >= 0 ?
              (variance > 500 ? 'MAJOR_OVERAGE' : (variance > 100 ? 'MINOR_OVERAGE' : 'NO_VARIANCE')) :
              (variance < -500 ? 'MAJOR_SHORTAGE' : (variance < -100 ? 'MINOR_SHORTAGE' : 'NO_VARIANCE')),
            status: 'ACTIVE',
            remarks: faker.lorem.sentence(),
            submittedAt: date,
            submittedBy: users.find(u => u.branchId === branch.branchId)?.id || users[0].id,
            approvalStatus: 'SUBMITTED',
            createdByIp: faker.internet.ip(),
          },
        });
      } else {
        // Update the previous closing balance even when no reconciliation is created
        // This simulates the ongoing balance changes due to daily operations
        const dailyChange = faker.number.float({ min: -5000, max: 10000, precision: 0.01 });
        previousClosingBalances[branch.branchId] += dailyChange;
      }

      // Create cash requisitions occasionally (every 3 days)
      if (date.getDate() % 3 === 0) {
        const requestingUser = users.find(u => u.branchId === branch.branchId)!;

        await prisma.cashRequisition.create({
          data: {
            requisitionNo: `CRQ-${branch.branchCode}-${date.toISOString().split('T')[0].replace(/-/g, '')}-${faker.string.numeric(3)}`,
            title: faker.lorem.sentence({ min: 2, max: 4 }),
            amount: faker.number.float({ min: 10000, max: 100000, precision: 0.01 }),
            category: faker.helpers.arrayElement(['OPERATIONAL', 'TRAVEL', 'SUPPLIES', 'EMERGENCY', 'OTHER']),
            department: faker.commerce.department(),
            purpose: faker.lorem.paragraph(),
            requestedBy: requestingUser.name,
            dateNeeded: date,
            recordedBy: requestingUser.id,
            status: 'RECORDED',
            branchId: branch.branchId,
          },
        });
      }
    }
  }

  // Create audit logs for all operations
  console.log('Creating audit logs...');
  for (const date of dateRange) {
    for (const branch of branches) {
      const user = users.find(u => u.branchId === branch.branchId)!;
      
      // Create multiple audit logs per day per branch
      for (let i = 0; i < 5; i++) {
        await prisma.auditLog.create({
          data: {
            timestamp: new Date(date.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
            userId: user.id,
            action: faker.helpers.arrayElement([
              'CREATE_FUEL_COUPON', 'CREATE_IMPREST', 'CREATE_RECONCILIATION', 
              'CREATE_CASH_REQUISITION', 'UPDATE_USER', 'LOGIN', 'LOGOUT'
            ]),
            module: faker.helpers.arrayElement([
              'FUEL_COUPONS', 'IMPREST', 'RECONCILIATIONS', 
              'CASH_REQUISITIONS', 'USERS', 'AUTHENTICATION'
            ]),
            details: JSON.stringify({
              ip: faker.internet.ip(),
              userAgent: faker.internet.userAgent(),
              description: faker.lorem.sentence(),
            }),
            ipAddress: faker.internet.ip(),
          },
        });
      }
    }
  }

  console.log('Performance data seeding completed!');
  console.log(`Summary:
- ${branches.length} branches created
- ${users.length} users created
- ${cashiers.length} cashiers created
- ${dateRange.length} days of data processed
- $\{(dateRange.length * branches.length)} fuel coupons created
- $\{(dateRange.length * branches.length * 10)} imprest transactions created
- Approximately $\{Math.floor(dateRange.length / 5) * branches.length} reconciliation records created
- Approximately $\{Math.floor(dateRange.length / 3) * branches.length} cash requisitions created
- $\{(dateRange.length * branches.length * 5)} audit logs created
  `);
}

seedData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
