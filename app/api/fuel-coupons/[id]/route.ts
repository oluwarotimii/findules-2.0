import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import jsPDF from 'jspdf'

// GET: Get single fuel coupon or generate PDF
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
        // Decode the id in case it contains URL-encoded characters
        const documentCode = decodeURIComponent(id)

        // Check if this is a request for PDF generation
        const url = new URL(request.url)
        const format = url.searchParams.get('format')

        if (format === 'pdf') {
            return await generatePdf(documentCode, user)
        }

        // Otherwise, return the fuel coupon data
        const fuelCoupon = await prisma.fuelCoupon.findUnique({
            where: { documentCode: documentCode },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
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

        // Role-based access
        if (user.role !== 'MANAGER' && fuelCoupon.branchId !== user.branchId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json(fuelCoupon)

    } catch (error) {
        console.error('Error fetching fuel coupon:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to generate PDF
async function generatePdf(documentCode: string, user: any) {
    const fuelCoupon = await prisma.fuelCoupon.findUnique({
        where: { documentCode: documentCode },
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

    // Role-based access
    if (user.role !== 'MANAGER' && fuelCoupon.branchId !== user.branchId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate PDF - using a5 format (half of A4)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // 148mm x 210mm (half of A4: 210mm x 297mm)
    })

    // Header - More compact
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('FUEL AUTHORIZATION COUPON', 74, 8, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Findules Financial Operations', 74, 12, { align: 'center' })

    // Document Code
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Code: ${fuelCoupon.documentCode}`, 10, 17)

    // Horizontal line
    doc.setLineWidth(0.3)
    doc.line(10, 19, 138, 19)

    // Coupon Details - Very compact layout
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    let yPos = 22
    const lineHeight = 5 // Very compact line height

    // Row 1: Date and Staff
    doc.setFont('helvetica', 'bold')
    doc.text('Date:', 10, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(fuelCoupon.date).toLocaleDateString(), 22, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Staff:', 75, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(fuelCoupon.staffName, 87, yPos)

    yPos += lineHeight
    // Row 2: Dept and Branch
    doc.setFont('helvetica', 'bold')
    doc.text('Dept:', 10, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(fuelCoupon.department, 22, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Branch:', 75, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(fuelCoupon.branch.branchName, 90, yPos)

    yPos += lineHeight
    // Row 3: Unit and Fuel Type
    if (fuelCoupon.unit) {
        doc.setFont('helvetica', 'bold')
        doc.text('Unit:', 10, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.unit, 22, yPos)
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Fuel:', 75, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(fuelCoupon.fuelType, 87, yPos)

    yPos += lineHeight
    // Row 4: Vehicle and Plate
    if (fuelCoupon.vehicleType) {
        doc.setFont('helvetica', 'bold')
        doc.text('Veh:', 10, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.vehicleType, 22, yPos)
    }

    if (fuelCoupon.plateNumber) {
        doc.setFont('helvetica', 'bold')
        doc.text('Plate:', 75, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(fuelCoupon.plateNumber, 87, yPos)
    }

    yPos += lineHeight
    // Row 5: Qty and Est. Amount
    doc.setFont('helvetica', 'bold')
    doc.text('Qty:', 10, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${fuelCoupon.quantityLitres.toString()} L`, 20, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Est.:', 75, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`₦${Number(fuelCoupon.estimatedAmount).toLocaleString()}`, 87, yPos)

    // Purpose - if exists (use minimal space)
    if (fuelCoupon.purpose) {
        yPos += lineHeight + 1
        doc.setFont('helvetica', 'bold')
        doc.text('Purp.:', 10, yPos)
        yPos += lineHeight
        doc.setFont('helvetica', 'normal')
        const purposeLines = doc.splitTextToSize(fuelCoupon.purpose, 128)
        doc.text(purposeLines, 10, yPos)
        yPos += purposeLines.length * (lineHeight - 1) // Even more compact for purpose lines
    }

    // Signature section - very compact
    yPos += lineHeight + 3
    doc.setLineWidth(0.2)
    doc.line(15, yPos, 55, yPos)  // Shorter lines
    doc.line(93, yPos, 133, yPos)

    doc.setFontSize(6)
    yPos += 2.5
    doc.text('Ass.to', 15, yPos)
    doc.text('Auth.By', 93, yPos)

    yPos += 2.5
    doc.text(fuelCoupon.staffName?.substring(0, 10) + (fuelCoupon.staffName?.length > 10 ? '..' : ''), 15, yPos)
    doc.text(fuelCoupon.creator.name?.substring(0, 10) + (fuelCoupon.creator.name?.length > 10 ? '..' : ''), 93, yPos)

    // Validity Note - compact and at the bottom
    yPos += 7
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('NB: Use same day only', 74, yPos, { align: 'center' })
    yPos += 2.5
    doc.setFont('helvetica', 'normal')
    doc.text('Valid for issue date', 74, yPos, { align: 'center' })

    // Convert to buffer (removed the generated on text)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Update PDF generated flag
    await prisma.fuelCoupon.update({
        where: { documentCode: documentCode },
        data: { pdfGenerated: true }
    })

    return new NextResponse(pdfBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fuelCoupon.documentCode}.pdf"`
        }
    })
}

// DELETE: Delete fuel coupon (admin only)
export async function DELETE(
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

        // Only managers can delete
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const { id } = await params
        const documentCode = decodeURIComponent(id)

        const fuelCoupon = await prisma.fuelCoupon.findUnique({
            where: { documentCode: documentCode }
        })

        if (!fuelCoupon) {
            return NextResponse.json({ error: 'Fuel coupon not found' }, { status: 404 })
        }

        await prisma.fuelCoupon.delete({
            where: { documentCode: documentCode }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'DELETE_FUEL_COUPON',
                    module: 'FUEL_COUPON',
                    details: { documentCode: documentCode, staffName: fuelCoupon.staffName },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the fuel coupon deletion if audit log creation fails
        }

        return NextResponse.json({ message: 'Fuel coupon deleted successfully' })

    } catch (error) {
        console.error('Error deleting fuel coupon:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}