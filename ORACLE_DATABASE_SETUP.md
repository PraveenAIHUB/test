# Oracle Database Setup Guide

> **Quick path:** For step-by-step instructions to **create** an Oracle database and connect this project, see **[ORACLE_SETUP_GUIDE.md](ORACLE_SETUP_GUIDE.md)** (Docker, XE, and Oracle Cloud).

## Prerequisites

1. **Oracle Database** - One of the following:
   - Oracle Database 19c or later (on-premises)
   - Oracle Autonomous Database (Cloud)
   - Oracle Database Express Edition (XE) for development

2. **Oracle Instant Client** - Already configured in the project
   - The `oracledb` npm package uses Oracle Instant Client
   - No additional installation needed for Thin mode

---

## Option 1: Oracle Autonomous Database (Recommended for Production)

### Step 1: Create Autonomous Database on OCI

1. Log in to Oracle Cloud Infrastructure (OCI)
2. Navigate to **Autonomous Database** → **Create Autonomous Database**
3. Choose:
   - **Workload Type**: Transaction Processing (ATP)
   - **Deployment Type**: Shared Infrastructure
   - **Database Name**: `PROPERTYPRO`
   - **Display Name**: Property Pro Database
   - **Admin Password**: Set a strong password

4. Click **Create Autonomous Database**

### Step 2: Download Wallet

1. Once the database is provisioned, click **DB Connection**
2. Click **Download Wallet**
3. Set a wallet password
4. Extract the wallet ZIP file to: `property-pro-app/backend/wallet/`

### Step 3: Update Environment Variables

Edit `property-pro-app/backend/.env`:

```env
# Oracle Database Configuration
DB_USER=ADMIN
DB_PASSWORD=your_admin_password
DB_CONNECTION_STRING=(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=your-adb-host.oraclecloud.com))(connect_data=(service_name=your_service_name))(security=(ssl_server_dn_match=yes)))

# Wallet Configuration
TNS_ADMIN=./wallet
```

### Step 4: Run Database Scripts

```bash
cd property-pro-app/database
sqlplus admin/your_password@your_service_name @schema/01_create_tables.sql
sqlplus admin/your_password@your_service_name @schema/02_create_sequences.sql
sqlplus admin/your_password@your_service_name @data/01_sample_data.sql
```

---

## Option 2: Oracle Database Express Edition (XE) - Development

### Step 1: Install Oracle XE

1. Download Oracle Database XE from: https://www.oracle.com/database/technologies/xe-downloads.html
2. Install Oracle XE
3. Default connection:
   - **Host**: localhost
   - **Port**: 1521
   - **SID**: XE
   - **Username**: system
   - **Password**: (set during installation)

### Step 2: Create Application User

```sql
-- Connect as SYSTEM
sqlplus system/your_password@localhost:1521/XE

-- Create application user
CREATE USER propertypro IDENTIFIED BY "YourStrongPassword123!";

-- Grant privileges
GRANT CONNECT, RESOURCE TO propertypro;
GRANT CREATE SESSION TO propertypro;
GRANT CREATE TABLE TO propertypro;
GRANT CREATE SEQUENCE TO propertypro;
GRANT CREATE VIEW TO propertypro;
GRANT UNLIMITED TABLESPACE TO propertypro;
```

### Step 3: Update Environment Variables

Edit `property-pro-app/backend/.env`:

```env
# Oracle Database Configuration
DB_USER=propertypro
DB_PASSWORD=YourStrongPassword123!
DB_CONNECTION_STRING=localhost:1521/XE
```

### Step 4: Run Database Scripts

```bash
cd property-pro-app/database
sqlplus propertypro/YourStrongPassword123!@localhost:1521/XE @schema/01_create_tables.sql
sqlplus propertypro/YourStrongPassword123!@localhost:1521/XE @schema/02_create_sequences.sql
sqlplus propertypro/YourStrongPassword123!@localhost:1521/XE @data/01_sample_data.sql
```

---

## Option 3: Oracle Cloud Free Tier

### Step 1: Sign Up for Oracle Cloud Free Tier

1. Go to: https://www.oracle.com/cloud/free/
2. Sign up for Oracle Cloud Free Tier (Always Free resources)
3. Create an Autonomous Database (Always Free tier)

### Step 2: Follow Option 1 Steps

Follow the same steps as **Option 1: Oracle Autonomous Database**

---

## Verify Database Connection

### Test Connection from Backend

```bash
cd property-pro-app/backend
npm run dev
```

Check the console output:
- ✅ `Oracle Database connection pool created successfully` - Connection successful
- ❌ `Error creating database connection pool` - Connection failed

### Test with SQL*Plus

```bash
sqlplus your_username/your_password@your_connect_string
```

### Test with SQL Developer

1. Download Oracle SQL Developer
2. Create a new connection:
   - **Name**: Property Pro
   - **Username**: your_username
   - **Password**: your_password
   - **Connection Type**: Basic or TNS
   - **Hostname**: your_host
   - **Port**: 1521 (or 1522 for ATP)
   - **Service Name**: your_service_name

---

## Database Schema Overview

The application uses the following tables:

1. **PROPERTIES** - Property master data
2. **TENANTS** - Tenant information
3. **LEASES** - Lease agreements
4. **RENT_SCHEDULE** - Rent payment schedules
5. **ASSETS** - Property assets (HVAC, elevators, etc.)
6. **WORK_ORDERS** - Maintenance work orders
7. **VENDORS** - Vendor information
8. **FINANCIAL_TRANSACTIONS** - Financial transactions

---

## Troubleshooting

### Connection Refused Error

**Error**: `NJS-503: connection to host 127.0.0.1 port 1521 could not be established`

**Solutions**:
1. Verify Oracle Database is running
2. Check firewall settings
3. Verify connection string in `.env`
4. For ATP, ensure wallet is properly configured

### Invalid Username/Password

**Error**: `ORA-01017: invalid username/password`

**Solutions**:
1. Verify credentials in `.env`
2. Check if user exists: `SELECT username FROM dba_users;`
3. Reset password if needed

### Wallet Configuration Issues (ATP)

**Error**: `NJS-516: unable to load the Oracle Client library`

**Solutions**:
1. Verify wallet files are in `backend/wallet/` directory
2. Check `TNS_ADMIN` environment variable
3. Ensure `sqlnet.ora` and `tnsnames.ora` are present

---

## Next Steps

Once the database is connected:

1. ✅ All modules will use real database data instead of mock data
2. ✅ Create/Edit/Delete operations will persist to the database
3. ✅ Advanced features like reporting and analytics will work
4. ✅ Oracle ERP integration can be configured

---

**Current Status**: Application is running with **mock data fallback**. Connect to Oracle Database to enable full functionality.

