import { NavLink } from 'react-router-dom';
import '../styles/module-subnav.css';

/**
 * Reusable Horizontal Sub-Navigation Component for Module Pages
 * 
 * Props:
 * - basePath: Base URL path for the module (e.g., '/properties')
 * - tabs: Array of tab objects with { id, label, path }
 * 
 * Example usage:
 * <ModuleSubNav 
 *   basePath="/properties"
 *   tabs={[
 *     { id: 'dashboard', label: 'Dashboard', path: '' },
 *     { id: 'all', label: 'All Properties', path: '/all' },
 *     { id: 'analytics', label: 'Analytics', path: '/analytics' },
 *     { id: 'settings', label: 'Settings', path: '/settings' }
 *   ]}
 * />
 */
function ModuleSubNav({ basePath, tabs }) {
  return (
    <nav className="module-subnav">
      <div className="module-subnav-container">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={`${basePath}${tab.path}`}
            end={tab.path === ''}
            className={({ isActive }) => `module-subnav-item ${isActive ? 'active' : ''}`}
          >
            {tab.icon && (
              <svg className="module-subnav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <g dangerouslySetInnerHTML={{ __html: tab.icon }} />
              </svg>
            )}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default ModuleSubNav;

