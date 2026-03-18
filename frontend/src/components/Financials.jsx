import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from './DrillDownModal';
import InvoiceForm from './InvoiceForm';
import { getFinancialDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Financials() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ transaction_type: '', status: '' });
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const dashboardConfig = getFinancialDashboardConfig();

  useEffect(() => {
    fetchData();
    fetchDashboardStats();
  }, [filters]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/financials/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.status) params.append('status', filters.status);

      const [txnResponse, summaryResponse] = await Promise.all([
        axios.get(`/api/financials?${params}`),
        axios.get('/api/financials/summary')
      ]);

      setTransactions(txnResponse.data.data || []);
      setSummary(summaryResponse.data.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'financial-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'financial-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'revenueByMonth':
        modalData.title = 'Revenue by Month - Detailed View';
        modalData.data = dashboardStats.revenueByMonth;
        modalData.columns = [
          { key: 'month', label: 'Month' },
          { key: 'revenue', label: 'Revenue', render: (val) => `KES ${(val / 1000000).toFixed(1)}M` }
        ];
        break;
      case 'expensesByCategory':
        modalData.title = 'Expenses by Category - Detailed View';
        modalData.data = dashboardStats.expensesByCategory;
        modalData.columns = [
          { key: 'category', label: 'Category' },
          { key: 'amount', label: 'Amount', render: (val) => `KES ${(val / 1000000).toFixed(1)}M` },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'collectionRate':
        modalData.title = 'Collection Rate - Detailed View';
        modalData.data = dashboardStats.collectionRate;
        modalData.columns = [
          { key: 'month', label: 'Month' },
          { key: 'rate', label: 'Collection Rate', render: (val) => `${val}%` }
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

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
      PENDING: { backgroundColor: '#FFF3E0', color: '#F57C00' },
      FAILED: { backgroundColor: '#FFEBEE', color: '#C62828' }
    };
    return styles[status] || styles.PENDING;
  };

  // Prepare KPI data from backend stats
  const kpiData = dashboardStats ? [
    {
      label: 'Monthly Revenue',
      value: `KES ${(dashboardStats.kpis.monthlyRevenue / 1000000).toFixed(1)}M`,
      change: '+2.8% from last month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Collections',
      value: `KES ${(dashboardStats.kpis.collections / 1000000).toFixed(1)}M`,
      change: '91.9% collection rate',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Outstanding',
      value: `KES ${(dashboardStats.kpis.outstanding / 1000000).toFixed(1)}M`,
      change: 'Pending collection',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      bgColor: '#FFF3E0',
      color: '#F57C00'
    },
    {
      label: 'Net Operating Income',
      value: `KES ${(dashboardStats.kpis.netOperatingIncome / 1000000).toFixed(1)}M`,
      change: '+4.2% YoY',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      bgColor: '#E8E0F5',
      color: '#6B4C9A'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <div>
          <h1 className="rw-page-title">Financial Management</h1>
          <p className="rw-page-subtitle">Track revenue, expenses, and financial transactions</p>
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

          <button className="rw-button rw-button-accent" onClick={() => setShowTransactionForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Transaction</span>
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
              {/* Chart 1: Revenue by Month */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('revenueByMonth')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Revenue Trend</h3>
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
                  {dashboardStats.revenueByMonth.map((item, i) => {
                    const maxRevenue = Math.max(...dashboardStats.revenueByMonth.map(r => r.revenue));
                    const heightPercent = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.month}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#2C5F6F' }}>
                            KES {(item.revenue / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${heightPercent}%`,
                            background: '#2C5F6F',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Expenses by Category */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('expensesByCategory')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Expenses by Category</h3>
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
                  {dashboardStats.expensesByCategory.map((item, i) => {
                    const colors = ['#2C5F6F', '#FF6B35', '#00758F', '#6B4C9A', '#F57C00'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.category}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors[i] }}>
                            KES {(item.amount / 1000000).toFixed(1)}M
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

              {/* Chart 3: Collection Rate */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('collectionRate')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Collection Rate</h3>
                    <p className="rw-chart-subtitle">Monthly Performance</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.collectionRate.map((item, i) => (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.month}</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: item.rate >= 95 ? '#2E7D32' : item.rate >= 90 ? '#F57C00' : '#D32F2F'
                        }}>
                          {item.rate}%
                        </span>
                      </div>
                      <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.rate}%`,
                          background: item.rate >= 95 ? '#2E7D32' : item.rate >= 90 ? '#F57C00' : '#D32F2F',
                          borderRadius: '4px'
                        }}></div>
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
          {/* Financial Summary */}
          {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
          <div className="rw-card">
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--redwood-gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                Total Revenue
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: '#2E7D32' }}>
                {formatCurrency(summary.total_revenue)}
              </div>
            </div>
          </div>
          <div className="rw-card">
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--redwood-gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                Total Expenses
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: '#C62828' }}>
                {formatCurrency(summary.total_expenses)}
              </div>
            </div>
          </div>
          <div className="rw-card">
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--redwood-gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                Net Income
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--redwood-primary)' }}>
                {formatCurrency(summary.net_income)}
              </div>
            </div>
          </div>
          <div className="rw-card">
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--redwood-gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                Pending Payments
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: '#F57C00' }}>
                {formatCurrency(summary.pending_payments)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rw-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div>
            <label className="rw-label">Transaction Type</label>
            <select
              className="rw-input"
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="RENT">Rent</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UTILITIES">Utilities</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="rw-label">Status</label>
            <select
              className="rw-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rw-card">
        <div className="rw-card-header">
          <h2 className="rw-card-title">Recent Transactions ({transactions.length})</h2>
        </div>
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>
              No transactions found
            </p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Transaction #</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>ERP Sync</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.TRANSACTION_ID}>
                    <td><strong>{txn.TRANSACTION_NUMBER}</strong></td>
                    <td>{new Date(txn.TRANSACTION_DATE).toLocaleDateString()}</td>
                    <td>{txn.TRANSACTION_TYPE}</td>
                    <td>{txn.PROPERTY_NAME}</td>
                    <td>{txn.TENANT_NAME || '-'}</td>
                    <td><strong>{formatCurrency(txn.AMOUNT)}</strong></td>
                    <td>
                      <span className="rw-badge" style={getStatusBadge(txn.STATUS)}>
                        {txn.STATUS}
                      </span>
                    </td>
                    <td>
                      <span className="rw-badge" style={txn.ERP_SYNC_STATUS === 'SYNCED' ?
                        { backgroundColor: '#E8F5E9', color: '#2E7D32' } :
                        { backgroundColor: '#FFF3E0', color: '#F57C00' }}>
                        {txn.ERP_SYNC_STATUS}
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

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        columns={drillDownModal.columns}
      />

      <InvoiceForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={() => { fetchData(); fetchDashboardStats(); }}
      />
    </div>
  );
}

export default Financials;

