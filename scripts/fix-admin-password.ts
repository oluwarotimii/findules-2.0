import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixAdminPassword() {
    // Generate fresh hash for "password"
    const passwordHash = bcrypt.hashSync('password', 10)

    console.log('Generated hash:', passwordHash)

    // Update admin user
    const result = await prisma.user.updateMany({
        where: {
            email: 'admin@findules.com'
        },
        data: {
            passwordHash: passwordHash
        }
    })

    console.log('Updated users:', result.count)

    // Verify
    const user = await prisma.user.findUnique({
        where: { email: 'admin@findules.com' }
    })

    if (user) {
        console.log('User found:', user.email)
        console.log('Hash length:', user.passwordHash.length)
        console.log('Hash starts with:', user.passwordHash.substring(0, 20))

        // Test the password
        const isValid = bcrypt.compareSync('password', user.passwordHash)
        console.log('Password test:', isValid ? '✅ VALID' : '❌ INVALID')
    }

    await prisma.$disconnect()
}

fixAdminPassword()
