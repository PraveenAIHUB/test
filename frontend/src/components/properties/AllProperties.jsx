import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyForm from '../PropertyForm';
import '../../styles/redwood-authentic.css';

import { API_URL } from '../../config/api';
const API_BASE_URL = API_URL;

function AllProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Advanced filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    city: '',
    searchQuery: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchProperties();
  }, [filters, currentPage]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.city) params.append('city', filters.city);
      if (filters.searchQuery) params.append('search', filters.searchQuery);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const response = await axios.get(`${API_BASE_URL}/properties?${params}`);
      setProperties(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
      // Mock data fallback
      setProperties([
        {
          PROPERTY_ID: 1,
          PROPERTY_CODE: 'PROP-001',
          PROPERTY_NAME: 'Westlands Office Complex',
          PROPERTY_TYPE: 'COMMERCIAL',
          STATUS: 'ACTIVE',
          CITY: 'Nairobi',
          ADDRESS: 'Westlands Road, Nairobi',
          TOTAL_AREA: 50000,
          TOTAL_UNITS: 25,
          PURCHASE_DATE: '2020-01-15',
          PURCHASE_PRICE: 450000000
        },
        {
          PROPERTY_ID: 2,
          PROPERTY_CODE: 'PROP-002',
          PROPERTY_NAME: 'Kilimani Residential Tower',
          PROPERTY_TYPE: 'RESIDENTIAL',
          STATUS: 'ACTIVE',
          CITY: 'Nairobi',
          ADDRESS: 'Kilimani Avenue, Nairobi',
          TOTAL_AREA: 75000,
          TOTAL_UNITS: 120,
          PURCHASE_DATE: '2019-06-20',
          PURCHASE_PRICE: 680000000
        },
        {
          PROPERTY_ID: 3,
          PROPERTY_CODE: 'PROP-003',
          PROPERTY_NAME: 'Karen Shopping Mall',
          PROPERTY_TYPE: 'RETAIL',
          STATUS: 'ACTIVE',
          CITY: 'Nairobi',
          ADDRESS: 'Karen Road, Nairobi',
          TOTAL_AREA: 35000,
          TOTAL_UNITS: 45,
          PURCHASE_DATE: '2021-03-10',
          PURCHASE_PRICE: 320000000
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProperty(null);
    setShowForm(true);
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setShowForm(true);
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/properties/${propertyId}`);
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedProperty) {
        await axios.put(`${API_BASE_URL}/properties/${selectedProperty.PROPERTY_ID}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/properties`, formData);
      }
      setShowForm(false);
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      city: '',
      searchQuery: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(properties.length / itemsPerPage);

  const handleExport = async (format) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/properties/export?format=${format}`, { responseType: format === 'csv' ? 'blob' : 'json' });
      if (format === 'csv') {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a'); a.href = url; a.download = 'properties.csv'; a.click(); URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data.data || res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'properties.json'; a.click(); URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed:', e); alert('Export failed');
    }
  };

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const handleImport = async () => {
    try {
      setImporting(true);
      let data = [];
      try { data = JSON.parse(importText); } catch { data = importText.trim() ? [{ property_name: importText.trim(), property_type: 'COMMERCIAL', address: '', city: '', state: '', country: 'Kenya', zip_code: '' }] : []; }
      if (!Array.isArray(data)) data = [data];
      if (data.length === 0) { setShowImport(false); return; }
      await axios.post(`${API_BASE_URL}/properties/import`, data);
      setImportText(''); setShowImport(false); fetchProperties();
    } catch (e) {
      alert(e.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rw-all-records-content">
      {/* Page Header with Actions */}
      <div className="rw-section-header" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
        <h2>All Properties</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => handleExport('csv')}>Export CSV</button>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => handleExport('json')}>Export JSON</button>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => setShowImport(true)}>Import</button>
          <button className="rw-button rw-button-primary" onClick={handleCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {showImport && (
        <div className="rw-card" style={{ marginBottom: '24px' }}>
          <div className="rw-card-header"><h3>Import properties (JSON array)</h3></div>
          <div className="rw-card-body">
            <textarea className="rw-input" rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"property_name":"...","property_type":"COMMERCIAL","address":"...","city":"...","state":"...","country":"Kenya","zip_code":"..."}]' style={{ width: '100%' }} />
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button type="button" className="rw-button rw-button-primary" onClick={handleImport} disabled={importing}>{importing ? 'Importing...' : 'Import'}</button>
              <button type="button" className="rw-button rw-button-secondary" onClick={() => setShowImport(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="rw-filters-section">
        <div className="rw-filters-grid">
          <div className="rw-filter-group">
            <label>Search</label>
            <input
              type="text"
              className="rw-input"
              placeholder="Search by name, code..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </div>

          <div className="rw-filter-group">
            <label>Status</label>
            <select
              className="rw-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          <div className="rw-filter-group">
            <label>Property Type</label>
            <select
              className="rw-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="RETAIL">Retail</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="MIXED_USE">Mixed Use</option>
            </select>
          </div>

          <div className="rw-filter-group">
            <label>City</label>
            <select
              className="rw-select"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            >
              <option value="">All Cities</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
            </select>
          </div>

          <div className="rw-filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="rw-button rw-button-secondary" onClick={clearFilters}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      {loading ? (
        <div className="rw-loading">
          <div className="rw-spinner"></div>
          <p>Loading properties...</p>
        </div>
      ) : error ? (
        <div className="rw-error">
          <p>{error}</p>
          <button className="rw-button rw-button-secondary" onClick={fetchProperties}>Retry</button>
        </div>
      ) : (
        <>
          <div className="rw-table-container">
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Property Name</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>Area (sq ft)</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.PROPERTY_ID}>
                    <td><span className="rw-code">{property.PROPERTY_CODE}</span></td>
                    <td><strong>{property.PROPERTY_NAME}</strong></td>
                    <td><span className="rw-badge rw-badge-neutral">{property.PROPERTY_TYPE}</span></td>
                    <td>{property.CITY}</td>
                    <td>{property.ADDRESS}</td>
                    <td>{property.TOTAL_AREA?.toLocaleString()}</td>
                    <td>{property.TOTAL_UNITS}</td>
                    <td>
                      <span className={`rw-status rw-status-${property.STATUS?.toLowerCase()}`}>
                        {property.STATUS}
                      </span>
                    </td>
                    <td>
                      <div className="rw-table-actions">
                        <button
                          className="rw-icon-button"
                          onClick={() => handleEdit(property)}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="rw-icon-button rw-icon-button-danger"
                          onClick={() => handleDelete(property.PROPERTY_ID)}
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rw-pagination">
              <button
                className="rw-button rw-button-secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="rw-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="rw-button rw-button-secondary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Property Form Modal */}
      {showForm && (
        <PropertyForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          property={selectedProperty}
          onSuccess={() => {
            setShowForm(false);
            fetchProperties();
          }}
        />
      )}
    </div>
  );
}

export default AllProperties;

