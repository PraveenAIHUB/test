import { NavLink } from 'react-router-dom';
import '../styles/module-vertical-nav.css';

/**
 * ModuleVerticalNav - Horizontal tab bar for desktop/tablet + bottom tabs for mobile
 * Oracle RedWood style
 *
 * @param {string} basePath - Base URL path for the module (e.g., '/properties')
 * @param {Array} tabs - Array of tab objects with { id, label, path, icon }
 */
function ModuleVerticalNav({ basePath, tabs }) {
  return (
    <>
      {/* Desktop/Tablet: Horizontal Tab Bar */}
      <nav className="module-vertical-nav desktop-sidebar">
        <div className="module-vertical-nav-container">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={`${basePath}${tab.path}`}
              end={tab.path === ''}
              className={({ isActive }) => `module-vertical-nav-item ${isActive ? 'active' : ''}`}
            >
              {tab.icon && (
                <div className="module-vertical-nav-icon-wrapper">
                  <svg className="module-vertical-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <g dangerouslySetInnerHTML={{ __html: tab.icon }} />
                  </svg>
                </div>
              )}
              <span className="module-vertical-nav-label">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile: Bottom Tab Bar */}
      <nav className="module-bottom-tabs mobile-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={`${basePath}${tab.path}`}
            end={tab.path === ''}
            className={({ isActive }) => `module-bottom-tab ${isActive ? 'active' : ''}`}
          >
            {tab.icon && (
              <svg className="module-bottom-tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <g dangerouslySetInnerHTML={{ __html: tab.icon }} />
              </svg>
            )}
            <span className="module-bottom-tab-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default ModuleVerticalNav;

