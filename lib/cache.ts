import { unstable_cache } from 'next/cache'

// Cache user data for 5 minutes
export const getCachedUsers = unstable_cache(
  async (page: number, limit: number, role?: string, branchId?: string) => {
    // This would be implemented in the API route
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }
  },
  ['users'],
  { revalidate: 300, tags: ['users'] }
)

// Cache branch data for 10 minutes
export const getCachedBranches = unstable_cache(
  async (page: number, limit: number) => {
    // This would be implemented in the API route
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }
  },
  ['branches'],
  { revalidate: 600, tags: ['branches'] }
)

// Cache cashier data for 5 minutes
export const getCachedCashiers = unstable_cache(
  async (page: number, limit: number, branchId?: string, status?: string) => {
    // This would be implemented in the API route
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }
  },
  ['cashiers'],
  { revalidate: 300, tags: ['cashiers'] }
)

// Cache reconciliation data for 2 minutes (frequently changing data)
export const getCachedReconciliations = unstable_cache(
  async (page: number, limit: number, date?: string, branchId?: string) => {
    // This would be implemented in the API route
    return { data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }
  },
  ['reconciliations'],
  { revalidate: 120, tags: ['reconciliations'] }
)

// Cache single user by ID for 5 minutes
export const getCachedUserById = unstable_cache(
  async (id: string) => {
    // This would be implemented in the API route
    return null
  },
  ['user'],
  { revalidate: 300, tags: ['user'] }
)

// Cache single branch by ID for 10 minutes
export const getCachedBranchById = unstable_cache(
  async (branchId: string) => {
    // This would be implemented in the API route
    return null
  },
  ['branch'],
  { revalidate: 600, tags: ['branch'] }
)

// Cache single cashier by ID for 5 minutes
export const getCachedCashierById = unstable_cache(
  async (id: string) => {
    // This would be implemented in the API route
    return null
  },
  ['cashier'],
  { revalidate: 300, tags: ['cashier'] }
)

// Cache single reconciliation by serial number for 2 minutes
export const getCachedReconciliationBySerial = unstable_cache(
  async (serialNumber: string) => {
    // This would be implemented in the API route
    return null
  },
  ['reconciliation'],
  { revalidate: 120, tags: ['reconciliation'] }
)