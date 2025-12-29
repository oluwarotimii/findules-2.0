# Findules - Multi-Branch Imprest Tracking System

## Fresh Setup (Automatic)

### 1. Reset Database
```bash
npx prisma migrate reset --force --skip-seed
```

This automatically creates:
- **HQ Branch** (Branch Code: HQ)
- **Admin User**:
  - Email: `admin@findules`
  - Password: `password`
  - Role: MANAGER
  - Branch: HQ

### 2. Login
- Go to `http://localhost:3000`
- Login with:
  - Email: `admin@findules`
  - Password: `password`

### 3. Start Using
1. Go to **Branches** → Create more branches & set opening balances
2. Go to **Users** → Create users (staff, branch admins, managers)
3. Done!

---

## System Overview

### User Roles
- **MANAGER**: Full access, manages users & balances
- **BRANCH_ADMIN**: Imprest only for their branch
- **STAFF**: Dashboard, reconciliations, fuel coupons, imprest

### Key Features
- Branch-specific imprest balances
- Automatic balance tracking (issue/retire)
- Role-based access control
- User management
- Branch balance management (in Branches page)

---

## Quick Commands

```bash
# Reset database (creates admin automatically)
npx prisma migrate reset --force --skip-seed

# Run migrations only
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Start dev server
pnpm dev
```

---

**Default Admin Credentials:**
- Email: `admin@findules`
- Password: `password`

Change password after first login! 🔒
