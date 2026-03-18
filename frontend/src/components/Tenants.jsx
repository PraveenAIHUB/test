import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import TenantDashboard from './tenants/TenantDashboard';
import AllTenants from './tenants/AllTenants';
import TenantAnalytics from './tenants/TenantAnalytics';
import TenantSettings from './tenants/TenantSettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

// Sub-navigation tabs configuration
const TENANT_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'all',
    label: 'All Tenants',
    path: '/all',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function Tenants() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Tenant Management</h1>
      </div>

      {/* Module Layout with Horizontal Tabs */}
      <div className="rw-module-layout">
        {/* Horizontal Tab Navigation */}
        <ModuleVerticalNav basePath="/tenants" tabs={TENANT_TABS} />

        {/* Main Content Area */}
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<TenantDashboard />} />
            <Route path="/all" element={<AllTenants />} />
            <Route path="/analytics" element={<TenantAnalytics />} />
            <Route path="/settings" element={<TenantSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Tenants;
