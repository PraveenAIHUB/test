# Oracle Cloud Free Tier - Complete Setup Guide

## 🎯 Overview

This guide will help you set up a **FREE Oracle Autonomous Database** for the Property Pro application.

**What You Get (Always Free):**
- ✅ 2 Autonomous Databases (20GB each)
- ✅ 2 Compute VMs
- ✅ 200GB Block Storage
- ✅ 10GB Object Storage
- ✅ **NO CREDIT CARD REQUIRED** after trial period

---

## 📋 Step 1: Sign Up for Oracle Cloud Free Tier

### 1.1 Create Account

1. Go to: **https://www.oracle.com/cloud/free/**
2. Click **"Start for free"**
3. Fill in your information:
   - Email address
   - Country/Territory
   - First and Last Name
4. Click **"Verify my email"**
5. Check your email and click the verification link

### 1.2 Complete Registration

1. Choose **"Individual"** or **"Company"** account type
2. Enter your address details
3. Enter phone number for verification
4. **Credit Card**: Required for verification but **NOT CHARGED**
   - You'll get $300 in free credits for 30 days
   - After 30 days, you keep the Always Free resources
   - You won't be charged unless you upgrade
5. Review and accept the terms
6. Click **"Start my free trial"**

### 1.3 Wait for Provisioning

- Account provisioning takes 2-5 minutes
- You'll receive an email when ready
- You'll be redirected to the Oracle Cloud Console

---

## 📋 Step 2: Create Autonomous Database

### 2.1 Navigate to Autonomous Database

1. Login to Oracle Cloud Console: **https://cloud.oracle.com**
2. Click the **hamburger menu** (☰) in the top left
3. Navigate to: **Oracle Database → Autonomous Database**
4. Make sure you're in the correct region (top right)

### 2.2 Create Database

1. Click **"Create Autonomous Database"**
2. Fill in the details:

   **Basic Information:**
   - **Compartment**: Keep default (root)
   - **Display Name**: `PropertyProDB`
   - **Database Name**: `PROPDB`

   **Workload Type:**
   - Select: **Transaction Processing (ATP)**

   **Deployment Type:**
   - Select: **Shared Infrastructure**

   **Always Free:**
   - ✅ **IMPORTANT: Toggle "Always Free" to ON**
   - This ensures you won't be charged

   **Database Configuration:**
   - **OCPU Count**: 1 (fixed for Always Free)
   - **Storage (TB)**: 0.02 (20GB - fixed for Always Free)
   - **Auto Scaling**: OFF (not available for Always Free)

   **Administrator Credentials:**
   - **Username**: `ADMIN` (default, cannot change)
   - **Password**: Create a strong password
     - Example: `PropertyPro2024!`
     - **SAVE THIS PASSWORD!** You'll need it later

   **Network Access:**
   - Select: **Secure access from everywhere**
   - (You can restrict this later for production)

   **License Type:**
   - Select: **License Included**

3. Click **"Create Autonomous Database"**

### 2.3 Wait for Provisioning

- Status will show **"PROVISIONING"** (orange)
- Takes 2-3 minutes
- Status will change to **"AVAILABLE"** (green) when ready

---

## 📋 Step 3: Download Wallet (Connection Credentials)

### 3.1 Access Database Details

1. Click on your database name **"PropertyProDB"**
2. You'll see the database details page

### 3.2 Download Wallet

1. Click **"Database Connection"** button
2. In the popup, click **"Download Wallet"**
3. Create a wallet password:
   - Example: `WalletPass2024!`
   - **SAVE THIS PASSWORD!**
4. Click **"Download"**
5. Save the ZIP file: `Wallet_PROPDB.zip`
6. **DO NOT UNZIP IT YET**

---

## 📋 Step 4: Set Up Application Connection

### 4.1 Create Wallet Directory

```bash
# Navigate to your project
cd property-pro-app/backend

# Create wallet directory
mkdir -p wallet

# Move the downloaded wallet ZIP to this directory
# (Replace the path with your actual download location)
mv ~/Downloads/Wallet_PROPDB.zip wallet/

# Unzip the wallet
cd wallet
unzip Wallet_PROPDB.zip
cd ..
```

### 4.2 Get Connection String

