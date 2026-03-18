import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from './DrillDownModal';
import WorkOrderForm from './WorkOrderForm';
import { getWorkOrderDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function WorkOrders() {
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const dashboardConfig = getWorkOrderDashboardConfig();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/workorders/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching work order stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'workorder-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'workorder-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'workOrdersByType':
        modalData.title = 'Work Orders by Type - Detailed View';
        modalData.data = dashboardStats.workOrdersByType;
        modalData.columns = [
          { key: 'type', label: 'Type' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'workOrdersByPriority':
        modalData.title = 'Work Orders by Priority - Detailed View';
        modalData.data = dashboardStats.workOrdersByPriority;
        modalData.columns = [
          { key: 'priority', label: 'Priority' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'recentWorkOrders':
        modalData.title = 'Recent Work Orders - Detailed View';
        modalData.data = dashboardStats.recentWorkOrders;
        modalData.columns = [
          { key: 'woNumber', label: 'WO Number' },
          { key: 'property', label: 'Property' },
          { key: 'type', label: 'Type' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status' }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  // Prepare KPI data from backend stats
  const kpiData = dashboardStats ? [
    {
      label: 'Open Work Orders',
      value: dashboardStats.kpis.openWorkOrders.toString(),
      change: 'Pending action',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
      bgColor: '#FFF3E0',
      color: '#F57C00'
    },
    {
      label: 'In Progress',
      value: dashboardStats.kpis.inProgress.toString(),
      change: 'Active work',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Completed MTD',
      value: dashboardStats.kpis.completedMTD.toString(),
      change: 'This month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Avg Resolution',
      value: `${dashboardStats.kpis.avgResolution} days`,
      change: '-12% from last month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#E8E0F5',
      color: '#6B4C9A'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Work Orders</h1>
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

          <button type="button" className="rw-button rw-button-accent" onClick={() => { setEditingWorkOrder(null); setShowWorkOrderForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Work Order</span>
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
              {/* Chart 1: Work Orders by Type */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('workOrdersByType')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Work Orders by Type</h3>
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
                  {dashboardStats.workOrdersByType.map((item, i) => {
                    const colors = ['#2C5F6F', '#FF6B35', '#D32F2F', '#6B4C9A'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.type}</span>
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

              {/* Chart 2: Work Orders by Priority */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('workOrdersByPriority')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Work Orders by Priority</h3>
                    <p className="rw-chart-subtitle">Current Status</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.workOrdersByPriority.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#2C5F6F' }}>{item.priority}</div>
                      <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.percentage}%`,
                          background: i === 0 ? '#D32F2F' : i === 1 ? '#FF6B35' : i === 2 ? '#F57C00' : '#2E7D32',
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

              {/* Chart 3: Recent Work Orders */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('recentWorkOrders')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Recent Work Orders</h3>
                    <p className="rw-chart-subtitle">Latest Activity</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.recentWorkOrders.map((item, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${item.priority === 'High' ? '#FF6B35' : item.priority === 'Critical' ? '#D32F2F' : '#2C5F6F'}`
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C5F6F', marginBottom: '4px' }}>
                        {item.woNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: '#757575', marginBottom: '2px' }}>
                        {item.property}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#757575' }}>{item.type}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: item.status === 'Completed' ? '#2E7D32' : item.status === 'In Progress' ? '#2C5F6F' : '#F57C00'
                        }}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rw-card">
          <p>Work order list view - Coming soon</p>
        </div>
      )}

      {/* Create/Edit Work Order Modal */}
      <WorkOrderForm
        isOpen={showWorkOrderForm}
        onClose={() => { setShowWorkOrderForm(false); setEditingWorkOrder(null); }}
        workOrder={editingWorkOrder}
        onSuccess={() => { fetchDashboardStats(); setShowWorkOrderForm(false); setEditingWorkOrder(null); }}
      />

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        columns={drillDownModal.columns}
      />

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
    </div>
  );
}

export default WorkOrders;
