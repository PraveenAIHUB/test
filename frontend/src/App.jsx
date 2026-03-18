import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import './styles/redwood-theme.css';
import './App.css';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Leases from './components/Leases';
import Tenants from './components/Tenants';
import SpaceManagement from './components/SpaceManagement';
import DocumentManagement from './components/DocumentManagement';
import Compliance from './components/Compliance';
import WorkOrders from './components/WorkOrders';
import Assets from './components/Assets';
import Financials from './components/Financials';
import Maintenance from './components/Maintenance';
import Reservations from './components/Reservations';
import Security from './components/Security';
import Sustainability from './components/Sustainability';
import Vendors from './components/Vendors';
import Energy from './components/Energy';
import Reports from './components/Reports';
import GlobalSearch from './components/GlobalSearch';
import Profile from './components/Profile';
import BrowseAndRequest from './components/customer/BrowseAndRequest';
import MyLeaseRequests from './components/customer/MyLeaseRequests';
import SubmitWorkRequest from './components/customer/SubmitWorkRequest';
import LeaseRequestManagement from './components/admin/LeaseRequestManagement';
import FindSpace from './components/customer/FindSpace';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Admin-only route: redirect USER role to dashboard
function AdminRoute({ children }) {
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// Main App Layout
function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isCustomer = user && (user.role === 'USER');
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar by default on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            {isMobile && (
              <button
                className="menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}
            <h1 className="app-title">Property Pro</h1>
            <span className="app-subtitle">Property & Facility Management</span>
          </div>

          {/* Global Search - Desktop/Tablet */}
          {!isMobile && (
            <div className="header-center">
              <GlobalSearch />
            </div>
          )}

          <div className="header-right">
            <Link to="/profile" className="header-profile-trigger" title="View profile">
              <div style={{ textAlign: 'right' }}>
                <div className="header-profile-name">
                  {user?.full_name || user?.username}
                </div>
                <div className="header-profile-role">
                  {user?.role ? String(user.role).replace(/_/g, ' ') : 'User'}
                </div>
              </div>
            </Link>
            <button className="rw-button rw-button-secondary" onClick={logout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Mega Menu Navigation - Desktop/Tablet */}
        {!isMobile && (
          <nav className="mega-menu">
            <div className="mega-menu-container">
              {/* Dashboard - Standalone */}
              <NavLink to="/" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`} end>
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Dashboard</span>
              </NavLink>

              {/* User role: only required features */}
              {isCustomer && (
                <>
                  <NavLink to="/browse" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`}>
                    <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Select Space</span>
                  </NavLink>
                  <NavLink to="/my-lease-requests" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`}>
                    <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>My Lease Requests</span>
                  </NavLink>
                  <NavLink to="/request-maintenance" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`}>
                    <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    <span>Request Maintenance</span>
                  </NavLink>
                  <NavLink to="/profile" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`}>
                    <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Profile</span>
                  </NavLink>
                </>
              )}

              {/* Admin/Manager: full Property Management and rest */}
              {isAdmin && (
              <>
              {/* Property Management - L1 */}
              <div className="mega-menu-dropdown">
                <button className="mega-menu-item">
                  <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                  <span>Property Management</span>
                  <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="mega-menu-panel">
                  <div className="mega-menu-section">
                    <NavLink to="/properties" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      <span>Properties</span>
                    </NavLink>
                    <NavLink to="/leases" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span>Leases</span>
                    </NavLink>
                    <NavLink to="/lease-requests" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Lease Requests</span>
                    </NavLink>
                    <NavLink to="/tenants" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                      <span>Tenants</span>
                    </NavLink>
                    <NavLink to="/space" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2"></rect>
                      </svg>
                      <span>Space Management</span>
                    </NavLink>
                    <NavLink to="/documents" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span>Documents</span>
                    </NavLink>
                  </div>
                </div>
              </div>

              {/* Facility Management - L1 */}
              <div className="mega-menu-dropdown">
                <button className="mega-menu-item">
                  <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  <span>Facility Management</span>
                  <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="mega-menu-panel">
                  <div className="mega-menu-section">
                    <NavLink to="/assets" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <span>Assets</span>
                    </NavLink>
                    <NavLink to="/workorders" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Work Orders</span>
                    </NavLink>
                    <NavLink to="/maintenance" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                      <span>Maintenance</span>
                    </NavLink>
                    <NavLink to="/reservations" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                      </svg>
                      <span>Reservations</span>
                    </NavLink>
                    <NavLink to="/energy" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                      <span>Energy</span>
                    </NavLink>
                    <NavLink to="/sustainability" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                      </svg>
                      <span>Sustainability</span>
                    </NavLink>
                    <NavLink to="/security" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <span>Security</span>
                    </NavLink>
                  </div>
                </div>
              </div>

              {/* Financial & Compliance - L1 */}
              <div className="mega-menu-dropdown">
                <button className="mega-menu-item">
                  <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span>Financial & Compliance</span>
                  <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="mega-menu-panel">
                  <div className="mega-menu-section">
                    <NavLink to="/financials" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span>Financials</span>
                    </NavLink>
                    <NavLink to="/vendors" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7h-9"></path>
                        <path d="M14 17H5"></path>
                        <circle cx="17" cy="17" r="3"></circle>
                        <circle cx="7" cy="7" r="3"></circle>
                      </svg>
                      <span>Vendors</span>
                    </NavLink>
                    <NavLink to="/compliance" className="mega-menu-link">
                      <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <span>Compliance</span>
                    </NavLink>
                  </div>
                </div>
              </div>

              {/* Reports - Standalone */}
              <NavLink to="/reports" className={({ isActive }) => `mega-menu-item ${isActive ? 'active' : ''}`}>
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>Reports</span>
              </NavLink>
              </>
              )}
            </div>
          </nav>
        )}

        <div className="app-body">
          {/* Sidebar - Mobile Only */}
          {isMobile && (
            <>
              {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
              <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <nav className="sidebar-nav">
              <Link to="/" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span className="nav-label">Dashboard</span>
              </Link>
              {isCustomer && (
                <>
                  <Link to="/browse" className="nav-item">
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span className="nav-label">Browse & Request Space</span>
                  </Link>
                  <Link to="/my-lease-requests" className="nav-item">
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span className="nav-label">My Lease Requests</span>
                  </Link>
                  <Link to="/request-maintenance" className="nav-item">
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    <span className="nav-label">Request Maintenance</span>
                  </Link>
                  <Link to="/find-space" className="nav-item">
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span className="nav-label">Find Space (AI)</span>
                  </Link>
                  <div className="nav-divider"></div>
                </>
              )}
              {isAdmin && <Link to="/properties" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="nav-label">Properties</span>
              </Link>}
              {isAdmin && <Link to="/leases" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className="nav-label">Leases</span>
              </Link>}
              {isAdmin && <Link to="/lease-requests" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span className="nav-label">Lease Requests</span>
              </Link>}
              {isAdmin && <Link to="/tenants" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="nav-label">Tenants</span>
              </Link>}
              {isAdmin && <>
              <Link to="/space" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2"></rect>
                </svg>
                <span className="nav-label">Space</span>
              </Link>
              <Link to="/documents" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span className="nav-label">Documents</span>
              </Link>

              <div className="nav-divider"></div>

              <div className="nav-section-title">Facility Management</div>
              <Link to="/assets" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span className="nav-label">Assets</span>
              </Link>
              <Link to="/workorders" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span className="nav-label">Work Orders</span>
              </Link>
              <Link to="/maintenance" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                <span className="nav-label">Maintenance</span>
              </Link>
              <Link to="/reservations" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span className="nav-label">Reservations</span>
              </Link>
              <Link to="/energy" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span className="nav-label">Energy</span>
              </Link>
              <Link to="/sustainability" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
                <span className="nav-label">Sustainability</span>
              </Link>
              <Link to="/security" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="nav-label">Security</span>
              </Link>

              <div className="nav-divider"></div>

              <div className="nav-section-title">Financial & Compliance</div>
              <Link to="/financials" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span className="nav-label">Financials</span>
              </Link>
              <Link to="/vendors" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
                <span className="nav-label">Vendors</span>
              </Link>
              <Link to="/compliance" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span className="nav-label">Compliance</span>
              </Link>

              <div className="nav-divider"></div>

              <Link to="/reports" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span className="nav-label">Reports</span>
              </Link>
              </>}
              <Link to="/profile" className="nav-item">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="nav-label">Profile</span>
              </Link>
            </nav>
          </aside>
            </>
          )}

          {/* Main Content */}
          <main className={`app-main ${isMobile ? '' : 'full-width'}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              {/* User: select space, my requests, maintenance */}
              <Route path="/browse" element={<BrowseAndRequest />} />
              <Route path="/my-lease-requests" element={<MyLeaseRequests />} />
              <Route path="/request-maintenance" element={<SubmitWorkRequest />} />
              <Route path="/find-space" element={<FindSpace />} />
              {/* Admin-only routes */}
              <Route path="/lease-requests" element={<AdminRoute><LeaseRequestManagement /></AdminRoute>} />
              <Route path="/properties/*" element={<AdminRoute><Properties /></AdminRoute>} />
              <Route path="/leases" element={<AdminRoute><Leases /></AdminRoute>} />
              <Route path="/tenants/*" element={<AdminRoute><Tenants /></AdminRoute>} />
              <Route path="/space/*" element={<AdminRoute><SpaceManagement /></AdminRoute>} />
              <Route path="/documents/*" element={<AdminRoute><DocumentManagement /></AdminRoute>} />
              <Route path="/assets" element={<AdminRoute><Assets /></AdminRoute>} />
              <Route path="/workorders" element={<AdminRoute><WorkOrders /></AdminRoute>} />
              <Route path="/maintenance" element={<AdminRoute><Maintenance /></AdminRoute>} />
              <Route path="/reservations/*" element={<AdminRoute><Reservations /></AdminRoute>} />
              <Route path="/energy" element={<AdminRoute><Energy /></AdminRoute>} />
              <Route path="/sustainability/*" element={<AdminRoute><Sustainability /></AdminRoute>} />
              <Route path="/security/*" element={<AdminRoute><Security /></AdminRoute>} />
              <Route path="/financials" element={<AdminRoute><Financials /></AdminRoute>} />
              <Route path="/vendors" element={<AdminRoute><Vendors /></AdminRoute>} />
              <Route path="/compliance/*" element={<AdminRoute><Compliance /></AdminRoute>} />
              <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
            </Routes>
          </main>
        </div>
    </div>
  );
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
