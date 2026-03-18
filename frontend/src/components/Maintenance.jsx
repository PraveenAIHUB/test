import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from './DrillDownModal';
import WorkOrderForm from './WorkOrderForm';
import { getMaintenanceDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Maintenance() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const dashboardConfig = getMaintenanceDashboardConfig();

  useEffect(() => {
    fetchData();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/maintenance/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/maintenance/schedules');
      setSchedules(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'maintenance-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'maintenance-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'maintenanceByType':
        modalData.title = 'Maintenance by Type - Detailed View';
        modalData.data = maintenanceByType;
        modalData.columns = [
          { key: 'type', label: 'Type' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'costByCategory':
        modalData.title = 'Cost by Category - Detailed View';
        modalData.data = costByCategory;
        modalData.columns = [
          { key: 'category', label: 'Category' },
          { key: 'cost', label: 'Cost', render: (val) => `KES ${(val / 1000000).toFixed(2)}M` },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'upcomingSchedules':
        modalData.title = 'Upcoming Schedules - Detailed View';
        modalData.data = upcomingSchedules;
        modalData.columns = [
          { key: 'task', label: 'Task' },
          { key: 'property', label: 'Property' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  // Normalize stats: API may return workOrdersByType; frontend expects maintenanceByType, costByCategory, upcomingSchedules
  const kpis = dashboardStats?.kpis || {};
  const maintenanceByType = Array.isArray(dashboardStats?.maintenanceByType) ? dashboardStats.maintenanceByType : (Array.isArray(dashboardStats?.workOrdersByType) ? dashboardStats.workOrdersByType : []);
  const costByCategory = Array.isArray(dashboardStats?.costByCategory) ? dashboardStats.costByCategory : [];
  const upcomingSchedules = Array.isArray(dashboardStats?.upcomingSchedules) ? dashboardStats.upcomingSchedules : [];

  const kpiData = dashboardStats ? [
    {
      label: 'Monthly Spend',
      value: `KES ${((kpis.monthlySpend ?? 0) / 1000000).toFixed(1)}M`,
      change: '+5.2% from last month',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#F57C00'
    },
    {
      label: 'Preventive Maintenance',
      value: `${kpis.preventivePercentage ?? kpis.totalWorkOrders ?? 0}%`,
      change: 'vs corrective',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Scheduled Tasks',
      value: kpis.scheduledTasks ?? kpis.totalWorkOrders ?? 0,
      change: 'This month',
      changeType: 'neutral',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Compliance Rate',
      value: `${kpis.complianceRate ?? 0}%`,
      change: 'Above target',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      bgColor: '#E8E0F5',
      color: '#6B4C9A'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <div>
          <h1 className="rw-page-title">Maintenance Management</h1>
          <p className="rw-page-subtitle">Preventive maintenance schedules and history</p>
        </div>
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

          <button type="button" className="rw-button rw-button-accent" onClick={() => setShowScheduleForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Schedule</span>
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
              {/* Chart 1: Maintenance by Type */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('maintenanceByType')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Maintenance by Type</h3>
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
                  {maintenanceByType.map((item, i) => {
                    const colors = ['#2E7D32', '#2C5F6F', '#D32F2F'];
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

              {/* Chart 2: Cost by Category */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('costByCategory')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Cost by Category</h3>
                    <p className="rw-chart-subtitle">Monthly Breakdown</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {costByCategory.map((item, i) => {
                    const colors = ['#2C5F6F', '#FF6B35', '#00758F', '#6B4C9A', '#F57C00'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.category}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors[i] }}>
                            KES {(item.cost / 1000000).toFixed(2)}M
                          </span>
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

              {/* Chart 3: Upcoming Schedules */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('upcomingSchedules')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Upcoming Schedules</h3>
                    <p className="rw-chart-subtitle">Next 30 Days</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {upcomingSchedules.map((item, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: '3px solid #2C5F6F'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C5F6F', marginBottom: '4px' }}>
                        {item.task}
                      </div>
                      <div style={{ fontSize: '11px', color: '#757575', marginBottom: '2px' }}>
                        {item.property}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#757575' }}>{item.dueDate}</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#2E7D32' }}>
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
        <>
          <div className="rw-card">
        <div className="rw-card-header">
          <h2 className="rw-card-title">Maintenance Schedules ({schedules.length})</h2>
        </div>
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>Loading...</p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Schedule Name</th>
                  <th>Asset</th>
                  <th>Property</th>
                  <th>Frequency</th>
                  <th>Next Due Date</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.SCHEDULE_ID}>
                    <td><strong>{schedule.SCHEDULE_NAME}</strong></td>
                    <td>{schedule.ASSET_NAME}</td>
                    <td>{schedule.PROPERTY_NAME}</td>
                    <td>{schedule.FREQUENCY}</td>
                    <td>{schedule.NEXT_DUE_DATE ? new Date(schedule.NEXT_DUE_DATE).toLocaleDateString() : '-'}</td>
                    <td>{schedule.ASSIGNED_TO}</td>
                    <td>
                      <span className="rw-badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                        {schedule.STATUS}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

      {/* New Schedule = Create Work Order (saved to DB) */}
      <WorkOrderForm
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        workOrder={null}
        onSuccess={() => {
          fetchData();
          fetchDashboardStats();
          setShowScheduleForm(false);
        }}
        defaultType="PREVENTIVE"
        title="New Schedule"
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

export default Maintenance;