1. In Oracle Cloud Console, on your database page
2. Click **"Database Connection"**
3. Under **"Connection Strings"**, you'll see several options:
   - `propdb_high` - For high priority/performance
   - `propdb_medium` - For medium priority (recommended)
   - `propdb_low` - For low priority batch jobs

4. Copy the connection string for **`propdb_medium`**
   - Example: `(description= (retry_count=20)(retry_delay=3)...)`

### 4.3 Update .env File

Edit `property-pro-app/backend/.env`:

```env
# Oracle Database Configuration
DB_USER=ADMIN
DB_PASSWORD=PropertyPro2024!
DB_CONNECTION_STRING=propdb_medium
DB_WALLET_LOCATION=./wallet
DB_WALLET_PASSWORD=WalletPass2024!

# Pool Configuration
DB_POOL_MIN=1
DB_POOL_MAX=10
DB_POOL_INCREMENT=1

# JWT Configuration (keep existing)
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
```

**Replace:**
- `PropertyPro2024!` with your actual ADMIN password
- `WalletPass2024!` with your actual wallet password

---

## 📋 Step 5: Run Database Scripts

### 5.1 Connect to Database

```bash
# Install Oracle Instant Client (if not already installed)
# macOS:
brew install oracle-instantclient

# Or download from: https://www.oracle.com/database/technologies/instant-client/downloads.html
```

### 5.2 Run Schema Scripts

```bash
cd property-pro-app/database

# Set environment variables
export TNS_ADMIN=../backend/wallet
export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH

# Connect to database
sqlplus ADMIN/PropertyPro2024!@propdb_medium

# Run scripts in order:
SQL> @schema/01_create_tables.sql
SQL> @schema/02_create_sequences.sql
SQL> @schema/03_create_indexes.sql
SQL> @data/01_sample_data.sql

# Exit
SQL> exit
```

---

## 📋 Step 6: Test Connection

### 6.1 Start Backend

```bash
cd property-pro-app/backend
npm run dev
```

### 6.2 Check Logs

You should see:
```
✅ Oracle Database connected successfully
Server running on port 3000
```

### 6.3 Test API

```bash
curl http://localhost:3000/api/properties
```

You should get real data from the database!

---

## 📋 Step 7: Start Frontend

```bash
cd property-pro-app/frontend
npm run dev
```

Open browser: **http://localhost:5173**

---

## ✅ Verification Checklist

- [ ] Oracle Cloud account created
- [ ] Autonomous Database created (Always Free enabled)
- [ ] Database status is "AVAILABLE" (green)
- [ ] Wallet downloaded and unzipped
- [ ] .env file updated with credentials
- [ ] Database scripts executed successfully
- [ ] Backend connects to database
- [ ] API returns real data
- [ ] Frontend displays real data

---

## 🔧 Troubleshooting

### Issue: "Wallet not found"
**Solution:**
- Check wallet path in .env: `DB_WALLET_LOCATION=./wallet`
- Ensure wallet files are in `backend/wallet/` directory

### Issue: "Invalid username/password"
**Solution:**
- Double-check ADMIN password in .env
- Password is case-sensitive

### Issue: "Connection timeout"
**Solution:**
- Check network access settings in Oracle Cloud
- Ensure "Secure access from everywhere" is enabled

### Issue: "TNS: could not resolve the connect identifier"
**Solution:**
- Check connection string in .env
- Should be just the service name: `propdb_medium`
- Not the full connection string

---

## 📚 Additional Resources

- **Oracle Cloud Free Tier**: https://www.oracle.com/cloud/free/
- **Autonomous Database Docs**: https://docs.oracle.com/en/cloud/paas/autonomous-database/
- **Node.js Oracle Driver**: https://oracle.github.io/node-oracledb/

---

## 🎉 Success!

Once completed, your Property Pro application will be running with a **real Oracle Autonomous Database in the cloud** - completely FREE!

**Next Steps:**
1. Test all CRUD operations
2. Add more sample data
3. Configure backups (automatic in Autonomous DB)
4. Set up monitoring and alerts
5. Deploy to production!

---

**Need Help?** Check the Oracle Cloud documentation or contact Oracle Support (free with Always Free tier).

