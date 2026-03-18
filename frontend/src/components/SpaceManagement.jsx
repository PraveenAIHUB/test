import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import SpaceDashboard from './space/SpaceDashboard';
import AllSpaces from './space/AllSpaces';
import FloorPlans from './space/FloorPlans';
import AllRooms from './space/AllRooms';
import SpaceSettings from './space/SpaceSettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

// Sub-navigation tabs configuration
const SPACE_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'floorplans',
    label: 'All Floors',
    path: '/floorplans',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
  },
  {
    id: 'all',
    label: 'Spaces & Units',
    path: '/all',
    icon: '<path d="M3 3h18v7H3z"></path><path d="M3 14h18v7H3z"></path>'
  },
  {
    id: 'rooms',
    label: 'Rooms (per unit)',
    path: '/rooms',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function SpaceManagement() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Floors, Units & Rooms</h1>
      </div>

      {/* Module Layout with Horizontal Tabs */}
      <div className="rw-module-layout">
        {/* Horizontal Tab Navigation */}
        <ModuleVerticalNav basePath="/space" tabs={SPACE_TABS} />

        {/* Main Content Area */}
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<SpaceDashboard />} />
            <Route path="/floorplans" element={<FloorPlans />} />
            <Route path="/all" element={<AllSpaces />} />
            <Route path="/rooms" element={<AllRooms />} />
            <Route path="/settings" element={<SpaceSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default SpaceManagement;

