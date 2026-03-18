# Deploying Property Pro to Oracle Cloud (OCI)

This guide covers deploying the Property Pro app (Node.js backend + React frontend) to Oracle Cloud Infrastructure.

## Prerequisites

- Oracle Cloud account
- Oracle Autonomous Database or Oracle DB instance (for production data)
- OCI CLI (optional) or use OCI Console

---

## Option 1: OCI Container Instance (simplest)

1. **Build and push the image to OCI Container Registry**
   - In OCI Console: **Developer Services → Containers → Container Registry**
   - Create a repository (e.g. `property-pro`)
   - From your machine (with Docker and OCI CLI configured):
     ```bash
     docker build -t property-pro .
     docker tag property-pro <region>.ocir.io/<tenancy-namespace>/property-pro:latest
     docker push <region>.ocir.io/<tenancy-namespace>/property-pro:latest
     ```
   - Or use **OCI DevOps** to build from a Git repo.

2. **Create a Container Instance**
   - **Compute → Containers → Container Instances → Create**
   - Choose the image you pushed
   - Set **Environment variables** (or use a Vault secret for DB credentials):
     - `NODE_ENV=production`
     - `PORT=3000`
     - `DB_USER`, `DB_PASSWORD`, `DB_CONNECTION_STRING`, `TNS_ADMIN` (see below)
     - `JWT_SECRET` (strong random value)
   - Expose port **3000**
   - Attach a **VCN** and **subnet** (public if you want direct access)
   - Optional: mount a **volume** for Oracle wallet (if you store wallet in Object Storage or a volume)

3. **Oracle DB / Wallet**
   - For **Autonomous Database**: download the wallet ZIP, extract it, and either:
     - Bake the wallet into the image (less ideal), or
     - Mount the wallet directory as a volume and set `TNS_ADMIN` to that path in the container
   - Set `DB_CONNECTION_STRING` to the TNS alias (e.g. `propertypro_high` or `propertypro_tp`).
   - Ensure the Container Instance subnet can reach the Autonomous DB (e.g. via private endpoint or allowed IPs in ADB access control).

4. **Access**
   - Use the Container Instance’s **public IP** (if in a public subnet) and port **3000**, or put a **Load Balancer** in front and use HTTPS.

---

## Option 2: OCI Compute (VM)

1. **Create a VM**
   - **Compute → Instances → Create**
   - Pick an Oracle Linux or Ubuntu image; allow SSH and HTTP if needed.

2. **Install Node.js and run the app**
   - SSH into the VM and install Node 20 (e.g. from NodeSource).
   - Clone your repo or copy the built app:
     - Build frontend locally: `cd frontend && npm run build`
     - Copy `backend/`, `frontend/dist/`, and `package.json` (or use Git).
   - In `backend`, create `.env` from `backend/.env.example` and set:
     - `NODE_ENV=production`
     - `PORT=3000`
     - Oracle DB: `DB_USER`, `DB_PASSWORD`, `DB_CONNECTION_STRING`, `TNS_ADMIN` (and wallet on the VM).
   - Install backend deps: `npm ci --omit=dev`
   - Run: `node server.js` (or use **PM2** / systemd for production).

3. **Oracle wallet**
   - Download the Autonomous DB wallet on the VM (or copy the extracted folder).
   - Set `TNS_ADMIN` to the wallet directory path in `.env`.

4. **Firewall**
   - Open port **3000** (or **80** and put a reverse proxy in front).

---

## Option 3: Docker on a Compute VM

1. On the VM, install Docker.
2. Build and run:
   ```bash
   docker build -t property-pro .
   docker run -d -p 3000:3000 --env-file backend/.env --name property-pro property-pro
   ```
3. Use the same DB and wallet setup as above; if the wallet is on the host, mount it:
   ```bash
   docker run -d -p 3000:3000 -v /path/on/host/wallet:/app/wallet:ro -e TNS_ADMIN=/app/wallet --env-file backend/.env --name property-pro property-pro
   ```
   Ensure `backend` code uses `TNS_ADMIN` when connecting (your app already supports this via `.env`).

---

## Environment variables (production)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | Server port (default `3000`) |
| `DB_USER` | Oracle DB user |
| `DB_PASSWORD` | Oracle DB password |
| `DB_CONNECTION_STRING` | TNS alias (e.g. `propertypro_high`) or EZ Connect string |
| `TNS_ADMIN` | Path to extracted Oracle wallet directory (for ADB) |
| `JWT_SECRET` | Strong random secret for JWT (do not use dev default) |

Copy `backend/.env.example` to `backend/.env` and fill in values. Never commit `.env` or wallet files.

---

## Frontend API URL

The frontend uses relative URLs (`/api`) when `VITE_API_BASE_URL` is unset, so the same origin that serves the app is used. For production (single Node server serving the built React app), no extra env is needed. If you serve the frontend from a different domain, set `VITE_API_BASE_URL` at **build time** (e.g. `VITE_API_BASE_URL=https://api.yourdomain.com`).

---

## Health checks

- **App:** `GET /health`
- **DB:** `GET /health?db=1` or `GET /api/health/db`

Use these in OCI Load Balancer or Container Instance health checks.

---

## HTTPS and load balancer

For HTTPS in OCI:

1. Create a **Load Balancer** in front of your Container Instance or Compute VM.
2. Add a **Listener** on 443 and attach an SSL certificate (OCI cert or your own).
3. Add a **Backend Set** pointing to your app (port 3000).
4. Optionally restrict the VM/Container Instance to only accept traffic from the Load Balancer.

---

## Summary

- **Container Instance**: build image → push to OCR → create Container Instance with env vars and optional wallet volume.
- **Compute VM**: install Node, build frontend, run `node server.js` with `.env` and wallet on the VM.
- **Docker on VM**: `docker build` + `docker run` with `--env-file` and wallet volume if needed.

Use `backend/.env.example` as the template for all deployment options and keep secrets out of the image and repo.
