import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: List cashiers
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const branchId = searchParams.get('branchId')
        const status = searchParams.get('status')

        const where: any = {}
        if (branchId) where.branchId = branchId
        if (status) where.status = status

        // If user is STAFF, maybe restrict? But this API is mainly for Managers.
        // However, the Reconciliation form needs to list cashiers, so STAFF might need access too?
        // Actually, the Accountant (User) fills the form. They are STAFF or MANAGER.
        // So both should be able to list cashiers.

        const cashiers = await prisma.cashier.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                branch: {
                    select: { branchName: true }
                }
            }
        })

        return NextResponse.json(cashiers)

    } catch (error) {
        console.error('Error fetching cashiers:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create cashier
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 })
        }

        const body = await request.json()
        const { name, branchId } = body

        if (!name || !branchId) {
            return NextResponse.json({ error: 'Name and Branch ID are required' }, { status: 400 })
        }

        // Verify that the user exists before creating the cashier
        const verifiedUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!verifiedUser) {
            return NextResponse.json(
                { error: 'User not found. Please log in again.' },
                { status: 401 }
            )
        }

        // Verify that the branch exists
        const branch = await prisma.branch.findUnique({
            where: { branchId }
        })

        if (!branch) {
            console.error(`Branch with ID ${branchId} does not exist`);
            return NextResponse.json({ error: 'Invalid branch selected' }, { status: 400 })
        }

        console.log("Cashier payload:", {
            name,
            branchId,
            status: 'ACTIVE'
        });

        console.log(`Attempting to create cashier with branchId: ${branchId}`);
        console.log(`Branch exists:`, branch);

        let cashier;
        try {
            cashier = await prisma.cashier.create({
                data: {
                    name,
                    branchId,
                    status: 'ACTIVE'
                }
            })

            console.log("Cashier created successfully:", cashier);
        } catch (createError) {
            console.error('Cashier creation failed:', createError);
            console.error('Details: name:', name, 'branchId:', branchId);

            // Check if branch exists at the moment of failure
            const checkBranch = await prisma.branch.findUnique({
                where: { branchId }
            });
            console.log('Branch check at time of error:', checkBranch);

            throw createError; // Re-throw to be caught by the main catch block
        }

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE_CASHIER',
                    module: 'USER_MANAGEMENT',
                    details: { cashierId: cashier.id, name: cashier.name },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the cashier creation if audit log creation fails
        }

        return NextResponse.json(cashier)

    } catch (error) {
        console.error('Error creating cashier:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
