import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyForm from '../PropertyForm';
import AddPropertyWizard from './AddPropertyWizard';
import '../../styles/properties-enhanced.css';

import { API_URL } from '../../config/api';
const API_BASE_URL = API_URL;

function AllProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    city: '',
    searchQuery: ''
  });

  const [currentPage] = useState(1);
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
      setProperties([]);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusClass = (status) => {
    const classes = {
      'ACTIVE': 'status-active',
      'INACTIVE': 'status-inactive',
      'UNDER_CONSTRUCTION': 'status-under-construction'
    };
    return classes[status] || 'status-active';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatArea = (area) => {
    if (!area) return 'N/A';
    return new Intl.NumberFormat('en-US').format(area) + ' m²';
  };

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.STATUS === 'ACTIVE').length,
    totalArea: properties.reduce((sum, p) => sum + (p.TOTAL_AREA || 0), 0),
    totalUnits: properties.reduce((sum, p) => sum + (p.NUMBER_OF_UNITS || 0), 0)
  };

  return (
    <div className="properties-container">
      <div className="properties-header">
        <div className="properties-header-content">
          <div className="properties-title-row">
            <h1 className="properties-title">Properties</h1>
            <button className="btn-primary" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Property
            </button>
          </div>

          <div className="properties-stats">
            <div className="stat-card">
              <div className="stat-label">Total Properties</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active</div>
              <div className="stat-value stat-value-success">{stats.active}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Area</div>
              <div className="stat-value">{formatArea(stats.totalArea)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Units</div>
              <div className="stat-value">{stats.totalUnits}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="properties-content">
        <div className="properties-filters">
          <input
            type="text"
            className="filter-search"
            placeholder="Search properties..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_CONSTRUCTION">Under Construction</option>
          </select>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="RETAIL">Retail</option>
            <option value="MIXED_USE">Mixed Use</option>
          </select>
          <select
            className="filter-select"
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

        {loading ? (
          <div className="properties-loading">
            <div className="spinner"></div>
            <span>Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="properties-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <h3>No Properties Found</h3>
            <p>Start by adding your first property</p>
            <button className="btn-primary" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Property
            </button>
          </div>
        ) : (
          <div className="properties-table-wrap">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Property Name</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Units</th>
                  <th>Floors</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.PROPERTY_ID}>
                    <td>
                      <span className="property-code">{property.PROPERTY_CODE || 'N/A'}</span>
                    </td>
                    <td>
                      <strong className="property-name">{property.PROPERTY_NAME}</strong>
                      <div className="property-address">{property.ADDRESS}</div>
                    </td>
                    <td>
                      <span className="badge badge-type">{property.PROPERTY_TYPE?.replace('_', ' ')}</span>
                    </td>
                    <td>{property.CITY}</td>
                    <td>{formatArea(property.TOTAL_AREA)}</td>
                    <td>{property.NUMBER_OF_UNITS || 'N/A'}</td>
                    <td>{property.TOTAL_FLOORS || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${getStatusClass(property.STATUS)}`}>
                        {property.STATUS?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => window.location.href = `/properties/${property.PROPERTY_ID}`}
                          title="View Details"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(property)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(property.PROPERTY_ID)}
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PropertyForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedProperty(null);
          }}
          property={selectedProperty}
          onSuccess={() => {
            setShowForm(false);
            setSelectedProperty(null);
            fetchProperties();
          }}
        />
      )}

      {showWizard && (
        <AddPropertyWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false);
            fetchProperties();
          }}
        />
      )}
    </div>
  );
}

export default AllProperties;
