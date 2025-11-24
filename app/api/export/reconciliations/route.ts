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
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query
        const where: any = {}

        if (user.role !== 'MANAGER' && user.branchId) {
            where.branchId = user.branchId
        }

        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const reconciliations = await prisma.reconciliation.findMany({
            where,
            include: {
                cashier: { select: { name: true } },
                branch: { select: { branchName: true } }
            },
            orderBy: { date: 'desc' }
        })

        // Format data for export
        const exportData = reconciliations.map(r => ({
            'Serial Number': r.serialNumber,
            'Date': formatDateForExport(r.date),
            'Cashier': r.cashierName,
            'Branch': r.branch.branchName,
            'Expected Opening': formatCurrencyForExport(r.expectedOpeningBalance),
            'Actual Opening': formatCurrencyForExport(r.actualOpeningBalance),
            'Total Receipts': formatCurrencyForExport(r.totalReceipts),
            'Total Payments': formatCurrencyForExport(r.totalPayments),
            'Expected Closing': formatCurrencyForExport(r.expectedClosingBalance),
            'Actual Closing': formatCurrencyForExport(r.actualClosingBalance),
            'Variance': formatCurrencyForExport(r.variance),
            'Variance Category': r.varianceCategory
        }))

        if (format === 'excel') {
            const buffer = convertToExcel(exportData, 'Reconciliations')
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="reconciliations_${new Date().toISOString().split('T')[0]}.xlsx"`
                }
            })
        } else {
            const headers = Object.keys(exportData[0] || {})
            const csv = convertToCSV(exportData, headers)
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="reconciliations_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

    } catch (error) {
        console.error('Error exporting reconciliations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
