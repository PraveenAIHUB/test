# Oracle Database Setup – Property Pro

This guide walks you through creating an Oracle database and connecting the Property Pro backend to it.

---

## Oracle Cloud (quick path)

If you want to use **Oracle Cloud Free Tier** only, follow **[Oracle Cloud steps](#option-c-oracle-cloud-free-tier-autonomous-database)** below. Summary:

1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
2. Create an **Autonomous Database** (Transaction Processing, Shared).
3. **Download Wallet** from the DB page → DB Connection → Download Wallet; unzip into `backend/wallet/`.
4. In **Database Actions** (SQL), run `database/scripts/01_create_user.sql` as **ADMIN**, then run the three schema scripts as **propertypro**.
5. In `backend/.env` set **DB_USER**, **DB_PASSWORD**, **DB_CONNECTION_STRING** (full TNS from wallet `tnsnames.ora`, e.g. the `propertypro_medium` entry) and **TNS_ADMIN=./wallet**.
6. From `backend` run `node server.js`; you should see the Oracle connection pool message and can log in with **admin** / **admin123**.

---

## Choose Your Oracle Option

| Option | Best for | Effort |
|--------|----------|--------|
| **A. Docker (Oracle XE)** | Local dev on any OS | Low – one command |
| **B. Oracle XE installer** | Local dev, no Docker | Medium – download & install |
| **C. Oracle Cloud Free Tier** | Production-like, free cloud DB | Medium – sign up & create ADB |

---

## Option A: Oracle Database XE in Docker (recommended for dev)

### 1. Install Docker

- Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).
- Start Docker and ensure it’s running.

### 2. Run Oracle XE container

In PowerShell (or Command Prompt):

```powershell
docker run -d --name propertypro-oracle `
  -p 1521:1521 `
  -e ORACLE_PASSWORD=YourPassword123 `
  -e ORACLE_CHARACTERSET=AL32UTF8 `
  container-registry.oracle.com/database/express:latest
```

- Wait 2–5 minutes for the database to be ready.
- Default connection:
  - **Host:** localhost  
  - **Port:** 1521  
  - **Service name:** XEPDB1 (pluggable database; use this for the app)  
  - **User (app):** create in Step 3 below  
  - **System password:** `YourPassword123` (from `ORACLE_PASSWORD`)

### 3. Create application user and run schema

Connect as system and create the app user, then run the project’s schema and data scripts.

**Using SQL*Plus (if installed):**

```powershell
# Create user (run once)
sqlplus system/YourPassword123@localhost:1521/XEPDB1 @database\scripts\01_create_user.sql

# Run schema and data (from project root)
sqlplus propertypro/YourPassword123@localhost:1521/XEPDB1 @database\schema\01_create_tables.sql
sqlplus propertypro/YourPassword123@localhost:1521/XEPDB1 @database\schema\02_sample_data.sql
sqlplus propertypro/YourPassword123@localhost:1521/XEPDB1 @database\schema\03_seed_users.sql
```

**Using SQL Developer (no SQL*Plus):**

