import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import ComplianceDashboard from './compliance/ComplianceDashboard';
import AllCompliance from './compliance/AllCompliance';
import ComplianceCalendar from './compliance/ComplianceCalendar';
import ComplianceSettings from './compliance/ComplianceSettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

const COMPLIANCE_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'all',
    label: 'All Obligations',
    path: '/all',
    icon: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function Compliance() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Compliance & Regulatory</h1>
      </div>

      <div className="rw-module-layout">
        <ModuleVerticalNav basePath="/compliance" tabs={COMPLIANCE_TABS} />
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<ComplianceDashboard />} />
            <Route path="/all" element={<AllCompliance />} />
            <Route path="/calendar" element={<ComplianceCalendar />} />
            <Route path="/settings" element={<ComplianceSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Compliance;

