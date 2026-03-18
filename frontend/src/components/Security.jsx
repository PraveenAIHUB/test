import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import SecurityDashboard from './security/SecurityDashboard';
import AccessControl from './security/AccessControl';
import Incidents from './security/Incidents';
import SecuritySettings from './security/SecuritySettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

const SECURITY_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'access',
    label: 'Access Control',
    path: '/access',
    icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
  },
  {
    id: 'incidents',
    label: 'Incidents',
    path: '/incidents',
    icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function Security() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Security & Access Control</h1>
      </div>

      <div className="rw-module-layout">
        <ModuleVerticalNav basePath="/security" tabs={SECURITY_TABS} />
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<SecurityDashboard />} />
            <Route path="/access" element={<AccessControl />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/settings" element={<SecuritySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Security;

