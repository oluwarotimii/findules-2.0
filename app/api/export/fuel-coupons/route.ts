import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { convertToCSV, convertToExcel, formatDateForExport, formatCurrencyForExport } from '@/lib/export-utils'
import { FuelCoupon } from '@prisma/client'

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
        const fuelType = searchParams.get('fuelType')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const where: any = {}

        if (user.role !== 'MANAGER' && user.branchId) {
            where.branchId = user.branchId
        }

        if (fuelType && fuelType !== 'ALL') {
            where.fuelType = fuelType
        }

        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const fuelCoupons = await prisma.fuelCoupon.findMany({
            where,
            include: {
                creator: { select: { name: true } },
                branch: { select: { branchName: true } }
            },
            orderBy: { date: 'desc' }
        })

        const exportData = fuelCoupons.map((fc: FuelCoupon & { creator: { name: string }, branch: { branchName: string } }) => ({
            'Document Code': fc.documentCode,
            'Date': formatDateForExport(fc.date),
            'Staff Name': fc.staffName,
            'Department': fc.department,
            'Unit': fc.unit || '',
            'Vehicle Type': fc.vehicleType || '',
            'Plate Number': fc.plateNumber || '',
            'Fuel Type': fc.fuelType,
            'Quantity (Litres)': formatCurrencyForExport(Number(fc.quantityLitres)),
            'Estimated Amount': formatCurrencyForExport(Number(fc.estimatedAmount)),
            'Purpose': fc.purpose || '',
            'Created By': fc.creator.name,
            'Branch': fc.branch.branchName
        }))

        if (format === 'excel') {
            const buffer = convertToExcel(exportData, 'Fuel Coupons')
            const uint8Array = new Uint8Array(buffer)
            return new NextResponse(uint8Array, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="fuel_coupons_${new Date().toISOString().split('T')[0]}.xlsx"`
                }
            })
        } else {
            const headers = Object.keys(exportData[0] || {})
            const csv = convertToCSV(exportData, headers)
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="fuel_coupons_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

    } catch (error) {
        console.error('Error exporting fuel coupons:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
