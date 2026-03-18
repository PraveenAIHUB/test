import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import '../../styles/redwood-authentic.css';

import { API_URL } from '../../config/api';
const API_BASE = API_URL;

function AllSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSpace, setViewSpace] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    property_id: '',
    floor: '',
    type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [filters, pagination.page]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties?limit=100`);
      setProperties(res.data.data || []);
    } catch (_) {
      setProperties([]);
    }
  };

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.floor) params.append('floor', filters.floor);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));

      const response = await axios.get(`${API_BASE}/space?${params}`);
      const data = response.data;
      setSpaces(Array.isArray(data.data) ? data.data : []);
      if (data.pagination) setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Error fetching spaces:', error);
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyName = (space) => {
    if (!space) return '—';
    const pid = space.PROPERTY_ID ?? space.property_id;
    const p = properties.find(pr => String(pr.PROPERTY_ID ?? pr.property_id) === String(pid));
    return p ? (p.PROPERTY_NAME ?? p.property_name) : (space.PROPERTY_NAME ?? space.property_name ?? pid ?? '—');
  };

  const getCategory = (space) => {
    const c = space.CATEGORY ?? space.category;
    if (c) return c;
    const code = String(space.SPACE_CODE ?? space.space_code ?? '');
    return code.includes('-U-') ? 'Unit' : 'Space';
  };

  const handleDeleteSpace = async (space) => {
    const code = space.SPACE_CODE ?? space.space_code ?? 'this space';
    if (!window.confirm(`Delete "${code}"? This cannot be undone.`)) return;
    const id = String(space.SPACE_ID ?? space.space_id ?? '').trim();
    if (!id) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE}/space/${id}`);
      setViewSpace(null);
      await fetchSpaces();
    } catch (err) {
      const e = err.response?.data?.error;
      const msg = typeof e === 'string' ? e : (e?.message || err.response?.data?.message || err.message || 'Failed to delete space/unit');
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && spaces.length === 0) {
    return <div className="rw-loading">Loading spaces...</div>;
  }

  return (
    <div className="rw-page-content">
      {/* Filters */}
      <div className="rw-filters">
        <div className="rw-filter-group">
          <input
            type="search"
            placeholder="Search by code or name..."
            className="rw-input"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="rw-filter-group">
          <select
            className="rw-select"
            value={filters.property_id}
            onChange={(e) => handleFilterChange('property_id', e.target.value)}
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.PROPERTY_ID ?? p.property_id} value={p.PROPERTY_ID ?? p.property_id}>
                {p.PROPERTY_NAME ?? p.property_name ?? p.PROPERTY_CODE ?? p.property_code}
              </option>
            ))}
          </select>
        </div>
        <div className="rw-filter-group">
          <select
            className="rw-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="OFFICE">Office</option>
            <option value="RETAIL">Retail</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="COMMON">Common Area</option>
            <option value="STORAGE">Storage</option>
          </select>
        </div>
        <div className="rw-filter-group">
          <select
            className="rw-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="rw-table-container" style={{ marginTop: '20px' }}>
        <table className="rw-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Property</th>
              <th>Floor</th>
              <th>Type</th>
              <th>Area (sqm)</th>
              <th>Status</th>
              <th>Occupant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {spaces.length > 0 ? (
              spaces.map((space) => {
                const status = space.STATUS ?? space.status ?? '';
                const statusClass = status ? `rw-status-${String(status).toLowerCase()}` : 'rw-status-vacant';
                return (
                  <tr key={space.SPACE_ID ?? space.space_id ?? space.SPACE_CODE ?? space.space_code ?? Math.random()}>
                    <td>{space.SPACE_CODE ?? space.space_code ?? '-'}</td>
                    <td>{getCategory(space)}</td>
                    <td>{getPropertyName(space)}</td>
                    <td>{space.FLOOR ?? space.floor_number ?? space.floor ?? '-'}</td>
                    <td>{space.SPACE_TYPE ?? space.space_type ?? '-'}</td>
                    <td>{space.AREA ?? space.area ?? space.AREA_SQM ?? space.area_sqm ?? '-'}</td>
                    <td>
                      <span className={`rw-badge ${statusClass}`}>{status || '-'}</span>
                    </td>
                    <td>{space.TENANT_NAME ?? space.tenant_name ?? space.OCCUPANT ?? space.occupant ?? '-'}</td>
                    <td>
                      <button type="button" className="rw-btn rw-btn-sm rw-btn-secondary" onClick={() => setViewSpace(space)}>View</button>
                      <button type="button" className="rw-btn rw-btn-sm rw-btn-secondary" style={{ marginLeft: '6px', color: 'var(--rw-error, #c62828)' }} onClick={() => handleDeleteSpace(space)} disabled={deletingId === (space.SPACE_ID ?? space.space_id)}>{deletingId === (space.SPACE_ID ?? space.space_id) ? 'Deleting…' : 'Delete'}</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  No spaces found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Space detail modal */}
      <Modal isOpen={!!viewSpace} onClose={() => setViewSpace(null)} title="Space / Unit Details" size="small">
        {viewSpace && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div><strong>Code</strong><br />{viewSpace.SPACE_CODE ?? viewSpace.space_code ?? '-'}</div>
            <div><strong>Category</strong><br />{getCategory(viewSpace)}</div>
            <div><strong>Property</strong><br />{getPropertyName(viewSpace)}</div>
            <div><strong>Floor</strong><br />{viewSpace.FLOOR ?? viewSpace.floor_number ?? viewSpace.floor ?? '-'}</div>
            <div><strong>Type</strong><br />{viewSpace.SPACE_TYPE ?? viewSpace.space_type ?? '-'}</div>
            <div><strong>Area (sqm)</strong><br />{viewSpace.AREA ?? viewSpace.area ?? '-'}</div>
            <div><strong>Status</strong><br /><span className={`rw-badge rw-status-${String(viewSpace.STATUS ?? viewSpace.status ?? '').toLowerCase()}`}>{viewSpace.STATUS ?? viewSpace.status ?? '-'}</span></div>
            <div><strong>Occupant / Tenant</strong><br />{viewSpace.TENANT_NAME ?? viewSpace.tenant_name ?? viewSpace.OCCUPANT ?? '-'}</div>
            {(viewSpace.LEASE_ID ?? viewSpace.lease_id) && <div><strong>Lease ID</strong><br />{viewSpace.LEASE_ID ?? viewSpace.lease_id}</div>}
            <div className="rw-form-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button type="button" className="rw-btn rw-btn-primary" onClick={() => setViewSpace(null)}>Close</button>
              <button type="button" className="rw-btn rw-btn-secondary" style={{ color: 'var(--rw-error, #c62828)' }} onClick={() => viewSpace && handleDeleteSpace(viewSpace)} disabled={deletingId === (viewSpace?.SPACE_ID ?? viewSpace?.space_id)}>{deletingId === (viewSpace?.SPACE_ID ?? viewSpace?.space_id) ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pagination */}
      <div className="rw-pagination" style={{ marginTop: '20px' }}>
        <div className="rw-pagination-info">
          Showing {spaces.length} of {pagination.total ?? 0} spaces
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="rw-btn rw-btn-sm rw-btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button
              className="rw-btn rw-btn-sm rw-btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllSpaces;

