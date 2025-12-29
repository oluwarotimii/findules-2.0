import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeBranchBalances() {
    try {
        console.log('Fetching all branches...')

        // Get all active branches
        const branches = await prisma.branch.findMany({
            where: {
                status: 'ACTIVE'
            }
        })

        console.log(`Found ${branches.length} active branches`)

        // Initialize balance for each branch
        for (const branch of branches) {
            // Check if balance already exists
            const existingBalance = await prisma.branchBalance.findUnique({
                where: { branchId: branch.branchId }
            })

            if (existingBalance) {
                console.log(`✓ Branch ${branch.branchName} already has a balance`)
                continue
            }

            // Create initial balance (you can change the default amount)
            const initialAmount = 100000 // Default 100,000 NGN

            const branchBalance = await prisma.branchBalance.create({
                data: {
                    branchId: branch.branchId,
                    openingBalance: initialAmount,
                    currentBalance: initialAmount
                }
            })

            // Create transaction record
            await prisma.branchBalanceTransaction.create({
                data: {
                    branchBalanceId: branchBalance.id,
                    transactionType: 'OPENING_BALANCE',
                    amount: initialAmount,
                    balanceBefore: 0,
                    balanceAfter: initialAmount,
                    performedBy: 'SYSTEM', // You can change this to an actual user ID
                    notes: 'Initial opening balance - auto-generated'
                }
            })

            console.log(`✓ Created balance for ${branch.branchName}: ₦${initialAmount.toLocaleString()}`)
        }

        console.log('\n✅ All branch balances initialized successfully!')

        // Display summary
        const allBalances = await prisma.branchBalance.findMany({
            include: {
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        console.log('\n📊 Branch Balance Summary:')
        console.log('─'.repeat(60))
        allBalances.forEach(balance => {
            console.log(`${balance.branch.branchName} (${balance.branch.branchCode}):`)
            console.log(`  Opening: ₦${Number(balance.openingBalance).toLocaleString()}`)
            console.log(`  Current: ₦${Number(balance.currentBalance).toLocaleString()}`)
            console.log(`  Issued:  ₦${Number(balance.totalIssued).toLocaleString()}`)
            console.log(`  Retired: ₦${Number(balance.totalRetired).toLocaleString()}`)
            console.log('─'.repeat(60))
        })

    } catch (error) {
        console.error('Error initializing branch balances:', error)
    } finally {
        await prisma.$disconnect()
    }
}

initializeBranchBalances()
