import { useState } from 'react';
import '../styles/redwood-theme.css';

/**
 * Reusable Module Dashboard Component
 * Displays KPIs, charts, and quick actions for each module
 */
function ModuleDashboard({ 
  moduleName, 
  kpis = [], 
  charts = [], 
  quickActions = [],
  onViewAll 
}) {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="module-dashboard">
      {/* View Toggle */}
      <div className="view-toggle" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <button 
          className={`rw-button ${activeView === 'dashboard' ? 'rw-button-primary' : 'rw-button-secondary'}`}
          onClick={() => setActiveView('dashboard')}
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
          className={`rw-button ${activeView === 'list' ? 'rw-button-primary' : 'rw-button-secondary'}`}
          onClick={() => { setActiveView('list'); onViewAll && onViewAll(); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>View All</span>
        </button>
      </div>

      {activeView === 'dashboard' && (
        <>
          {/* KPI Cards */}
          {kpis.length > 0 && (
            <div className="kpi-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
              {kpis.map((kpi, index) => (
                <div key={index} className="rw-card kpi-card">
                  <div className="kpi-icon" style={{ backgroundColor: kpi.bgColor, color: kpi.color }}>
                    <div dangerouslySetInnerHTML={{ __html: kpi.icon }} />
                  </div>
                  <div className="kpi-content">
                    <div className="kpi-label">{kpi.label}</div>
                    <div className="kpi-value">{kpi.value}</div>
                    {kpi.change && (
                      <div className={`kpi-change ${kpi.changeType || 'positive'}`}>
                        {kpi.change}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts/Reports Grid */}
          {charts.length > 0 && (
            <div className="reports-grid">
              {charts.map((chart, index) => (
                <div key={index} className="rw-card">
                  <div className="report-header">
                    <h3 className="card-title">{chart.title}</h3>
                    {chart.period && <span className="report-period">{chart.period}</span>}
                  </div>
                  <div className="chart-content">
                    {chart.content}
                  </div>
                  {chart.footer && (
                    <div className="report-footer">
                      <span className="report-total">{chart.footer}</span>
                      {chart.action && (
                        <button className="rw-button rw-button-secondary rw-button-sm" onClick={chart.action.onClick}>
                          {chart.action.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="rw-card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3 className="card-title">Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                {quickActions.map((action, index) => (
                  <button 
                    key={index}
                    className="rw-button rw-button-secondary"
                    onClick={action.onClick}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: action.icon }} />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .view-toggle {
          display: flex;
          gap: var(--spacing-sm);
        }

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
      `}</style>
    </div>
  );
}

export default ModuleDashboard;

