import * as XLSX from 'xlsx'

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: any[], headers: string[]): string {
    if (data.length === 0) return headers.join(',')

    const csvRows = [headers.join(',')]

    data.forEach(item => {
        const row = headers.map(header => {
            let value = item[header]

            // Handle null/undefined
            if (value === null || value === undefined) return ''

            // Convert to string
            value = String(value)

            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`
            }

            return value
        })
        csvRows.push(row.join(','))
    })

    return csvRows.join('\r\n')
}

/**
 * Convert data array to Excel buffer
 */
export function convertToExcel(data: any[], sheetName: string = 'Sheet1'): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    return Buffer.from(excelBuffer)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-GB') // DD/MM/YYYY format
}

/**
 * Format currency for export (remove symbols, keep numbers)
 */
export function formatCurrencyForExport(amount: number | string): string {
    return Number(amount).toFixed(2)
}
