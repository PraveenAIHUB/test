import { useState, useEffect } from 'react';
import axios from 'axios';
import AssetForm from './AssetForm';
import DrillDownModal from './DrillDownModal';
import { getAssetDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    property_id: '',
    status: '',
    category: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const dashboardConfig = getAssetDashboardConfig();

  useEffect(() => {
    fetchAssets();
    fetchDashboardStats();
  }, [filters]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/assets/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching asset stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);

      const response = await axios.get(`/api/assets?${params}`);
      setAssets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'rw-badge rw-badge-success';
      case 'MAINTENANCE':
        return 'rw-badge rw-badge-warning';
      case 'RETIRED':
        return 'rw-badge rw-badge-error';
      default:
        return 'rw-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCreate = () => {
    setSelectedAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setShowForm(true);
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'asset-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'asset-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'assetsByCategory':
        modalData.title = 'Assets by Category - Detailed View';
        modalData.data = dashboardStats.assetsByCategory;
        modalData.columns = [
          { key: 'category', label: 'Category' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'assetsByStatus':
        modalData.title = 'Assets by Status - Detailed View';
        modalData.data = dashboardStats.assetsByStatus;
        modalData.columns = [
          { key: 'status', label: 'Status' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'maintenanceDue':
        modalData.title = 'Maintenance Due - Detailed View';
        modalData.data = dashboardStats.maintenanceDue;
        modalData.columns = [
          { key: 'assetName', label: 'Asset Name' },
          { key: 'category', label: 'Category' },
          { key: 'dueDate', label: 'Due Date' }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Are you sure you want to delete ${asset.ASSET_NAME || asset.asset_name}?`)) {
      return;
    }

    try {
      const assetId = asset.ASSET_ID || asset.asset_id;
      await axios.delete(`/api/assets/${assetId}`);
      fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset');
    }
  };

  const handleFormSuccess = () => {
    fetchAssets();
  };

  // Prepare KPI data from backend stats
  const kpiData = dashboardStats ? [
    {
      label: 'Total Assets',
      value: dashboardStats.kpis.totalAssets.toString(),
      change: '+18 this quarter',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Operational',
      value: dashboardStats.kpis.operational.toString(),
      change: `${((dashboardStats.kpis.operational / dashboardStats.kpis.totalAssets) * 100).toFixed(1)}% of total`,
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Under Maintenance',
      value: dashboardStats.kpis.underMaintenance.toString(),
      change: 'Scheduled repairs',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#F57C00'
    },
    {
      label: 'Total Value',
      value: `KES ${(dashboardStats.kpis.totalValue / 1000000).toFixed(0)}M`,
      change: '+8.5% YoY',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#E8E0F5',
      color: '#6B4C9A'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Asset Management</h1>
        <div className="rw-page-actions">
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            <button
              className={`rw-button ${viewMode === 'dashboard' ? 'rw-button-primary' : 'rw-button-secondary'}`}
              onClick={() => setViewMode('dashboard')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </button>
            <button
              className={`rw-button ${viewMode === 'list' ? 'rw-button-primary' : 'rw-button-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>List View</span>
            </button>
          </div>

          {/* Export Buttons */}
          {viewMode === 'dashboard' && dashboardStats && (
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              <button className="rw-button rw-button-secondary" onClick={handleExportExcel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export Excel</span>
              </button>
              <button className="rw-button rw-button-secondary" onClick={handleExportPDF}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          )}

          <button className="rw-button rw-button-accent" onClick={handleCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' ? (
        <>
          {statsLoading ? (
            <div className="rw-loading">
              <div className="rw-spinner"></div>
              <p style={{ marginTop: '16px' }}>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="rw-kpi-grid" style={{ marginBottom: '24px' }}>
                {kpiData.map((kpi, index) => (
                  <div key={index} className="rw-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: kpi.bgColor,
                        color: kpi.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: kpi.icon }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="rw-kpi-label">{kpi.label}</div>
                        <div className="rw-kpi-value">{kpi.value}</div>
                      </div>
                    </div>
                    {kpi.change && (
                      <div className={`rw-kpi-change ${kpi.changeType}`}>
                        {kpi.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Charts - 3 columns */}
          {dashboardStats && (
            <div className="rw-grid-3">
              {/* Chart 1: Assets by Category */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('assetsByCategory')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Assets by Category</h3>
                    <p className="rw-chart-subtitle">Distribution</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.assetsByCategory.map((item, i) => {
                    const colors = ['#2C5F6F', '#FF6B35', '#00758F', '#6B4C9A', '#2E7D32', '#F57C00'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.category}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors[i] }}>{item.count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${item.percentage}%`,
                            background: colors[i],
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Assets by Status */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('assetsByStatus')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Assets by Status</h3>
                    <p className="rw-chart-subtitle">Current State</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.assetsByStatus.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#2C5F6F' }}>{item.status}</div>
                      <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.percentage}%`,
                          background: i === 0 ? '#2E7D32' : i === 1 ? '#F57C00' : '#D32F2F',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px'
                        }}>
                          <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 3: Maintenance Due */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('maintenanceDue')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Maintenance Due</h3>
                    <p className="rw-chart-subtitle">Upcoming Schedule</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.maintenanceDue.map((item, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: '3px solid #FF6B35'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C5F6F', marginBottom: '4px' }}>
                        {item.assetName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#757575', marginBottom: '2px' }}>
                        {item.category}
                      </div>
                      <div style={{ fontSize: '12px', color: '#F57C00', fontWeight: '500' }}>
                        Due: {item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filters */}
          <div className="rw-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="rw-label">Status</label>
            <select
              className="rw-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
          <div>
            <label className="rw-label">Category</label>
            <select
              className="rw-input"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="HVAC">HVAC</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELEVATOR">Elevator</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="rw-card">
        <h2 className="rw-card-title">All Assets</h2>
        {loading ? (
          <p>Loading assets...</p>
        ) : assets.length === 0 ? (
          <p>No assets found.</p>
        ) : (
          <table className="rw-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Property</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th>Purchase Date</th>
                <th>Purchase Cost</th>
                <th>Warranty Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.ASSET_ID}>
                  <td>{asset.ASSET_CODE}</td>
                  <td>{asset.ASSET_NAME}</td>
                  <td>{asset.ASSET_CATEGORY}</td>
                  <td>{asset.PROPERTY_NAME || 'N/A'}</td>
                  <td>{asset.MANUFACTURER || 'N/A'}</td>
                  <td>{asset.MODEL_NUMBER || 'N/A'}</td>
                  <td>{formatDate(asset.PURCHASE_DATE)}</td>
                  <td>{formatCurrency(asset.PURCHASE_COST)}</td>
                  <td>{formatDate(asset.WARRANTY_EXPIRY_DATE)}</td>
                  <td>
                    <span className={getStatusBadgeClass(asset.STATUS)}>
                      {asset.STATUS}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="rw-button rw-button-secondary"
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                        onClick={() => handleEdit(asset)}
                        title="Edit asset"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="rw-button rw-button-danger"
                        style={{ fontSize: '12px', padding: '4px 12px', background: '#D32F2F', color: 'white' }}
                        onClick={() => handleDelete(asset)}
                        title="Delete asset"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}

      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        .kpi-card {
          display: flex;
          gap: var(--spacing-md);
        }
        .kpi-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-content {
          flex: 1;
        }
        .kpi-label {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          margin-bottom: var(--spacing-xs);
        }
        .kpi-value {
          font-size: var(--font-size-3xl);
          font-weight: 600;
          color: var(--redwood-gray-900);
          margin-bottom: var(--spacing-xs);
        }
        .kpi-change {
          font-size: var(--font-size-xs);
          font-weight: 500;
        }
        .kpi-change.positive { color: var(--redwood-success); }
        .kpi-change.negative { color: var(--redwood-error); }
        .kpi-change.neutral { color: var(--redwood-gray-600); }
        .kpi-change.warning { color: var(--redwood-warning); }
      `}</style>

      {/* Asset Form Modal */}
      <AssetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        asset={selectedAsset}
        onSuccess={handleFormSuccess}
      />

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        columns={drillDownModal.columns}
      />
    </div>
  );
}

export default Assets;
