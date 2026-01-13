import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    // Connection pool settings are handled automatically by Prisma
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
