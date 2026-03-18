# Deploy Property Pro on OCI Free Tier (Single Method)

This guide uses **one approach**: an **Always Free Compute VM** running the app in **Docker**, with an optional **Always Free Autonomous Database**. Everything stays within OCI Free Tier.

---

## What you get

- **Compute**: 1 Always Free VM (Oracle Linux or Ubuntu).
- **Database** (optional): Always Free Autonomous Database.
- **App**: Property Pro API + React UI on port **3000**, reachable via the VM’s public IP.

---

## Prerequisites

- Oracle Cloud account (Free Tier: https://www.oracle.com/cloud/free/).
- Your app code in a Git repo (GitHub/GitLab) or a way to copy the project to the VM (e.g. SCP, zip).

---

## Step 1: Create a VCN (if you don’t have one)

1. In OCI Console: **Networking → Virtual Cloud Networks**.
2. Click **Start VCN Wizard** → **Create VCN with Internet Connectivity**.
3. Name: e.g. `propertypro-vcn`. Use default CIDR. Click **Next** → **Create**.
4. Note the **public subnet** (you’ll use it for the VM).

---

## Step 2: Create an Always Free Compute Instance

1. **Compute → Instances → Create Instance**.
2. **Name**: `propertypro-vm`.
3. **Placement**: Keep default (or pick an Always Free–eligible AD).
4. **Image and shape**:
   - **Image**: Oracle Linux 8 or Ubuntu 22.04 (Always Free eligible).
   - **Shape**: **VM.Standard.E2.1.Micro** (Always Free).
5. **Networking**: Select the VCN and **public subnet**; ensure **“Assign a public IPv4 address”** is checked.
6. **Add SSH keys**: Upload your public key or generate a pair and save the private key.
7. Click **Create**. Wait until the instance state is **Running**. Note the **Public IP**.

---

## Step 3: Open port 3000 (and keep SSH)

1. **Networking → Virtual Cloud Networks** → your VCN → **Security Lists** → default security list.
2. **Add Ingress Rules** (if not already present):
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination port range**: **22** (SSH) and **3000** (app).
   - Add one rule for 22 and one for 3000, or a single rule with “22, 3000” if your UI allows it.
3. Save.

---

## Step 4: (Optional) Create Always Free Autonomous Database

1. **Oracle Database → Autonomous Database → Create Autonomous Database**.
2. **Compartment**: Choose your compartment.
3. **Display name**: e.g. `propertypro-db`.
4. **Workload type**: Transaction Processing (or Data Warehouse).
5. **Deployment type**: Shared Infrastructure.
6. **Configuration**: **Always Free**.
7. **Create administrator credentials**: set and save **username** and **password**.
8. **Network access**: “Allow secure access from everywhere” (or restrict to your VCN later).
9. Create the database. When it’s **Available**, go to **DB Connection** → **Download Wallet**. Download the ZIP and keep it; you’ll extract it on the VM.

---

## Step 5: SSH into the VM and install Docker

1. From your computer:
   ```bash
   ssh -i /path/to/your-private-key opc@<VM_PUBLIC_IP>
   ```
   (Use `ubuntu@<VM_PUBLIC_IP>` if you chose Ubuntu.)

2. Install Docker (Oracle Linux 8):
   ```bash
   sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   sudo dnf install -y docker-ce docker-ce-cli containerd.io
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   ```
   Log out and SSH back in so the `docker` group applies.

   **Ubuntu 22.04:**
   ```bash
   sudo apt update && sudo apt install -y ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io
   sudo usermod -aG docker $USER
   ```
   Log out and SSH back in.

3. Install Git (if you’ll clone the repo):
   ```bash
   sudo dnf install -y git   # Oracle Linux
   # or: sudo apt install -y git   # Ubuntu
   ```

---

## Step 6: Get the app on the VM

**Option A – Clone from Git (recommended)**

```bash
cd ~
git clone https://github.com/YOUR_ORG/property-pro-app.git
cd property-pro-app
```

**Option B – Copy from your machine with SCP**

From your **local machine** (in the project root):

```bash
scp -i /path/to/your-private-key -r property-pro-app opc@<VM_PUBLIC_IP>:~/
```

Then on the VM:

```bash
cd ~/property-pro-app
```

---

## Step 7: Configure environment and Oracle wallet (if using ADB)

1. Create backend `.env` from the example:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `.env`:
   ```bash
   nano backend/.env
   ```
   Set at least:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DB_USER=<your_ADB_admin_username>`
   - `DB_PASSWORD=<your_ADB_admin_password>`
   - `DB_CONNECTION_STRING=propertypro_high` (or the TNS alias from the wallet; often ends with `_high`, `_medium`, or `_tp`)
   - `TNS_ADMIN=/app/wallet` (path inside the container; we’ll mount the wallet there)
   - `JWT_SECRET=<generate a long random string>`

   If you are **not** using a database yet, leave `DB_USER`, `DB_PASSWORD`, and `DB_CONNECTION_STRING` empty; the app will run with mock data.

3. **If using Autonomous Database**: copy the wallet to the VM and extract it.
   - On your computer: unzip the wallet ZIP and upload the **extracted folder** to the VM, e.g.:
     ```bash
     scp -i /path/to/your-private-key -r /path/to/extracted/wallet opc@<VM_PUBLIC_IP>:~/property-pro-app/wallet
     ```
   - On the VM, confirm:
     ```bash
     ls ~/property-pro-app/wallet
     ```
     You should see `tnsnames.ora`, `cwallet.sso`, etc.

---

## Step 8: Build and run the app with Docker

On the VM, go to the directory that contains the **Dockerfile** and both **frontend** and **backend** folders (e.g. `~/property-pro-app` or `~/property-pro-app/property-pro-app` if your repo has a nested structure). Then run:

1. Build the image:
   ```bash
   docker build -t property-pro .
   ```

2. Run the container (with wallet if using ADB):
   ```bash
   # If using Oracle ADB (wallet in ~/property-pro-app/wallet):
   docker run -d \
     --name property-pro \
     --restart unless-stopped \
     -p 3000:3000 \
     -v $(pwd)/wallet:/app/wallet:ro \
     -e TNS_ADMIN=/app/wallet \
     --env-file backend/.env \
     property-pro
   ```

   **Without database / without wallet:**
   ```bash
   docker run -d \
     --name property-pro \
     --restart unless-stopped \
     -p 3000:3000 \
     --env-file backend/.env \
     property-pro
   ```

3. Check that it’s running:
   ```bash
   docker ps
   docker logs property-pro
   ```

4. Test on the VM:
   ```bash
   curl -s http://localhost:3000/health
   ```

---

## Step 9: Open the app in your browser

- URL: **http://&lt;VM_PUBLIC_IP&gt;:3000**
- Replace `<VM_PUBLIC_IP>` with the instance’s public IP from Step 2.
- You should see the Property Pro UI; API calls go to the same origin (`/api`).

---

## Step 10: (Optional) Run the app as a systemd service

So the container starts after a reboot:

1. Create a unit file:
   ```bash
   sudo nano /etc/systemd/system/property-pro.service
   ```

2. Paste (adjust paths if your project is elsewhere):

   ```ini
   [Unit]
   Description=Property Pro App
   After=docker.service
   Requires=docker.service

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/home/opc/property-pro-app
   ExecStart=/usr/bin/docker start property-pro
   ExecStop=/usr/bin/docker stop property-pro

   [Install]
   WantedBy=multi-user.target
   ```

   For Ubuntu, use `/home/ubuntu/property-pro-app` if your user is `ubuntu`.

3. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable property-pro
   sudo systemctl start property-pro
   ```

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Cannot reach http://&lt;IP&gt;:3000 | Check the VCN security list has **ingress TCP 3000** from `0.0.0.0/0`; check the VM firewall (e.g. `sudo firewall-cmd --add-port=3000/tcp --permanent && sudo firewall-cmd --reload` on Oracle Linux). |
| DB connection fails | Confirm wallet path and `TNS_ADMIN`; in ADB Console add the VM’s public IP to **Access Control List** (Network → Access Control List). |
| Container exits immediately | Run `docker logs property-pro`; ensure `backend/.env` exists and paths in the `docker run` command are correct. |
| 502 / blank page | Ensure you built the image from the repo root (so `frontend` and `backend` are present). Re-run `docker build -t property-pro .` from project root. |

---

## Temporary deployment options

If you only need the app reachable for a **short time** (demo, testing, share with someone), use one of these.

### Option A: Run locally + temporary public URL (fastest)

Run the app on your machine and expose it with **ngrok** or **localtunnel**. You get **one public URL** that serves both the **frontend (React UI)** and the **API**. No OCI or server setup.

**Recommended: one port = frontend + API**

1. **Build the frontend and run only the backend** (backend serves both the React app and the API on port 3000):
   ```bash
   cd frontend && npm install && npm run build
   cd ../backend && npm install && npm start
   ```
   Set `NODE_ENV=production` in `backend/.env` so the backend serves the built frontend from `frontend/dist`. You now have the **full app** at http://localhost:3000 (UI + API).

2. **Expose port 3000** so the same URL gives both frontend and API:
   - **ngrok:** `ngrok http 3000` → use the HTTPS URL it prints (e.g. `https://abc123.ngrok.io`).
   - **localtunnel:** `npx localtunnel --port 3000` → use the generated URL.

3. **Open that URL in a browser** – you get the Property Pro UI; all API calls go to the same origin (`/api`), so everything works. Share the URL for demos. When you stop the tunnel, the URL stops working.

---

**Alternative: dev mode (frontend on port 5173, backend on 3000)**

If you prefer the frontend dev server (hot reload) and backend in two terminals:

1. **Terminal 1 – backend:** `cd backend && npm install && npm start` (port 3000).
2. **Terminal 2 – frontend:** `cd frontend && npm install && npm run dev` (port 5173). Vite proxies `/api` to the backend.
3. **Expose port 5173** (the frontend), not 3000, so the public URL serves the React app and Vite forwards API calls to your backend:
   - **ngrok:** `ngrok http 5173`
   - **localtunnel:** `npx localtunnel --port 5173`

Use the generated URL in the browser; you get the UI and API (via proxy). Keep both terminals running while sharing.

**Good for:** Demos, quick testing, no server or cloud setup.

---

### Option B: OCI VM – deploy then terminate (temporary on OCI)

Use the **full steps** in this guide (Always Free Compute + Docker). When you no longer need the app:

1. **Terminate the Compute Instance:** OCI Console → **Compute → Instances** → your instance → **More actions → Terminate**.
2. (Optional) **Terminate the Autonomous Database** if you created one: **Oracle Database → Autonomous Database** → your DB → **More actions → Terminate**.

You can create a new VM and deploy again anytime. Always Free tier does not charge for the VM while it exists, and you avoid leaving resources running if you terminate when done.

**Good for:** A “temporary” deployment that still lives on OCI and can run for days or weeks until you delete it.

---

### Option C: Third‑party “quick deploy” (non-OCI)

Use a platform that deploys from Git and gives a URL quickly. These are **not** on OCI but are handy for temporary or shared demos.

| Platform | Notes |
|----------|--------|
| **Railway** | Connect GitHub repo, add env vars, deploy. Free tier has limits; easy to delete the project when done. |
| **Render** | Free tier for web services; connect repo, set build command and start command (e.g. use Docker or Node). |
| **Fly.io** | Free tier; deploy with Dockerfile. `fly launch` then `fly deploy`; can destroy the app with `fly apps destroy`. |

For Property Pro you’d typically point the service at your **backend** (Node on port 3000) and either serve the frontend from the same Node process (as in the Dockerfile) or host the frontend separately. Same app and Dockerfile can be used; only the hosting platform changes.

**Good for:** Temporary or demo URLs without managing a VM; you can remove the project when finished.

---

## Summary checklist

1. Create VCN (if needed).
2. Create Always Free Compute Instance (VM.Standard.E2.1.Micro), with public IP.
3. Open ingress for TCP 22 and 3000 in the VCN security list.
4. (Optional) Create Always Free Autonomous Database; download and extract wallet.
5. SSH into VM → install Docker (and Git) → clone or copy app.
6. Copy `backend/.env.example` to `backend/.env` and set variables (and copy wallet to VM if using ADB).
7. `docker build -t property-pro .` then `docker run ...` with `--env-file backend/.env` and wallet volume if needed.
8. Open **http://&lt;VM_PUBLIC_IP&gt;:3000** in your browser.

This single method keeps you within OCI Free Tier and gives you one clear path from zero to a running Property Pro deployment.
