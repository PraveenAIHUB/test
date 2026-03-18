import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import PropertiesDashboard from './properties/PropertiesDashboard';
import AllProperties from './properties/AllProperties';
import PropertiesAnalytics from './properties/PropertiesAnalytics';
import PropertiesSettings from './properties/PropertiesSettings';
import PropertyPortfolio from './properties/PropertyPortfolio';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

// Sub-navigation tabs configuration
const PROPERTY_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'all',
    label: 'All Properties',
    path: '/all',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
  },
  {
    id: 'portfolio',
    label: 'Portfolio & Map',
    path: '/portfolio',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
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

function Properties() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Properties</h1>
      </div>

      {/* Module Layout with Vertical Sidebar */}
      <div className="rw-module-layout">
        {/* Vertical Sidebar Navigation */}
        <ModuleVerticalNav basePath="/properties" tabs={PROPERTY_TABS} />

        {/* Main Content Area */}
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<PropertiesDashboard />} />
            <Route path="/all" element={<AllProperties />} />
            <Route path="/portfolio" element={<PropertyPortfolio />} />
            <Route path="/analytics" element={<PropertiesAnalytics />} />
            <Route path="/settings" element={<PropertiesSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Properties;