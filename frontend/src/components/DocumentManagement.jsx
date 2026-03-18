import { Routes, Route } from 'react-router-dom';
import ModuleVerticalNav from './ModuleVerticalNav';
import DocumentsDashboard from './documents/DocumentsDashboard';
import AllDocuments from './documents/AllDocuments';
import DocumentCategories from './documents/DocumentCategories';
import DocumentSettings from './documents/DocumentSettings';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

const DOCUMENT_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '',
    icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
  },
  {
    id: 'all',
    label: 'All Documents',
    path: '/all',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'
  },
  {
    id: 'categories',
    label: 'Categories',
    path: '/categories',
    icon: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>'
  }
];

function DocumentManagement() {
  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Document Management</h1>
      </div>

      <div className="rw-module-layout">
        <ModuleVerticalNav basePath="/documents" tabs={DOCUMENT_TABS} />
        <div className="rw-module-content">
          <Routes>
            <Route path="/" element={<DocumentsDashboard />} />
            <Route path="/all" element={<AllDocuments />} />
            <Route path="/categories" element={<DocumentCategories />} />
            <Route path="/settings" element={<DocumentSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default DocumentManagement;

