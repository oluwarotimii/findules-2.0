import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate fuel coupon code
export function generateFuelCouponCode(count: number): string {
  // Create a date code in the format YYYYMMDD
  const now = new Date();
  const dateCode = now.toISOString().split('T')[0].replace(/-/g, '');

  // Pad the count with leading zeros to ensure consistent length
  const paddedCount = (count + 1).toString().padStart(4, '0');

  // Return in format: FC-{date}-{sequence}
  return `FC-${dateCode}-${paddedCount}`;
}

// Function to generate imprest number
export function generateImprestNumber(count: number): string {
  // Create a date code in the format YYYY-MM
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed

  // Pad the count with leading zeros to ensure consistent length
  const paddedCount = (count + 1).toString().padStart(4, '0');

  // Return in format: IMP-YYYY-MM-XXXX
  return `IMP-${year}-${month}-${paddedCount}`;
}

// Function to generate cash requisition number
export function generateRequisitionNumber(count: number): string {
  // Create a date code in the format YYYY-MM
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Pad the count with leading zeros to ensure consistent length
  const paddedCount = (count + 1).toString().padStart(4, '0');

  // Return in format: REQ-YYYY-MM-XXXX
  return `REQ-${year}-${month}-${paddedCount}`;
}

// Function to generate reconciliation number
export function generateReconciliationNumber(count: number): string {
  // Create a date code in the format YYYY-MM
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Pad the count with leading zeros to ensure consistent length
  const paddedCount = (count + 1).toString().padStart(4, '0');

  // Return in format: REC-YYYY-MM-XXXX
  return `REC-${year}-${month}-${paddedCount}`;
}

// Function to calculate variance category based on the variance amount
export function calculateVarianceCategory(variance: number): string {
  const absVariance = Math.abs(variance);

  if (variance === 0) {
    // Exactly zero variance
    return 'NO_VARIANCE';
  } else if (absVariance <= 50) {
    // Up to 50 naira is considered minor variance
    return variance < 0 ? 'MINOR_SHORTAGE' : 'MINOR_OVERAGE';
  } else if (absVariance <= 200) {
    // Between 51 and 200 naira is major variance
    return variance < 0 ? 'MAJOR_SHORTAGE' : 'MAJOR_OVERAGE';
  } else {
    // Over 200 naira is critical variance
    return variance < 0 ? 'CRITICAL_SHORTAGE' : 'CRITICAL_OVERAGE';
  }
}