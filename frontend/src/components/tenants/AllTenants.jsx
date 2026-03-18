import { useState, useEffect } from 'react';
import axios from 'axios';
import TenantForm from '../TenantForm';
import '../../styles/redwood-authentic.css';

function AllTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, [filters]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/tenants?${params}`);
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
      INACTIVE: { backgroundColor: '#FFEBEE', color: '#C62828' }
    };
    return styles[status] || styles.ACTIVE;
  };

  const handleCreate = () => {
    setSelectedTenant(null);
    setShowForm(true);
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setShowForm(true);
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete ${tenant.TENANT_NAME || tenant.tenant_name}?`)) {
      return;
    }

    try {
      const tenantId = tenant.TENANT_ID || tenant.tenant_id;
      await axios.delete(`/api/tenants/${tenantId}`);
      fetchTenants();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      alert('Failed to delete tenant');
    }
  };

  const handleFormSuccess = () => {
    fetchTenants();
  };

  return (
    <div className="rw-list-view">
      {/* Action Bar */}
      <div className="rw-action-bar">
        <div className="rw-action-bar-left">
          <h2 className="rw-section-title">All Tenants ({tenants.length})</h2>
        </div>
        <div className="rw-action-bar-right">
          <button className="rw-button rw-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Import</span>
          </button>
          <button className="rw-button rw-button-primary" onClick={handleCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rw-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div>
            <label className="rw-label">Search</label>
            <input
              type="text"
              className="rw-input"
              placeholder="Search by name or code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="rw-label">Status</label>
            <select
              className="rw-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="rw-label">Type</label>
            <select
              className="rw-input"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
              <option value="GOVERNMENT">Government</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rw-card">
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--rw-gray-600)' }}>
              Loading tenants...
            </p>
          ) : tenants.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--rw-gray-600)' }}>
              No tenants found
            </p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Tenant Code</th>
                  <th>Tenant Name</th>
                  <th>Type</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.TENANT_ID}>
                    <td><strong>{tenant.TENANT_CODE}</strong></td>
                    <td>{tenant.TENANT_NAME}</td>
                    <td>{tenant.TENANT_TYPE}</td>
                    <td>{tenant.CONTACT_PERSON}</td>
                    <td>{tenant.CONTACT_EMAIL}</td>
                    <td>{tenant.CONTACT_PHONE}</td>
                    <td>
                      <span className="rw-badge" style={getStatusBadge(tenant.STATUS)}>
                        {tenant.STATUS}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="rw-button rw-button-secondary"
                          style={{ fontSize: '12px', padding: '4px 12px' }}
                          onClick={() => handleEdit(tenant)}
                          title="Edit tenant"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="rw-button rw-button-danger"
                          style={{ fontSize: '12px', padding: '4px 12px', background: '#D32F2F', color: 'white' }}
                          onClick={() => handleDelete(tenant)}
                          title="Delete tenant"
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
      </div>

      {/* Tenant Form Modal */}
      <TenantForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        tenant={selectedTenant}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

export default AllTenants;

