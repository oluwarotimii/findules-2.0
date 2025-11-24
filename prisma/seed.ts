import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create Branches
    console.log('📍 Creating branches...')
    const hqBranch = await prisma.branch.upsert({
        where: { branchId: 'BR-001' },
        update: {},
        create: {
            branchId: 'BR-001',
            branchName: 'Headquarters - Lagos',
            branchCode: 'HQ',
            location: 'Lagos, Nigeria',
            status: 'ACTIVE',
        },
    })

    const branch1 = await prisma.branch.upsert({
        where: { branchId: 'BR-002' },
        update: {},
        create: {
            branchId: 'BR-002',
            branchName: 'Abuja Branch',
            branchCode: 'ABJ',
            location: 'Abuja, Nigeria',
            status: 'ACTIVE',
        },
    })

    const branch2 = await prisma.branch.upsert({
        where: { branchId: 'BR-003' },
        update: {},
        create: {
            branchId: 'BR-003',
            branchName: 'Port Harcourt Branch',
            branchCode: 'PH',
            location: 'Port Harcourt, Nigeria',
            status: 'ACTIVE',
        },
    })

    console.log('✅ Branches created')

    // Create Users
    console.log('👥 Creating users...')
    const hashedPassword = await bcrypt.hash('password', 12)

    // Manager User
    const manager = await prisma.user.upsert({
        where: { email: 'admin@findules.com' },
        update: {},
        create: {
            id: 'USR-001',
            name: 'Admin Manager',
            email: 'admin@findules.com',
            passwordHash: hashedPassword,
            role: 'MANAGER',
            branchId: hqBranch.branchId,
            status: 'ACTIVE',
        },
    })

    // Staff User - HQ
    const staff1 = await prisma.user.upsert({
        where: { email: 'staff@findules.com' },
        update: {},
        create: {
            id: 'USR-002',
            name: 'John Staff',
            email: 'staff@findules.com',
            passwordHash: hashedPassword,
            role: 'STAFF',
            branchId: hqBranch.branchId,
            status: 'ACTIVE',
        },
    })

    // Staff User - Abuja
    const staff2 = await prisma.user.upsert({
        where: { email: 'staff.abuja@findules.com' },
        update: {},
        create: {
            id: 'USR-003',
            name: 'Jane Accountant',
            email: 'staff.abuja@findules.com',
            passwordHash: hashedPassword,
            role: 'STAFF',
            branchId: branch1.branchId,
            status: 'ACTIVE',
        },
    })

    // Manager User - Port Harcourt
    const manager2 = await prisma.user.upsert({
        where: { email: 'manager.ph@findules.com' },
        update: {},
        create: {
            id: 'USR-004',
            name: 'Michael Manager',
            email: 'manager.ph@findules.com',
            passwordHash: hashedPassword,
            role: 'MANAGER',
            branchId: branch2.branchId,
            status: 'ACTIVE',
        },
    })

    console.log('✅ Users created')

    // Create Sample Cash Requisitions
    console.log('💰 Creating sample cash requisitions...')
    await prisma.cashRequisition.create({
        data: {
            requisitionNo: 'REQ-2025-11-0001',
            title: 'Office Supplies Purchase',
            amount: 25000.00,
            category: 'SUPPLIES',
            department: 'Operations',
            purpose: 'Monthly stationery and office supplies for 10 staff members',
            requestedBy: 'John Staff',
            dateNeeded: new Date('2025-11-25'),
            recordedBy: staff1.id,
            branchId: hqBranch.branchId,
            status: 'RECORDED',
        },
    })

    await prisma.cashRequisition.create({
        data: {
            requisitionNo: 'REQ-2025-11-0002',
            title: 'Travel Expenses - Client Meeting',
            amount: 50000.00,
            category: 'TRAVEL',
            department: 'Sales',
            purpose: 'Travel to Abuja for client presentation and meeting',
            requestedBy: 'Jane Accountant',
            dateNeeded: new Date('2025-11-22'),
            recordedBy: staff2.id,
            branchId: branch1.branchId,
            status: 'PAID',
            paymentDate: new Date('2025-11-21'),
            paymentMethod: 'BANK_TRANSFER',
            paymentReference: 'TRF-20251121-001',
            amountPaid: 50000.00,
            paidBy: manager.id,
        },
    })

    console.log('✅ Sample requisitions created')

    // Create Sample Fuel Coupon
    console.log('⛽ Creating sample fuel coupon...')
    await prisma.fuelCoupon.create({
        data: {
            documentCode: 'FM-AC/2025/0001',
            date: new Date('2025-11-21'),
            staffName: 'John Staff',
            department: 'Operations',
            unit: 'Logistics',
            vehicleType: 'Toyota Hilux',
            plateNumber: 'ABC-123-XY',
            purpose: 'Field visit to Ibadan for site inspection',
            fuelType: 'DIESEL',
            quantityLitres: 50,
            estimatedAmount: 45000.00,
            createdBy: staff1.id,
            branchId: hqBranch.branchId,
            pdfGenerated: false,
        },
    })

    console.log('✅ Sample fuel coupon created')

    // Create Sample Imprest
    console.log('💵 Creating sample imprest...')
    await prisma.imprest.create({
        data: {
            imprestNo: 'IMP-2025-11-0001',
            staffName: 'John Staff',
            amount: 15000.00,
            category: 'TRANSPORT',
            purpose: 'Travel to Port Harcourt for client meeting',
            dateIssued: new Date('2025-11-20'),
            issuedBy: manager.id,
            branchId: hqBranch.branchId,
            status: 'ISSUED',
        },
    })

    await prisma.imprest.create({
        data: {
            imprestNo: 'IMP-2025-11-0002',
            staffName: 'Jane Accountant',
            amount: 10000.00,
            category: 'MEALS',
            purpose: 'Team lunch for monthly meeting',
            dateIssued: new Date('2025-11-15'),
            issuedBy: manager2.id,
            branchId: branch1.branchId,
            status: 'RETIRED',
            dateRetired: new Date('2025-11-16'),
            amountSpent: 9500.00,
            balance: 500.00,
            retirementNotes: 'All receipts attached',
            retiredBy: staff2.id,
        },
    })

    console.log('✅ Sample imprest created')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Default Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Manager (HQ):')
    console.log('  Email: admin@findules.com')
    console.log('  Password: password')
    console.log('\nStaff (HQ):')
    console.log('  Email: staff@findules.com')
    console.log('  Password: password')
    console.log('\nStaff (Abuja):')
    console.log('  Email: staff.abuja@findules.com')
    console.log('  Password: password')
    console.log('\nManager (Port Harcourt):')
    console.log('  Email: manager.ph@findules.com')
    console.log('  Password: password')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
