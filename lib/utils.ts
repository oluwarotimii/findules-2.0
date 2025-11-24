/**
 * Generate requisition number in format: REQ-YYYY-MM-XXXX
 */
export function generateRequisitionNumber(count: number): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const sequence = String(count + 1).padStart(4, '0')
    return `REQ-${year}-${month}-${sequence}`
}

/**
 * Generate reconciliation serial number in format: REC-YYYY-MM-XXXX
 */
export function generateReconciliationNumber(count: number): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const sequence = String(count + 1).padStart(4, '0')
    return `REC-${year}-${month}-${sequence}`
}

/**
 * Generate fuel coupon document code in format: FM-AC/YYYY/XXXX
 */
export function generateFuelCouponCode(count: number): string {
    const now = new Date()
    const year = now.getFullYear()
    const sequence = String(count + 1).padStart(4, '0')
    return `FM-AC/${year}/${sequence}`
}

/**
 * Generate imprest number in format: IMP-YYYY-MM-XXXX
 */
export function generateImprestNumber(count: number): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const sequence = String(count + 1).padStart(4, '0')
    return `IMP-${year}-${month}-${sequence}`
}

/**
 * Format currency in Nigerian Naira
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d)
}

/**
 * Calculate variance category based on amount
 */
export function calculateVarianceCategory(variance: number): string {
    const absVariance = Math.abs(variance)

    if (absVariance <= 500) {
        return 'NO_VARIANCE'
    } else if (absVariance <= 5000) {
        return variance < 0 ? 'MINOR_SHORTAGE' : 'MINOR_OVERAGE'
    } else if (absVariance <= 50000) {
        return variance < 0 ? 'MAJOR_SHORTAGE' : 'MAJOR_OVERAGE'
    } else {
        return variance < 0 ? 'CRITICAL_SHORTAGE' : 'CRITICAL_OVERAGE'
    }
}

/**
 * Check if imprest is overdue (>30 days)
 */
export function isImprestOverdue(dateIssued: Date): boolean {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - dateIssued.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 30
}
