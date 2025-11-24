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