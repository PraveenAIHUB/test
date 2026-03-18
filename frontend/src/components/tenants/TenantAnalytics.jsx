import '../../styles/redwood-authentic.css';

function TenantAnalytics() {
  return (
    <div className="rw-analytics-view">
      <div className="rw-action-bar">
        <div className="rw-action-bar-left">
          <h2 className="rw-section-title">Tenant Analytics</h2>
        </div>
      </div>

      <div className="rw-card">
        <div className="rw-card-content">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C74634" strokeWidth="2" style={{ margin: '0 auto 20px' }}>
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D2D2D', marginBottom: '12px' }}>
              Tenant Analytics
            </h3>
            <p style={{ fontSize: '14px', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
              Advanced analytics and reporting for tenant data including occupancy trends, revenue analysis, and tenant satisfaction metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantAnalytics;

