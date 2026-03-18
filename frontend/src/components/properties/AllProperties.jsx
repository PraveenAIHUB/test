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

  const getPropertyTypeIcon = (type) => {
    const icons = {
      'COMMERCIAL': '🏢',
      'RESIDENTIAL': '🏠',
      'INDUSTRIAL': '🏭',
      'RETAIL': '🛍️',
      'MIXED_USE': '🏗️'
    };
    return icons[type] || '🏢';
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
      <div className="properties-hero">
        <div className="properties-hero-content">
          <div className="properties-hero-top">
            <div className="properties-hero-title">
              <div className="properties-hero-icon">🏢</div>
              <div className="properties-hero-text">
                <h1>Property Portfolio</h1>
                <p>Manage and monitor all your properties in one place</p>
              </div>
            </div>
            <button className="properties-add-btn" onClick={handleCreate}>
              <span className="btn-icon">+</span>
              Add New Property
            </button>
          </div>

          <div className="properties-stats">
            <div className="property-stat-card">
              <div className="property-stat-icon">🏘️</div>
              <div className="property-stat-content">
                <div className="property-stat-value">{stats.total}</div>
                <div className="property-stat-label">Total Properties</div>
              </div>
            </div>
            <div className="property-stat-card">
              <div className="property-stat-icon">✅</div>
              <div className="property-stat-content">
                <div className="property-stat-value">{stats.active}</div>
                <div className="property-stat-label">Active</div>
              </div>
            </div>
            <div className="property-stat-card">
              <div className="property-stat-icon">📐</div>
              <div className="property-stat-content">
                <div className="property-stat-value">{formatArea(stats.totalArea)}</div>
                <div className="property-stat-label">Total Area</div>
              </div>
            </div>
            <div className="property-stat-card">
              <div className="property-stat-icon">🔢</div>
              <div className="property-stat-content">
                <div className="property-stat-value">{stats.totalUnits}</div>
                <div className="property-stat-label">Total Units</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="properties-content">
        <div className="properties-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label>
                <span className="label-icon">🔍</span>
                Search Properties
              </label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by name, code, or address..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>
                <span className="label-icon">🏷️</span>
                Status
              </label>
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
            </div>

            <div className="filter-group">
              <label>
                <span className="label-icon">🏢</span>
                Type
              </label>
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
            </div>

            <div className="filter-group">
              <label>
                <span className="label-icon">📍</span>
                City
              </label>
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
          </div>
        </div>

        {loading ? (
          <div className="properties-loading">
            <div className="properties-spinner"></div>
            <div className="properties-loading-text">Loading properties...</div>
          </div>
        ) : properties.length === 0 ? (
          <div className="properties-empty">
            <div className="properties-empty-icon">🏢</div>
            <h3>No Properties Found</h3>
            <p>Start by adding your first property to the portfolio</p>
            <button className="properties-add-btn" onClick={handleCreate}>
              <span className="btn-icon">+</span>
              Add First Property
            </button>
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map((property) => (
              <div key={property.PROPERTY_ID} className="property-card">
                <div className="property-card-header">
                  <div className="property-card-top">
                    <div className="property-type-badge">
                      <span>{getPropertyTypeIcon(property.PROPERTY_TYPE)}</span>
                      {property.PROPERTY_TYPE?.replace('_', ' ')}
                    </div>
                    <div className={`property-status-badge ${getStatusClass(property.STATUS)}`}>
                      {property.STATUS?.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="property-card-title">
                    <h3>{property.PROPERTY_NAME || property.property_name}</h3>
                    <div className="property-card-code">
                      {property.PROPERTY_CODE || property.property_code || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="property-card-body">
                  <div className="property-info-grid">
                    <div className="property-info-item">
                      <div className="property-info-label">Total Area</div>
                      <div className="property-info-value">
                        <span className="property-info-icon">📐</span>
                        {formatArea(property.TOTAL_AREA || property.total_area)}
                      </div>
                    </div>
                    <div className="property-info-item">
                      <div className="property-info-label">Units</div>
                      <div className="property-info-value">
                        <span className="property-info-icon">🔢</span>
                        {property.NUMBER_OF_UNITS || property.number_of_units || 'N/A'}
                      </div>
                    </div>
                    <div className="property-info-item">
                      <div className="property-info-label">Floors</div>
                      <div className="property-info-value">
                        <span className="property-info-icon">🏗️</span>
                        {property.TOTAL_FLOORS || property.total_floors || 'N/A'}
                      </div>
                    </div>
                    <div className="property-info-item">
                      <div className="property-info-label">Year Built</div>
                      <div className="property-info-value">
                        <span className="property-info-icon">📅</span>
                        {property.YEAR_BUILT || property.year_built || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="property-location">
                    <div className="property-location-icon">📍</div>
                    <div className="property-location-text">
                      {property.ADDRESS || property.address}, {property.CITY || property.city}
                      {property.STATE || property.state ? `, ${property.STATE || property.state}` : ''}
                    </div>
                  </div>
                </div>

                <div className="property-card-footer">
                  <button
                    className="property-action-btn property-action-view"
                    onClick={() => window.location.href = `/properties/${property.PROPERTY_ID}`}
                  >
                    <span>👁️</span>
                    View Details
                  </button>
                  <button
                    className="property-action-btn property-action-edit"
                    onClick={() => handleEdit(property)}
                  >
                    <span>✏️</span>
                    Edit
                  </button>
                  <button
                    className="property-action-btn property-action-delete"
                    onClick={() => handleDelete(property.PROPERTY_ID)}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
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
