import '../../styles/redwood-authentic.css';

function TenantSettings() {
  return (
    <div className="rw-settings-view">
      <div className="rw-action-bar">
        <div className="rw-action-bar-left">
          <h2 className="rw-section-title">Tenant Settings</h2>
        </div>
        <div className="rw-action-bar-right">
          <button className="rw-button rw-button-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="rw-card">
        <div className="rw-card-header">
          <h3 className="rw-card-title">Tenant Type Configuration</h3>
        </div>
        <div className="rw-card-content">
          <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
            <div>
              <label className="rw-label">Default Tenant Type</label>
              <select className="rw-input">
                <option>Individual</option>
                <option>Corporate</option>
                <option>Government</option>
              </select>
            </div>
            <div>
              <label className="rw-label">Tenant Code Prefix</label>
              <input type="text" className="rw-input" placeholder="TEN-" defaultValue="TEN-" />
            </div>
            <div>
              <label className="rw-checkbox-label">
                <input type="checkbox" className="rw-checkbox" defaultChecked />
                <span>Auto-generate tenant codes</span>
              </label>
            </div>
            <div>
              <label className="rw-checkbox-label">
                <input type="checkbox" className="rw-checkbox" defaultChecked />
                <span>Require contact person for all tenants</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rw-card">
        <div className="rw-card-header">
          <h3 className="rw-card-title">Notification Settings</h3>
        </div>
        <div className="rw-card-content">
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div>
              <label className="rw-checkbox-label">
                <input type="checkbox" className="rw-checkbox" defaultChecked />
                <span>Notify on new tenant registration</span>
              </label>
            </div>
            <div>
              <label className="rw-checkbox-label">
                <input type="checkbox" className="rw-checkbox" defaultChecked />
                <span>Notify on tenant status change</span>
              </label>
            </div>
            <div>
              <label className="rw-checkbox-label">
                <input type="checkbox" className="rw-checkbox" />
                <span>Send welcome email to new tenants</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantSettings;

