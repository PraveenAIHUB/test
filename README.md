# Property Pro - Property & Facility Management System

Oracle Cloud ERP Extension for comprehensive Property and Facility Management

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React.js with Vite
- Oracle RedWood Design System (custom implementation)
- React Router for navigation
- Axios for API calls

**Backend:**
- Node.js with Express
- Oracle Database (oracledb driver)
- RESTful API architecture
- JWT authentication (planned)

**Database:**
- Oracle Database (ATP/ADW)
- Connection pooling for performance

**Integration:**
- Oracle Integration Cloud (OIC) - planned
- Oracle Cloud ERP modules (GL, AR, AP, FA, Procurement)

### Property Hierarchy (Real Estate Structure)

The application is designed to support a **hierarchical property structure** aligned with the Property Pro Real Estate Property Hierarchy:

```
Property / Building (Tower)
    → Floors (floor plan, layout)
        → Units (apartments, offices)
            → Rooms (living, bedroom, kitchen, etc.)
                → Room Dimensions (length, width, area)
    → Assets & Shared Spaces (property or floor level)
```

- **Current flow:** Users create **Properties** (name, type, address, description, etc.), then manage **Floors**, **Spaces** (units), **Rooms** (with dimensions), and **Assets** (property/floor level) via the Hierarchy tab and Space Management. Layout is represented by the floor/unit grid (Visual Floor Map) and hierarchy; `floor_plan_layout` is in the schema for future use.
- **Map/geocoding:** Set `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` in the backend `.env` for real address geocoding and lat/long in the property form; otherwise a stub parses the address string.
- **AI:** Description and price suggestions are available in forms; description is stored on the property.
- **Roles:** The app supports **Admin** and **Customer (User)**. Log in as `admin` / `admin123` for full management; as `user` / `user123` for customer flows. **Admins** see full nav (Properties, Floors, Units, Rooms, Assets, Leases, Lease Request Management, etc.) and can create/manage the full hierarchy. **Customers** see: Dashboard, Browse & Request Space, My Lease Requests, Request Maintenance, Find Space (AI). Customers browse properties, select units on the floor plan (single or multiple), and submit a lease request for admin approval; they can also submit asset/unit maintenance requests (AC, electrical, etc.). Admins approve or reject lease requests from **Lease Requests** in the nav.

For a **detailed mapping** of these requirements to the current codebase (what exists, what’s partial, what’s missing) and recommended schema/flow changes, see **[REQUIREMENTS_PROPERTY_HIERARCHY.md](./REQUIREMENTS_PROPERTY_HIERARCHY.md)**.

## 📁 Project Structure

```
property-pro-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS and RedWood theme
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── config/              # Configuration files
│   │   └── database.js      # Oracle DB connection
│   ├── routes/              # API route handlers
│   │   ├── properties.js
│   │   ├── leases.js
│   │   ├── tenants.js
│   │   ├── assets.js
│   │   ├── workorders.js
│   │   └── ...
│   ├── server.js            # Express server
│   ├── .env                 # Environment variables
│   └── package.json
│
├── database/                 # Database scripts
│   └── schema/              # DDL scripts (to be added)
│
└── docs/                     # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Oracle Database (local or cloud)
- Oracle Instant Client (for oracledb)

### Installation

1. **Clone the repository**
   ```bash
   cd property-pro-app
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your Oracle DB credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

## 📊 Modules

### Core Modules (Implemented)
- ✅ Dashboard - KPIs and overview
- ✅ Property Management - Property portfolio
- 🔄 Lease Management - In progress
- 🔄 Tenant Management - In progress
- 🔄 Work Order Management - In progress
- 🔄 Asset Management - In progress

### Planned Modules
- ⏳ Financial Management
- ⏳ Maintenance Management
- ⏳ Vendor Management
- ⏳ Energy Management
- ⏳ Compliance & Regulations
- ⏳ Document Management
- ⏳ Reporting & Analytics
- ⏳ AI & Automation

## 🎨 Design System

The application uses a custom implementation of Oracle RedWood Design System with:
- Consistent color palette
- Typography standards
- Component library (buttons, cards, tables, inputs)
- Responsive layout
- Accessibility features

## 🔌 API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Leases
- `GET /api/leases` - List all leases
- `GET /api/leases/:id` - Get lease details
- `POST /api/leases` - Create new lease

### Other Modules
- Similar CRUD endpoints for tenants, assets, work orders, etc.

## 🔐 Security

- Helmet.js for security headers
- CORS configuration
- Input validation with express-validator
- Environment variable management
- SQL injection prevention with parameterized queries

## 📝 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Oracle Cloud Infrastructure (OCI)

1. **Provision OCI Resources**
   - Compute instances
   - Oracle Autonomous Database
   - Load Balancer
   - Object Storage for documents

2. **Deploy Backend**
   - Build Docker image
   - Push to OCI Container Registry
   - Deploy to OCI Container Instances

3. **Deploy Frontend**
   - Build production bundle
   - Deploy to OCI Object Storage (static hosting)
   - Configure CDN

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

Proprietary - Blu Feather Solutions

## 📞 Support

For support, contact: support@blufeathersolutions.com

