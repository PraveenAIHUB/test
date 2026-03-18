# Property Pro - Quick Start Guide

Get the Property Pro application up and running in minutes!

---

## 🚀 Quick Start (Development Mode)

### Prerequisites
- Node.js v18+ installed
- npm or yarn installed
- Oracle Database (optional for now - app uses mock data)

### Step 1: Start Backend Server

```bash
cd property-pro-app/backend
npm run dev
```

**Expected Output:**
```
🚀 Property Pro API Server running on port 3000
📊 Environment: development
🏥 Health check: http://localhost:3000/health
```

### Step 2: Start Frontend Application

Open a new terminal:

```bash
cd property-pro-app/frontend
npm run dev
```

**Expected Output:**
```
VITE v7.3.1  ready in 422 ms
➜  Local:   http://localhost:5173/
```

### Step 3: Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/health

---

## 🎯 What You'll See

### Dashboard
- 4 KPI cards showing key metrics
- Recent work orders table
- Upcoming lease renewals

### Properties Module
- List of properties with filters
- Search functionality
- Property details view

### Navigation
- Collapsible sidebar with all modules
- Clean Oracle RedWood design
- Responsive layout

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env` to configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Oracle Database (when ready)
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECTION_STRING=your_connection_string

# JWT (for authentication)
JWT_SECRET=your_secret_key
JWT_EXPIRY=24h
```

### Frontend Configuration

The frontend automatically connects to `http://localhost:3000/api` for backend API calls.

To change the API URL, edit `frontend/src/components/Properties.jsx`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

## 📊 Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Check DB connection

**Option 1 – HTTP (server must be running)**  
- DB status only: `http://localhost:3000/api/health/db` or `http://localhost:3000/health/db`  
- Health with DB: `http://localhost:3000/health?db=1`

Example:
```bash
curl http://localhost:3000/api/health/db
```
Response when connected: `{"connected":true,"message":"Oracle database connection OK","dbTime":"..."}`  
When not configured/failed: `connected: false` with a message or error.

**Option 2 – CLI script (no server needed)**  
From the backend folder:
```bash
cd backend
node scripts/check-db.js
```
Shows config (masked), then either "Connection OK" with DB time or the error message.

### Get Properties
```bash
curl http://localhost:3000/api/properties
```

### Get Leases
```bash
curl http://localhost:3000/api/leases
```

---

## 🗄️ Database Setup (Optional)

When you're ready to connect to Oracle Database:

### 1. Install Oracle Instant Client

**macOS:**
```bash
brew install instantclient-basic
```

**Linux:**
Download from Oracle website and set `LD_LIBRARY_PATH`

### 2. Create Database Schema

```bash
# Connect to your Oracle Database
sqlplus username/password@connection_string

# Run the DDL scripts
@database/schema/01_create_tables.sql
@database/schema/02_sample_data.sql
```

### 3. Update .env File

```env
DB_USER=property_pro_user
DB_PASSWORD=your_password
DB_CONNECTION_STRING=host:port/service_name
```

### 4. Restart Backend

```bash
cd backend
npm run dev
```

---

## 🎨 Customization

### Change Theme Colors

Edit `frontend/src/styles/redwood-theme.css`:

```css
:root {
  --redwood-primary: #0572CE;  /* Change primary color */
  --redwood-secondary: #667085; /* Change secondary color */
}
```

### Add New Module

1. Create route in `backend/routes/yourmodule.js`
2. Add route to `backend/server.js`
3. Create component in `frontend/src/components/YourModule.jsx`
4. Add route to `frontend/src/App.jsx`
5. Add navigation link in sidebar

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify Node.js version: `node --version`
- Delete `node_modules` and run `npm install` again

### Frontend won't start
- Check if port 5173 is already in use
- Clear Vite cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `npm install`

### Database connection errors
- Verify Oracle Instant Client is installed
- Check connection string format
- Ensure database is accessible from your machine
- Verify credentials in .env file

### API calls failing
- Check backend is running on port 3000
- Check browser console for CORS errors
- Verify API_BASE_URL in frontend components

---

## 📚 Next Steps

1. **Explore the Application**
   - Navigate through different modules
   - Test the Properties module with filters
   - Check the Dashboard KPIs

2. **Review Documentation**
   - Read `README.md` for detailed information
   - Check `PROJECT_STATUS.md` for current status
   - Review database schema in `database/schema/`

3. **Start Development**
   - Implement remaining modules
   - Connect to Oracle Database
   - Add authentication
   - Integrate with Oracle ERP

4. **Deploy to Production**
   - Setup OCI infrastructure
   - Configure production environment
   - Deploy backend and frontend
   - Setup monitoring

---

## 🆘 Getting Help

- Check the `README.md` for detailed documentation
- Review `PROJECT_STATUS.md` for implementation status
- Check the code comments in source files
- Contact the development team

---

## ✅ Checklist

- [ ] Backend server running on port 3000
- [ ] Frontend application running on port 5173
- [ ] Can access Dashboard at http://localhost:5173
- [ ] Can view Properties list
- [ ] API health check returns success
- [ ] No console errors in browser
- [ ] Navigation works between modules

---

**Happy Coding! 🎉**

