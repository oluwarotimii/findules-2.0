# Findules - Financial Operations Management System

A lean financial recording and monitoring system built with Next.js 14, TypeScript, Prisma, and MySQL.

## 🚀 Features

- **User Management** - 2 roles (Staff & Manager) with JWT authentication
- **Cash Requisition** - Record cash requests and mark as paid
- **Cashier Reconciliation** - Daily cash counts with variance tracking
- **Fuel Coupons** - Generate printable fuel authorization PDFs
- **Imprest Management** - Track cash advances and retirements
- **Dashboard & Analytics** - Unified analytics and reporting
- **Branch Management** - Multi-branch support with data isolation

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- MySQL 8.0+

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd findules
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/findules"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
   JWT_SECRET="your-jwt-secret-change-this-in-production"
   ```

4. **Set up the database**
   ```bash
   # Create the database
   mysql -u root -p -e "CREATE DATABASE findules;"
   
   # Run Prisma migrations
   pnpm prisma migrate dev --name init
   
   # Generate Prisma Client
   pnpm prisma generate
   ```

5. **Seed the database (optional)**
   ```bash
   pnpm prisma db seed
   ```

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
findules/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── cash-requisitions/
│   │   ├── reconciliations/
│   │   ├── fuel-coupons/
│   │   ├── imprest/
│   │   └── dashboard/
│   ├── dashboard/           # Dashboard pages
│   ├── requisitions/        # Cash requisition pages
│   ├── reconciliations/     # Reconciliation pages
│   ├── fuel-coupons/        # Fuel coupon pages
│   ├── imprest/             # Imprest pages
│   └── reports/             # Reporting pages
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components
│   ├── dashboard/           # Dashboard components
│   ├── requisitions/        # Requisition components
│   ├── reconciliations/     # Reconciliation components
│   ├── fuel-coupons/        # Fuel coupon components
│   └── imprest/             # Imprest components
├── lib/                     # Utility functions
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Authentication utilities
│   └── utils.ts            # Helper functions
├── prisma/                  # Prisma schema and migrations
│   └── schema.prisma       # Database schema
└── public/                  # Static assets
```

## 🔑 Default Credentials

After seeding the database, you can login with:

- **Email:** admin@findules.com
- **Password:** password

## 🗄️ Database Schema

The system uses the following main tables:

- `users` - User accounts and authentication
- `branches` - Branch/location management
- `cash_requisitions` - Cash request records
- `reconciliations` - Daily cashier reconciliations
- `fuel_coupons` - Fuel authorization coupons
- `imprest` - Cash advance tracking
- `audit_logs` - Complete audit trail

## 🔧 Development Commands

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run Prisma Studio (database GUI)
pnpm prisma studio

# Create a new migration
pnpm prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

## 📊 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** MySQL with Prisma ORM
- **Authentication:** JWT tokens
- **Styling:** Tailwind CSS
- **Charts:** Chart.js with react-chartjs-2
- **PDF Generation:** jsPDF
- **Package Manager:** pnpm

## 🎯 Design Principles

- **Simple Workflow:** Record → Monitor → Report (no complex approvals)
- **Role-Based Access:** Staff (record data) vs Manager (view analytics)
- **Branch Isolation:** Users only see their branch data
- **Auto-Calculations:** All financial fields calculated automatically
- **Complete Audit Trail:** Every action logged
- **Real-Time Tracking:** Instant variance and compliance monitoring

## 📝 License

Proprietary - All rights reserved

## 👥 Support

For support, email support@findules.com or contact your system administrator.
