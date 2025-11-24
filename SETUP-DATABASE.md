# Phase 2: Database Setup with XAMPP

Follow these steps to set up the database for Findules:

## Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** (for phpMyAdmin)
3. Start **MySQL**
4. Wait for both to show "Running" status

## Step 2: Create Database

### Option A: Using phpMyAdmin (Recommended)
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on "SQL" tab at the top
3. Copy and paste the contents of `setup-database.sql`
4. Click "Go" to execute
5. You should see: "Database 'findules' created successfully!"

### Option B: Using MySQL Command Line
```bash
# Navigate to XAMPP MySQL bin directory
cd C:\xampp\mysql\bin

# Login to MySQL (press Enter when asked for password if no password set)
mysql -u root -p

# Run the setup script
source C:\Users\Administrator\Desktop\CODE\msc\findules\setup-database.sql

# Or create manually:
CREATE DATABASE findules CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 3: Run Prisma Migrations
This will create all the tables in your database:

```bash
# In your project directory
cd c:\Users\Administrator\Desktop\CODE\msc\findules

# Generate Prisma Client
pnpm prisma generate

# Push the schema to database (creates all tables)
pnpm prisma db push
```

## Step 4: Seed the Database
This will add default users and sample data:

```bash
pnpm db:seed
```

You should see output like:
```
🌱 Starting database seed...
📍 Creating branches...
✅ Branches created
👥 Creating users...
✅ Users created
💰 Creating sample cash requisitions...
✅ Sample requisitions created
⛽ Creating sample fuel coupon...
✅ Sample fuel coupon created
💵 Creating sample imprest...
✅ Sample imprest created
🎉 Database seeding completed successfully!

📋 Default Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Manager (HQ):
  Email: admin@findules.com
  Password: password

Staff (HQ):
  Email: staff@findules.com
  Password: password
...
```

## Step 5: Verify Database
1. Go back to phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on "findules" database in the left sidebar
3. You should see these tables:
   - users
   - branches
   - cash_requisitions
   - reconciliations
   - fuel_coupons
   - imprest
   - audit_logs
   - _prisma_migrations

## Troubleshooting

### Error: "Can't connect to MySQL server"
- Make sure MySQL is running in XAMPP
- Check if port 3306 is not blocked by firewall
- Verify `.env` file has correct connection string

### Error: "Access denied for user 'root'"
If your XAMPP MySQL has a password, update `.env`:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/findules"
```

### Error: "Database does not exist"
- Make sure you completed Step 2 successfully
- Check phpMyAdmin to see if "findules" database exists

## Next Steps
After successful database setup, you can:
1. Run the development server: `pnpm dev`
2. Open http://localhost:3000
3. Login with the default credentials
4. Start building the authentication system!
