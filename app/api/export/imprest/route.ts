import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { convertToCSV, convertToExcel, formatDateForExport, formatCurrencyForExport } from '@/lib/export-utils'

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
        const format = searchParams.get('format') || 'csv'
        const status = searchParams.get('status')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const where: any = {}

        if (user.role !== 'MANAGER' && user.branchId) {
            where.branchId = user.branchId
        }

        if (status && status !== 'ALL') {
            where.status = status
        }

        if (startDate || endDate) {
            where.dateIssued = {}
            if (startDate) where.dateIssued.gte = new Date(startDate)
            if (endDate) where.dateIssued.lte = new Date(endDate)
        }

        const imprest = await prisma.imprest.findMany({
            where,
            include: {
                issuer: { select: { name: true } },
                retirer: { select: { name: true } },
                branch: { select: { branchName: true } }
            },
            orderBy: { dateIssued: 'desc' }
        })

        const exportData = imprest.map((i: any) => ({
            'Imprest No': i.imprestNo,
            'Staff Name': i.staffName,
            'Amount': formatCurrencyForExport(Number(i.amount)),
            'Category': i.category,
            'Purpose': i.purpose,
            'Date Issued': formatDateForExport(i.dateIssued),
            'Status': i.status,
            'Date Retired': i.dateRetired ? formatDateForExport(i.dateRetired) : '',
            'Amount Spent': i.amountSpent ? formatCurrencyForExport(Number(i.amountSpent)) : '',
            'Balance': i.balance ? formatCurrencyForExport(Number(i.balance)) : '',
            'Issued By': i.issuer.name,
            'Retired By': i.retirer?.name || '',
            'Branch': i.branch.branchName
        }))

        if (format === 'excel') {
            const buffer = convertToExcel(exportData, 'Imprest')
            const uint8Array = new Uint8Array(buffer)
            return new NextResponse(uint8Array, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="imprest_${new Date().toISOString().split('T')[0]}.xlsx"`
                }
            })
        } else {
            const headers = Object.keys(exportData[0] || {})
            const csv = convertToCSV(exportData, headers)
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="imprest_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

    } catch (error) {
        console.error('Error exporting imprest:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
