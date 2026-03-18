import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from './DrillDownModal';
import { getEnergyDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Energy() {
  const [consumption, setConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const dashboardConfig = getEnergyDashboardConfig();

  useEffect(() => {
    fetchData();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/energy/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching energy stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/energy/consumption');
      setConsumption(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error:', error);
      setConsumption([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'energy-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'energy-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'consumptionByProperty':
        modalData.title = 'Consumption by Property - Detailed View';
        modalData.data = consumptionByProperty;
        modalData.columns = [
          { key: 'property', label: 'Property' },
          { key: 'consumption', label: 'Consumption (kWh)', render: (val) => val.toLocaleString() },
          { key: 'cost', label: 'Cost', render: (val) => `KES ${(val / 1000000).toFixed(2)}M` }
        ];
        break;
      case 'consumptionTrend':
        modalData.title = 'Consumption Trend - Detailed View';
        modalData.data = consumptionTrend;
        modalData.columns = [
          { key: 'month', label: 'Month' },
          { key: 'consumption', label: 'Consumption (kWh)', render: (val) => val.toLocaleString() },
          { key: 'cost', label: 'Cost', render: (val) => `KES ${(val / 1000000).toFixed(2)}M` }
        ];
        break;
      case 'energySourceMix':
        modalData.title = 'Energy Source Mix - Detailed View';
        modalData.data = energySourceMix;
        modalData.columns = [
          { key: 'source', label: 'Source' },
          { key: 'amount', label: 'Amount (kWh)', render: (val) => val.toLocaleString() },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Normalize: API returns { kpis: { totalConsumption, totalCost }, energyByType }; frontend expects consumptionByProperty, consumptionTrend, energySourceMix
  const kpis = dashboardStats?.kpis || {};
  const energyByType = Array.isArray(dashboardStats?.energyByType) ? dashboardStats.energyByType : [];
  const consumptionByProperty = Array.isArray(dashboardStats?.consumptionByProperty) ? dashboardStats.consumptionByProperty : energyByType.map(({ type, consumption, cost }) => ({ property: type, consumption: consumption || 0, cost: cost || 0 }));
  const consumptionTrend = Array.isArray(dashboardStats?.consumptionTrend) ? dashboardStats.consumptionTrend : [];
  const energySourceMix = Array.isArray(dashboardStats?.energySourceMix) ? dashboardStats.energySourceMix : energyByType.map(({ type, consumption, percentage }) => ({ source: type, percentage: parseFloat(percentage) || 0, amount: consumption || 0 }));

  const kpiData = dashboardStats ? [
    {
      label: 'Monthly Consumption',
      value: `${((kpis.monthlyConsumption ?? kpis.totalConsumption ?? 0) / 1000).toFixed(0)}k kWh`,
      change: '-2.1% from last month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
      bgColor: '#FFF8E1',
      color: '#F57C00'
    },
    {
      label: 'Energy Cost',
      value: `KES ${((kpis.energyCost ?? kpis.totalCost ?? 0) / 1000000).toFixed(1)}M`,
      change: 'Monthly expenditure',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#FF6B35'
    },
    {
      label: 'Solar Generation',
      value: `${((kpis.solarGeneration ?? 0) / 1000).toFixed(0)}k kWh`,
      change: '+12.5% from last month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Carbon Savings',
      value: `${kpis.carbonSavings ?? 0} tons CO₂`,
      change: 'Environmental impact',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <div>
          <h1 className="rw-page-title">Energy & Sustainability</h1>
          <p className="rw-page-subtitle">Monitor energy consumption and sustainability goals</p>
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
              {/* Chart 1: Consumption by Property */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('consumptionByProperty')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Consumption by Property</h3>
                    <p className="rw-chart-subtitle">Monthly Usage</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {consumptionByProperty.map((item, i) => {
                    const maxConsumption = Math.max(1, ...consumptionByProperty.map(p => p.consumption || 0));
                    const widthPercent = (item.consumption / maxConsumption) * 100;
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.property}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#2C5F6F' }}>
                            {(item.consumption / 1000).toFixed(0)}k kWh
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${widthPercent}%`,
                            background: '#2C5F6F',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Consumption Trend */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('consumptionTrend')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Consumption Trend</h3>
                    <p className="rw-chart-subtitle">Last 7 Months</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {consumptionTrend.map((item, i) => {
                    const maxConsumption = Math.max(1, ...consumptionTrend.map(t => t.consumption || 0));
                    const heightPercent = (item.consumption / maxConsumption) * 100;
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.month}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#FF6B35' }}>
                            {(item.consumption / 1000).toFixed(0)}k kWh
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${heightPercent}%`,
                            background: '#FF6B35',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 3: Energy Source Mix */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('energySourceMix')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Energy Source Mix</h3>
                    <p className="rw-chart-subtitle">Current Distribution</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {energySourceMix.map((item, i) => {
                    const colors = ['#2C5F6F', '#2E7D32'];
                    return (
                      <div key={i} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: colors[i] }}>{item.source}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: colors[i] }}>{item.percentage}%</span>
                        </div>
                        <div style={{ height: '12px', background: '#F5F5F5', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${item.percentage}%`,
                            background: colors[i],
                            borderRadius: '6px'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#757575', marginTop: '4px' }}>
                          {(item.amount / 1000).toFixed(0)}k kWh
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="rw-card">
        <div className="rw-card-header">
          <h2 className="rw-card-title">Energy Consumption by Property</h2>
        </div>
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>Loading...</p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Consumption</th>
                  <th>Unit</th>
                  <th>Cost</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {consumption.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No consumption records</td></tr>
                ) : consumption.map((item, index) => (
                  <tr key={item.ENERGY_ID ?? item.ENERGY_RECORD_ID ?? index}>
                    <td><strong>{item.PROPERTY_NAME ?? '-'}</strong></td>
                    <td>{item.UTILITY_TYPE ?? item.ENERGY_TYPE ?? '-'}</td>
                    <td>{item.BILLING_PERIOD ?? item.READING_DATE ?? '-'}</td>
                    <td>{(item.CONSUMPTION ?? 0).toLocaleString()}</td>
                    <td>{item.UNIT ?? '-'}</td>
                    <td>{item.COST != null ? formatCurrency(item.COST) : '-'}</td>
                    <td>{item.PAID ? 'Yes' : 'No'}</td>
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

export default Energy;
