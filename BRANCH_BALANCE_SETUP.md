# Branch Balance Setup Guide

## Quick Setup Steps

### Step 1: Initialize Branch Balances (As Manager)

Since the branch balance page is empty, you need to create opening balances for each branch first.

**Option A: Using the API (Recommended)**

1. Open your browser's Developer Console (F12)
2. Go to the Console tab
3. Run this code (replace `BRANCH_ID` with actual branch IDs):

```javascript
// Get your token
const token = localStorage.getItem('token');

// List of branches to initialize (get branch IDs from your database)
const branches = [
    { branchId: 'BR001', amount: 100000 },  // Replace with actual branch ID
    { branchId: 'BR002', amount: 150000 },  // Replace with actual branch ID
    { branchId: 'BR003', amount: 200000 },  // Replace with actual branch ID
];

// Initialize each branch
for (const branch of branches) {
    fetch('/api/branch-balance', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            branchId: branch.branchId,
            amount: branch.amount,
            notes: 'Initial opening balance'
        })
    })
    .then(res => res.json())
    .then(data => console.log(`✓ Created balance for ${branch.branchId}:`, data))
    .catch(err => console.error(`✗ Error for ${branch.branchId}:`, err));
}
```

**Option B: Using Prisma Studio**

1. Run: `npx prisma studio`
2. Open the `branches` table and note down the `branchId` values
3. Go to `branch_balances` table
4. Click "Add record" for each branch
5. Fill in:
   - `branchId`: (select from dropdown)
   - `openingBalance`: 100000 (or your desired amount)
   - `currentBalance`: 100000 (same as opening)
   - Leave other fields as default

### Step 2: Find Your Branch IDs

Run this in the browser console to see all branches:

```javascript
const token = localStorage.getItem('token');
fetch('/api/branches', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    console.log('Available Branches:');
    data.forEach(b => console.log(`- ${b.branchName} (ID: ${b.branchId})`));
});
```

---

## What You'll See as a Manager

### Branch Balance Page
- Grid of cards showing all branches
- Each card displays:
  - **Branch Name & Code**
  - **Opening Balance**: Initial amount set
  - **Current Balance**: Available funds (Opening + Top-ups - Issued + Retired)
  - **Total Issued**: Sum of all imprest issued
  - **Total Retired**: Sum of all imprest retired (unspent amounts)
  - **Top Up Button**: Add more funds to the branch

### Imprest Page
- See imprest from ALL branches
- Can issue imprest (deducts from your branch's balance)
- Can retire imprest (adds back unspent amount)

---

## What Branch Admin Sees

### Imprest Page Only
- **Branch Balance Card** at the top showing:
  - Opening Balance
  - Current Balance (how much they can issue)
  - Total Issued
  - Total Retired
- **Issue Imprest Button**: Creates new imprest
  - System checks if sufficient balance
  - If yes: Imprest created, balance deducted
  - If no: Error message shows available vs requested
- **Retire Imprest**: Returns unspent amount to balance

### No Access To:
- Reconciliations
- Fuel Coupons
- Branch Balance Management
- Cashiers
- Branches
- Reports
- Settings

---

## Example Workflow

### Manager Sets Up Branch A
1. Login as Manager
2. Go to "Branch Balance"
3. (If empty) Use browser console to initialize
4. See Branch A card with ₦100,000 opening balance
5. Click "Top Up Balance" to add ₦50,000
6. Branch A now has ₦150,000 current balance

### Branch Admin Issues Imprest
1. Login as Branch Admin (Branch A)
2. See only "Imprest" menu
3. See balance card: Current Balance = ₦150,000
4. Click "Issue Imprest"
5. Enter: Staff Name, ₦20,000, Category, Purpose
6. Submit
7. Balance card updates: Current Balance = ₦130,000
8. Total Issued = ₦20,000

### Staff Retires Imprest
1. Branch Admin clicks "Retire" on the imprest
2. Enter: Amount Spent = ₦15,000
3. Submit
4. Balance card updates:
   - Current Balance = ₦135,000 (₦130,000 + ₦5,000 unspent)
   - Total Retired = ₦5,000

---

## Troubleshooting

### "Branch balance not initialized"
- Manager needs to create opening balance first
- Use browser console method above

### "Insufficient branch balance"
- Current balance is less than requested amount
- Manager needs to top up the branch balance

### Branch Balance page is empty
- No balances created yet
- Follow Step 1 above to initialize

### Cannot issue imprest as branch admin
- Check if branch balance exists for your branch
- Check if current balance > 0
- Contact manager to top up if needed
