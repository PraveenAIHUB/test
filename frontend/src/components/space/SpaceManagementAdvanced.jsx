import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import './SpaceManagementAdvanced.css';

function SpaceManagementAdvanced() {
  const [spaces, setSpaces] = useState([]);
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);

  const [newSpace, setNewSpace] = useState({
    space_name: '',
    space_type: 'OFFICE',
    floor_id: '',
    property_id: '',
    area: '',
    capacity: '',
    status: 'VACANT',
    hourly_rate: '',
    daily_rate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchFloors(selectedProperty);
    }
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [spacesRes, propsRes] = await Promise.all([
        axios.get(`${API_URL}/space`),
        axios.get(`${API_URL}/properties`)
      ]);
      setSpaces(spacesRes.data.data || []);
      setProperties(propsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (propertyId) => {
    try {
      const res = await axios.get(`${API_URL}/floors?property_id=${propertyId}`);
      setFloors(res.data.data || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setFloors([]);
    }
  };

  const handleAddSpace = async () => {
    try {
      await axios.post(`${API_URL}/space`, newSpace);
      setShowAddModal(false);
      setNewSpace({
        space_name: '',
        space_type: 'OFFICE',
        floor_id: '',
        property_id: '',
        area: '',
        capacity: '',
        status: 'VACANT',
        hourly_rate: '',
        daily_rate: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding space:', error);
      alert('Failed to add space');
    }
  };

  const handleDeleteSpace = async (spaceId) => {
    if (!window.confirm('Are you sure you want to delete this space?')) return;
    try {
      await axios.delete(`${API_URL}/space/${spaceId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Failed to delete space');
    }
  };

  const filteredSpaces = spaces.filter(space => {
    if (selectedProperty && space.PROPERTY_ID != selectedProperty) return false;
    if (selectedFloor && space.FLOOR_ID != selectedFloor) return false;
    if (filterStatus && space.STATUS !== filterStatus) return false;
    if (filterType && space.SPACE_TYPE !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        space.SPACE_NAME?.toLowerCase().includes(query) ||
        space.SPACE_CODE?.toLowerCase().includes(query) ||
        space.SPACE_TYPE?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: filteredSpaces.length,
    occupied: filteredSpaces.filter(s => s.STATUS === 'OCCUPIED').length,
    vacant: filteredSpaces.filter(s => s.STATUS === 'VACANT').length,
    reserved: filteredSpaces.filter(s => s.STATUS === 'RESERVED').length,
    totalArea: filteredSpaces.reduce((sum, s) => sum + (parseFloat(s.AREA) || 0), 0),
    avgCapacity: filteredSpaces.length > 0 ? Math.round(filteredSpaces.reduce((sum, s) => sum + (parseInt(s.CAPACITY) || 0), 0) / filteredSpaces.length) : 0
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OCCUPIED': return '#EF4444';
      case 'VACANT': return '#10B981';
      case 'RESERVED': return '#F59E0B';
      case 'MAINTENANCE': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'OFFICE': return '🏢';
      case 'MEETING_ROOM': return '🤝';
      case 'CONFERENCE_ROOM': return '👥';
      case 'DESK': return '💼';
      case 'CUBICLE': return '📦';
      case 'PARKING': return '🚗';
      case 'STORAGE': return '📁';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="space-mgmt-loading">
        <div className="space-mgmt-spinner"></div>
        <p>Loading spaces...</p>
      </div>
    );
  }

  return (
    <div className="space-mgmt-container">
      <div className="space-mgmt-header">
        <div className="space-mgmt-header-left">
          <h1>Space Management</h1>
          <p>Manage and organize all your property spaces</p>
        </div>
        <button className="space-mgmt-add-btn" onClick={() => setShowAddModal(true)}>
          <span>+</span> Add New Space
        </button>
      </div>

      <div className="space-mgmt-stats">
        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>📊</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.total}</div>
            <div className="space-stat-label">Total Spaces</div>
          </div>
        </div>

        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>🔴</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.occupied}</div>
            <div className="space-stat-label">Occupied</div>
          </div>
        </div>

        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>🟢</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.vacant}</div>
            <div className="space-stat-label">Vacant</div>
          </div>
        </div>

        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>🟡</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.reserved}</div>
            <div className="space-stat-label">Reserved</div>
          </div>
        </div>

        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' }}>📐</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.totalArea.toLocaleString()}</div>
            <div className="space-stat-label">Total Area (sq m)</div>
          </div>
        </div>

        <div className="space-stat-card">
          <div className="space-stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>👤</div>
          <div className="space-stat-content">
            <div className="space-stat-value">{stats.avgCapacity}</div>
            <div className="space-stat-label">Avg Capacity</div>
          </div>
        </div>
      </div>

      <div className="space-mgmt-filters">
        <div className="space-mgmt-search">
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="space-search-input"
          />
        </div>

        <select className="space-filter-select" value={selectedProperty} onChange={(e) => { setSelectedProperty(e.target.value); setSelectedFloor(''); }}>
          <option value="">All Properties</option>
          {properties.map(p => (
            <option key={p.PROPERTY_ID} value={p.PROPERTY_ID}>{p.PROPERTY_NAME}</option>
          ))}
        </select>

        <select className="space-filter-select" value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)} disabled={!selectedProperty}>
          <option value="">All Floors</option>
          {floors.map(f => (
            <option key={f.FLOOR_ID} value={f.FLOOR_ID}>{f.FLOOR_NAME}</option>
          ))}
        </select>

        <select className="space-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="VACANT">Vacant</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        <select className="space-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="OFFICE">Office</option>
          <option value="MEETING_ROOM">Meeting Room</option>
          <option value="CONFERENCE_ROOM">Conference Room</option>
          <option value="DESK">Desk</option>
          <option value="CUBICLE">Cubicle</option>
          <option value="PARKING">Parking</option>
          <option value="STORAGE">Storage</option>
        </select>

        <div className="space-view-toggle">
          <button className={`space-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <span>⊞</span>
          </button>
          <button className={`space-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <span>☰</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="space-grid">
          {filteredSpaces.map(space => (
            <div key={space.SPACE_ID} className="space-card" style={{ borderTop: `4px solid ${getStatusColor(space.STATUS)}` }}>
              <div className="space-card-header">
                <div className="space-card-icon">{getTypeIcon(space.SPACE_TYPE)}</div>
                <div className="space-card-status" style={{ background: getStatusColor(space.STATUS) }}>
                  {space.STATUS}
                </div>
              </div>

              <div className="space-card-body">
                <h3>{space.SPACE_NAME}</h3>
                <p className="space-card-code">{space.SPACE_CODE}</p>
                <div className="space-card-type">{space.SPACE_TYPE?.replace('_', ' ')}</div>

                <div className="space-card-details">
                  <div className="space-card-detail">
                    <span className="space-detail-icon">📐</span>
                    <span>{space.AREA} sq m</span>
                  </div>
                  <div className="space-card-detail">
                    <span className="space-detail-icon">👥</span>
                    <span>{space.CAPACITY} people</span>
                  </div>
                </div>

                {space.HOURLY_RATE && (
                  <div className="space-card-rate">
                    <strong>KES {parseFloat(space.HOURLY_RATE).toLocaleString()}</strong> / hour
                  </div>
                )}
              </div>

              <div className="space-card-actions">
                <button className="space-action-btn space-action-edit" onClick={() => setSelectedSpace(space)}>
                  Edit
                </button>
                <button className="space-action-btn space-action-delete" onClick={() => handleDeleteSpace(space.SPACE_ID)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-list">
          <table className="space-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Area</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.map(space => (
                <tr key={space.SPACE_ID}>
                  <td>
                    <div className="space-list-name">
                      <span className="space-list-icon">{getTypeIcon(space.SPACE_TYPE)}</span>
                      <div>
                        <strong>{space.SPACE_NAME}</strong>
                        <div className="space-list-code">{space.SPACE_CODE}</div>
                      </div>
                    </div>
                  </td>
                  <td>{space.SPACE_TYPE?.replace('_', ' ')}</td>
                  <td>{space.FLOOR_NAME || 'N/A'}</td>
                  <td>{space.AREA} sq m</td>
                  <td>{space.CAPACITY}</td>
                  <td>
                    <span className="space-list-status" style={{ background: getStatusColor(space.STATUS), color: 'white' }}>
                      {space.STATUS}
                    </span>
                  </td>
                  <td>KES {parseFloat(space.HOURLY_RATE || 0).toLocaleString()}/hr</td>
                  <td>
                    <div className="space-list-actions">
                      <button className="space-list-action-btn" onClick={() => setSelectedSpace(space)}>✏️</button>
                      <button className="space-list-action-btn" onClick={() => handleDeleteSpace(space.SPACE_ID)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="space-modal-overlay" onClick={(e) => e.target.className === 'space-modal-overlay' && setShowAddModal(false)}>
          <div className="space-modal">
            <div className="space-modal-header">
              <h2>Add New Space</h2>
              <button className="space-modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <div className="space-modal-body">
              <div className="space-modal-grid">
                <div className="space-modal-field">
                  <label>Space Name *</label>
                  <input
                    type="text"
                    value={newSpace.space_name}
                    onChange={(e) => setNewSpace({ ...newSpace, space_name: e.target.value })}
                    placeholder="e.g. Conference Room A"
                  />
                </div>

                <div className="space-modal-field">
                  <label>Space Type *</label>
                  <select value={newSpace.space_type} onChange={(e) => setNewSpace({ ...newSpace, space_type: e.target.value })}>
                    <option value="OFFICE">Office</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="CONFERENCE_ROOM">Conference Room</option>
                    <option value="DESK">Desk</option>
                    <option value="CUBICLE">Cubicle</option>
                    <option value="PARKING">Parking</option>
                    <option value="STORAGE">Storage</option>
                  </select>
                </div>

                <div className="space-modal-field">
                  <label>Property *</label>
                  <select value={newSpace.property_id} onChange={(e) => { setNewSpace({ ...newSpace, property_id: e.target.value }); fetchFloors(e.target.value); }}>
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.PROPERTY_ID} value={p.PROPERTY_ID}>{p.PROPERTY_NAME}</option>
                    ))}
                  </select>
                </div>

                <div className="space-modal-field">
                  <label>Floor</label>
                  <select value={newSpace.floor_id} onChange={(e) => setNewSpace({ ...newSpace, floor_id: e.target.value })} disabled={!newSpace.property_id}>
                    <option value="">Select Floor</option>
                    {floors.map(f => (
                      <option key={f.FLOOR_ID} value={f.FLOOR_ID}>{f.FLOOR_NAME}</option>
                    ))}
                  </select>
                </div>

                <div className="space-modal-field">
                  <label>Area (sq m) *</label>
                  <input
                    type="number"
                    value={newSpace.area}
                    onChange={(e) => setNewSpace({ ...newSpace, area: e.target.value })}
                    placeholder="e.g. 150"
                  />
                </div>

                <div className="space-modal-field">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    value={newSpace.capacity}
                    onChange={(e) => setNewSpace({ ...newSpace, capacity: e.target.value })}
                    placeholder="e.g. 20"
                  />
                </div>

                <div className="space-modal-field">
                  <label>Status</label>
                  <select value={newSpace.status} onChange={(e) => setNewSpace({ ...newSpace, status: e.target.value })}>
                    <option value="VACANT">Vacant</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div className="space-modal-field">
                  <label>Hourly Rate (KES)</label>
                  <input
                    type="number"
                    value={newSpace.hourly_rate}
                    onChange={(e) => setNewSpace({ ...newSpace, hourly_rate: e.target.value })}
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>
            </div>

            <div className="space-modal-footer">
              <button className="space-modal-btn space-modal-btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="space-modal-btn space-modal-btn-primary" onClick={handleAddSpace}>
                Add Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceManagementAdvanced;