1. Download [Oracle SQL Developer](https://www.oracle.com/tools/downloads/sqldev-downloads.html).
2. New connection:
   - **Name:** Property Pro – System  
   - **Username:** system  
   - **Password:** YourPassword123  
   - **Hostname:** localhost  
   - **Port:** 1521  
   - **SID:** leave empty; choose **Service name:** XEPDB1  
3. Run the SQL in `database/scripts/01_create_user.sql` (as system).
4. Create a second connection for user **propertypro** / **YourPassword123** / **XEPDB1**.
5. Open and run in order:
   - `database/schema/01_create_tables.sql`
   - `database/schema/02_sample_data.sql`
   - `database/schema/03_seed_users.sql`

### 4. Configure backend

Copy the example env file and set Oracle settings:

```powershell
cd backend
copy .env.example .env
# Edit .env and set:
```

In `backend/.env`:

```env
DB_USER=propertypro
DB_PASSWORD=YourPassword123
DB_CONNECTION_STRING=localhost:1521/XEPDB1
```

### 5. Start backend and verify

```powershell
cd backend
node server.js
```

You should see:

- `Oracle Database connection pool created successfully`
- `Database connection test successful`

Then call: `http://localhost:3000/health` and log in with **admin** / **admin123** (after running `03_seed_users.sql`).

---

## Option B: Oracle XE installed on Windows

### 1. Install Oracle Database XE

1. Download: [Oracle Database 21c XE](https://www.oracle.com/database/technologies/xe-downloads.html) (or 23c XE when available).
2. Run the installer and set the **system** password when prompted.
3. Default listener port: **1521**; default database **SID:** **XE**.  
   If the installer creates a pluggable database (e.g. **XEPDB1**), use that **service name** in the connection string instead of **XE**.

### 2. Create app user and run schema

- Use **SQL*Plus** or **SQL Developer** as in Option A, Step 3.
- Connection:
  - **Host:** localhost  
  - **Port:** 1521  
  - **Service name:** XEPDB1 (or **XE** if no PDB).  
- Run `database/scripts/01_create_user.sql` as **system**, then run the three schema/seed scripts as **propertypro**.

### 3. Configure backend

Same as Option A, Step 4. Use the same **DB_USER**, **DB_PASSWORD**, and **DB_CONNECTION_STRING** (e.g. `localhost:1521/XEPDB1` or `localhost:1521/XE`).

---

## Option C: Oracle Cloud Free Tier (Autonomous Database)

### 1. Create Autonomous Database

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) and sign up (or sign in).
2. In the OCI console: **☰ Menu** → **Oracle Database** → **Autonomous Database**.
3. Click **Create Autonomous Database**.
4. Choose:
   - **Compartment:** (default or create one)
   - **Display name:** e.g. `PropertyPro`
   - **Database name:** e.g. `PROPERTYPRO` (letters/numbers only)
   - **Workload type:** Transaction Processing
   - **Deployment type:** Shared infrastructure
   - **Create administrator credentials:** choose a strong **password** and note it (this is the **ADMIN** user).
5. Under **Choose a license type**, select **License included** (Always Free eligible).
6. Click **Create Autonomous Database**. Wait until **State** is **Available** (a few minutes).

### 2. Download wallet and get connection string

1. Open your Autonomous Database; click **DB Connection**.
2. Click **Download Wallet**.
3. Set a **wallet password** (remember it; you don’t need it for Property Pro, but keep the file safe).
4. Download and **unzip** the wallet (e.g. `Wallet_PROPERTYPRO.zip`) to a folder.
5. Copy **all** files from the unzipped folder into your project:  
   `property-pro-app/backend/wallet/`  
   You should see at least: `tnsnames.ora`, `sqlnet.ora`, `keystore.jks`, `truststore.jks`, `cwallet.sso`, etc.
6. Open **tnsnames.ora** in a text editor. You’ll see several entries like `propertypro_high`, `propertypro_medium`, `propertypro_low`. Pick one (e.g. **propertypro_medium**). The value is a long `(description=...)` string. You will use either:
   - The **alias name** as connect string (e.g. `propertypro_medium`) **and** set `TNS_ADMIN=./wallet`, or  
   - The **full description** (the entire `(description=...)` block) as `DB_CONNECTION_STRING` and still set `TNS_ADMIN=./wallet`.

### 3. Create app user and run schema

1. On the Autonomous Database page, click **Database Actions** (or **Tools** → **Open Database Actions**).
2. Log in with username **ADMIN** and the admin password you set.
3. In the left menu, open **SQL**.
4. Run the contents of **`database/scripts/01_create_user.sql`** (replace `YourPassword123` with a strong password for the **propertypro** user). This creates user **propertypro** and grants privileges.
5. Sign out (user menu → Sign out), then sign in again with:
   - Username: **propertypro**
   - Password: (the one you set in the script)
6. In **SQL**, run these in order (copy/paste or open each file and run):
   - **`database/schema/01_create_tables.sql`**
   - **`database/schema/02_sample_data.sql`**
   - **`database/schema/03_seed_users.sql`**

### 4. Configure backend

1. In the project, go to **`backend/`** and ensure the **`wallet`** folder is there with the wallet files.
2. Copy **`.env.example`** to **`.env`** if you haven’t already.
3. Edit **`backend/.env`** and set:

```env
DB_USER=propertypro
DB_PASSWORD=YourChosenPasswordForPropertypro
# Use the TNS alias (e.g. propertypro_medium) OR the full (description=...) from tnsnames.ora
DB_CONNECTION_STRING=propertypro_medium
TNS_ADMIN=./wallet
```

- **DB_CONNECTION_STRING:** Either the alias (e.g. `propertypro_medium`) or the full connect descriptor from `tnsnames.ora`. The backend uses the wallet in `./wallet` (via `TNS_ADMIN`) to resolve it.
- **TNS_ADMIN:** Must be `./wallet` when running the server from the **backend** directory.

### 5. Start backend and verify

From the **backend** directory:

```powershell
cd backend
node server.js
```

You should see:

- `✅ Oracle Database connection pool created successfully`
- `✅ Database connection test successful`

Then open the app (e.g. http://localhost:5173) and log in with **admin** / **admin123**.

---

## Create-user script (run as SYSTEM)

Save as `database/scripts/01_create_user.sql` and run once as **system** (replace password and username if needed):

```sql
-- Run as SYSTEM (or ADMIN on Oracle Cloud)
CREATE USER propertypro IDENTIFIED BY "YourPassword123";
GRANT CONNECT, RESOURCE TO propertypro;
GRANT CREATE SESSION TO propertypro;
GRANT CREATE TABLE TO propertypro;
GRANT CREATE SEQUENCE TO propertypro;
GRANT CREATE VIEW TO propertypro;
GRANT UNLIMITED TABLESPACE TO propertypro;
```

---

## Connection string reference

| Environment | DB_CONNECTION_STRING example |
|-------------|-------------------------------|
| Docker XE (PDB) | `localhost:1521/XEPDB1` |
| Local XE (SID) | `localhost:1521/XE` |
| Oracle Cloud ADB | Full TNS entry from `tnsnames.ora` (and set `TNS_ADMIN=./wallet`) |

---

## Troubleshooting

- **Backend starts but no “connection pool created”**  
  Check that `DB_USER`, `DB_PASSWORD`, and `DB_CONNECTION_STRING` are all set in `backend/.env`. If any is missing, the app uses mock data and does not connect to Oracle.

- **ORA-01017: invalid username/password**  
  Verify user and password; ensure the user was created and granted the privileges above.

- **Connection refused / NJS-503**  
  Ensure the DB is running (Docker container up, or Oracle service started). Check host, port, and service name.

- **Wallet / TNS (Cloud)**  
  Ensure `TNS_ADMIN` points to the folder containing `tnsnames.ora` and `sqlnet.ora`, and that you’re using the full description from `tnsnames.ora` as `DB_CONNECTION_STRING`.

---

## Summary checklist

- [ ] Oracle database created (Docker / XE / Cloud).
- [ ] User **propertypro** created and granted privileges.
- [ ] `01_create_tables.sql` run.
- [ ] `02_sample_data.sql` run.
- [ ] `03_seed_users.sql` run (for admin login).
- [ ] `backend/.env` has `DB_USER`, `DB_PASSWORD`, `DB_CONNECTION_STRING` (and `TNS_ADMIN` for Cloud).
- [ ] Backend starts and logs “Oracle Database connection pool created successfully”.
- [ ] Login with **admin** / **admin123** works.

After this, the Property Pro project is using the Oracle database you created.
