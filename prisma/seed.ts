import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log(' Starting database seed...\n')

    // Check if HQ branch exists, if not create it
    let hqBranch = await prisma.branch.findFirst({
        where: { branchCode: 'HQ' }
    })

    if (!hqBranch) {
        console.log('📍 Creating HQ branch...')
        hqBranch = await prisma.branch.create({
            data: {
                branchId: 'BR-HQ',
                branchName: 'Head Office',
                branchCode: 'HQ',
                location: 'Headquarters',
                status: 'ACTIVE'
            }
        })
        console.log(' HQ branch created\n')
    } else {
        console.log(' HQ branch already exists\n')
    }

    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@findules.com' }
    })

    if (existingAdmin) {
        console.log(' Admin user already exists')
        console.log(`   Email: admin@findules.com`)
        console.log(`   Branch: ${hqBranch.branchName}\n`)
    } else {
        console.log('👤 Creating admin user...')

        // Hash password
        const passwordHash = await bcrypt.hash('password', 10)

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                name: 'System Administrator',
                email: 'admin@findules.com',
                passwordHash: passwordHash,
                role: 'MANAGER',
                branchId: hqBranch.branchId,
                status: 'ACTIVE'
            }
        })

        console.log(' Admin user created')
        console.log(`   Email: admin@findules.com`)
        console.log(`   Password: password`)
        console.log(`   Role: MANAGER`)
        console.log(`   Branch: ${hqBranch.branchName}\n`)
    }

    console.log(' Seed completed successfully!\n')
    console.log(' Login credentials:')
    console.log('   Email: admin@findules.com')
    console.log('   Password: password\n')
}

main()
    .catch((e) => {
        console.error(' Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
