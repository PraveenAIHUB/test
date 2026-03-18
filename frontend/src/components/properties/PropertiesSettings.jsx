import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/redwood-authentic.css';

import { API_URL } from '../../config/api';
const API_BASE_URL = API_URL;

function PropertiesSettings() {
  const [settings, setSettings] = useState({
    propertyTypes: ['RESIDENTIAL', 'COMMERCIAL', 'RETAIL', 'INDUSTRIAL', 'MIXED_USE'],
    statusOptions: ['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'SOLD'],
    defaultCurrency: 'KES',
    autoCalculateOccupancy: true,
    enableNotifications: true,
    notificationEmail: 'admin@propertypro.ke'
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/properties/settings`);
      setSettings(response.data.data || settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/properties/settings`, settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPropertyType = () => {
    if (newPropertyType && !settings.propertyTypes.includes(newPropertyType.toUpperCase())) {
      setSettings(prev => ({
        ...prev,
        propertyTypes: [...prev.propertyTypes, newPropertyType.toUpperCase()]
      }));
      setNewPropertyType('');
    }
  };

  const handleRemovePropertyType = (type) => {
    setSettings(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.filter(t => t !== type)
    }));
  };

  const handleAddStatus = () => {
    if (newStatus && !settings.statusOptions.includes(newStatus.toUpperCase())) {
      setSettings(prev => ({
        ...prev,
        statusOptions: [...prev.statusOptions, newStatus.toUpperCase()]
      }));
      setNewStatus('');
    }
  };

  const handleRemoveStatus = (status) => {
    setSettings(prev => ({
      ...prev,
      statusOptions: prev.statusOptions.filter(s => s !== status)
    }));
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rw-settings-content">
      <div className="rw-section-header" style={{ marginBottom: '24px' }}>
        <h2>Properties Module Settings</h2>
        <button
          className="rw-button rw-button-primary"
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveMessage && (
        <div className={`rw-alert ${saveMessage.includes('success') ? 'rw-alert-success' : 'rw-alert-error'}`}>
          {saveMessage}
        </div>
      )}

      {/* Property Types Management */}
      <div className="rw-settings-section">
        <h3 className="rw-section-title">Property Types</h3>
        <p className="rw-section-description">Manage available property types for classification</p>
        
        <div className="rw-tags-container">
          {settings.propertyTypes.map((type) => (
            <div key={type} className="rw-tag">
              <span>{type}</span>
              <button
                className="rw-tag-remove"
                onClick={() => handleRemovePropertyType(type)}
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="rw-input-group" style={{ marginTop: '16px' }}>
          <input
            type="text"
            className="rw-input"
            placeholder="Add new property type..."
            value={newPropertyType}
            onChange={(e) => setNewPropertyType(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPropertyType()}
          />
          <button className="rw-button rw-button-secondary" onClick={handleAddPropertyType}>
            Add Type
          </button>
        </div>
      </div>

      {/* Status Options Management */}
      <div className="rw-settings-section">
        <h3 className="rw-section-title">Status Options</h3>
        <p className="rw-section-description">Manage available status options for properties</p>
        
        <div className="rw-tags-container">
          {settings.statusOptions.map((status) => (
            <div key={status} className="rw-tag">
              <span>{status}</span>
              <button
                className="rw-tag-remove"
                onClick={() => handleRemoveStatus(status)}
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="rw-input-group" style={{ marginTop: '16px' }}>
          <input
            type="text"
            className="rw-input"
            placeholder="Add new status..."
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddStatus()}
          />
          <button className="rw-button rw-button-secondary" onClick={handleAddStatus}>
            Add Status
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="rw-settings-section">
        <h3 className="rw-section-title">General Settings</h3>
        <p className="rw-section-description">Configure general properties module preferences</p>

        <div className="rw-form-grid">
          <div className="rw-form-group">
            <label className="rw-label">Default Currency</label>
            <select
              className="rw-select"
              value={settings.defaultCurrency}
              onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div className="rw-form-group">
            <label className="rw-label">Notification Email</label>
            <input
              type="email"
              className="rw-input"
              value={settings.notificationEmail}
              onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
              placeholder="admin@propertypro.ke"
            />
          </div>
        </div>

        <div className="rw-form-group" style={{ marginTop: '16px' }}>
          <label className="rw-checkbox-label">
            <input
              type="checkbox"
              className="rw-checkbox"
              checked={settings.autoCalculateOccupancy}
              onChange={(e) => handleSettingChange('autoCalculateOccupancy', e.target.checked)}
            />
            <span>Auto-calculate occupancy rates</span>
          </label>
          <p className="rw-help-text">Automatically calculate and update occupancy rates based on lease data</p>
        </div>

        <div className="rw-form-group">
          <label className="rw-checkbox-label">
            <input
              type="checkbox"
              className="rw-checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
            />
            <span>Enable email notifications</span>
          </label>
          <p className="rw-help-text">Receive email notifications for important property events and updates</p>
        </div>
      </div>

      {/* Data Management */}
      <div className="rw-settings-section">
        <h3 className="rw-section-title">Data Management</h3>
        <p className="rw-section-description">Manage property data and system preferences</p>

        <div className="rw-action-cards">
          <div className="rw-action-card">
            <div className="rw-action-card-icon" style={{ backgroundColor: '#D4E9F0' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2C5F6F" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div className="rw-action-card-content">
              <h4>Export All Properties</h4>
              <p>Download complete property data in Excel format</p>
              <button className="rw-button rw-button-secondary" style={{ marginTop: '12px' }}>
                Export Data
              </button>
            </div>
          </div>

          <div className="rw-action-card">
            <div className="rw-action-card-icon" style={{ backgroundColor: '#FFE5DC' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="rw-action-card-content">
              <h4>Import Properties</h4>
              <p>Bulk import properties from Excel or CSV file</p>
              <button className="rw-button rw-button-secondary" style={{ marginTop: '12px' }}>
                Import Data
              </button>
            </div>
          </div>

          <div className="rw-action-card">
            <div className="rw-action-card-icon" style={{ backgroundColor: '#E8F5E9' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </div>
            <div className="rw-action-card-content">
              <h4>Sync with Oracle ERP</h4>
              <p>Synchronize property data with Oracle Cloud ERP</p>
              <button className="rw-button rw-button-secondary" style={{ marginTop: '12px' }}>
                Sync Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertiesSettings;

