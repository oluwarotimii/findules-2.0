import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import jsPDF from 'jspdf'

// GET: Generate PDF for fuel coupon
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { id } = await params

        const fuelCoupon = await prisma.fuelCoupon.findUnique({
            where: { documentCode: id },
            include: {
                creator: {
                    select: {
                        name: true
                    }
                },
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        if (!fuelCoupon) {
            return NextResponse.json({ error: 'Fuel coupon not found' }, { status: 404 })
        }

        // Generate PDF - A5 size (half of A4)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5' // 148mm x 210mm
        })

        // Header
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('FUEL AUTHORIZATION COUPON', 74, 15, { align: 'center' })

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Findules Financial Operations', 74, 22, { align: 'center' })

        // Document Code
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Document Code: ${fuelCoupon.documentCode}`, 15, 35)

        // Horizontal line
        doc.setLineWidth(0.5)
        doc.line(15, 40, 133, 40)

        // Coupon Details
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        let yPos = 50

        // Left column
        doc.setFont('helvetica', 'bold')
        doc.text('Date:', 15, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(new Date(fuelCoupon.date).toLocaleDateString(), 45, yPos)

        yPos += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Staff Name:', 15, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.staffName, 45, yPos)

        yPos += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Department:', 15, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.department, 45, yPos)

        if (fuelCoupon.unit) {
            yPos += 8
            doc.setFont('helvetica', 'bold')
            doc.text('Unit:', 15, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(fuelCoupon.unit, 45, yPos)
        }

        yPos += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Branch:', 15, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.branch.branchName, 45, yPos)

        // Right column
        yPos = 50

        if (fuelCoupon.vehicleType) {
            doc.setFont('helvetica', 'bold')
            doc.text('Vehicle Type:', 80, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(fuelCoupon.vehicleType, 110, yPos)
            yPos += 8
        }

        if (fuelCoupon.plateNumber) {
            doc.setFont('helvetica', 'bold')
            doc.text('Plate Number:', 80, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(fuelCoupon.plateNumber, 110, yPos)
            yPos += 8
        }

        doc.setFont('helvetica', 'bold')
        doc.text('Fuel Type:', 80, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.fuelType, 110, yPos)

        yPos += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Quantity:', 80, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(`${fuelCoupon.quantityLitres.toString()} Litres`, 110, yPos)

        yPos += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Est. Amount:', 80, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(`₦${Number(fuelCoupon.estimatedAmount).toLocaleString()}`, 110, yPos)

        // Purpose
        if (fuelCoupon.purpose) {
            yPos += 15
            doc.setFont('helvetica', 'bold')
            doc.text('Purpose:', 15, yPos)
            yPos += 6
            doc.setFont('helvetica', 'normal')
            const purposeLines = doc.splitTextToSize(fuelCoupon.purpose, 118)
            doc.text(purposeLines, 15, yPos)
            yPos += purposeLines.length * 6
        }

        // Signature section
        yPos += 20
        doc.setLineWidth(0.3)
        doc.line(15, yPos, 60, yPos)
        doc.line(88, yPos, 133, yPos)

        yPos += 4
        doc.setFontSize(8)
        doc.text('Assigned to', 15, yPos)
        doc.text('Authorized By', 88, yPos)

        yPos += 4
        doc.text(`(${fuelCoupon.staffName})`, 15, yPos)
        doc.text(`(${fuelCoupon.creator.name})`, 88, yPos)

        // Validity Note
        yPos += 15
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('NB: Fuel coupon must be used the same day.', 74, yPos, { align: 'center' })
        yPos += 4
        doc.setFont('helvetica', 'normal')
        doc.text('Coupons are only valid for the date issued.', 74, yPos, { align: 'center' })

        // Footer
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.text(`Generated on ${new Date().toLocaleString()}`, 74, 200, { align: 'center' })

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Update PDF generated flag
        await prisma.fuelCoupon.update({
            where: { documentCode: id },
            data: { pdfGenerated: true }
        })

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fuelCoupon.documentCode}.pdf"`
            }
        })

    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
