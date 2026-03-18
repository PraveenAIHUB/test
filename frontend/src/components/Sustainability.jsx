import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import SustainabilityDashboard from './sustainability/SustainabilityDashboard';
import EmissionsTracking from './sustainability/EmissionsTracking';
import WasteManagement from './sustainability/WasteManagement';
import SustainabilitySettings from './sustainability/SustainabilitySettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

const SUSTAINABILITY_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'emissions',
    label: 'Emissions',
    path: '/emissions',
    icon: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>'
  },
  {
    id: 'waste',
    label: 'Waste Management',
    path: '/waste',
    icon: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function Sustainability() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Environmental Sustainability</h1>
      </div>

      <div className="rw-module-layout">
        <ModuleVerticalNav basePath="/sustainability" tabs={SUSTAINABILITY_TABS} />
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<SustainabilityDashboard />} />
            <Route path="/emissions" element={<EmissionsTracking />} />
            <Route path="/waste" element={<WasteManagement />} />
            <Route path="/settings" element={<SustainabilitySettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Sustainability;

