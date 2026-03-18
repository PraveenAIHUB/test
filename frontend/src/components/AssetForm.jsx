/**
 * Asset Form Component
 * Create/Edit Asset
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

function AssetForm({ isOpen, onClose, asset, onSuccess }) {
  const [formData, setFormData] = useState({
    property_id: '',
    asset_name: '',
    asset_category: 'HVAC',
    asset_type: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    status: 'OPERATIONAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen]);

  useEffect(() => {
    if (asset) {
      setFormData({
        property_id: asset.PROPERTY_ID || asset.property_id || '',
        asset_name: asset.ASSET_NAME || asset.asset_name || '',
        asset_category: asset.ASSET_CATEGORY || asset.asset_category || 'HVAC',
        asset_type: asset.ASSET_TYPE || asset.asset_type || '',
        manufacturer: asset.MANUFACTURER || asset.manufacturer || '',
        model_number: asset.MODEL_NUMBER || asset.model_number || '',
        serial_number: asset.SERIAL_NUMBER || asset.serial_number || '',
        purchase_date: asset.PURCHASE_DATE || asset.purchase_date || '',
        purchase_cost: asset.PURCHASE_COST || asset.purchase_cost || '',
        warranty_expiry: asset.WARRANTY_EXPIRY || asset.warranty_expiry || '',
        status: asset.STATUS || asset.status || 'OPERATIONAL'
      });
    } else {
      setFormData({
        property_id: '',
        asset_name: '',
        asset_category: 'HVAC',
        asset_type: '',
        manufacturer: '',
        model_number: '',
        serial_number: '',
        purchase_date: '',
        purchase_cost: '',
        warranty_expiry: '',
        status: 'OPERATIONAL'
      });
    }
  }, [asset, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (asset) {
        const assetId = asset.ASSET_ID || asset.asset_id;
        await axios.put(`/api/assets/${assetId}`, formData);
      } else {
        await axios.post('/api/assets', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={asset ? 'Edit Asset' : 'Create New Asset'}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="property_id" className="rw-label">Property *</label>
            <select
              id="property_id"
              name="property_id"
              className="rw-input"
              value={formData.property_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop.PROPERTY_ID} value={prop.PROPERTY_ID}>
                  {prop.PROPERTY_NAME} ({prop.PROPERTY_CODE})
                </option>
              ))}
            </select>
          </div>

          <div className="rw-form-group">
            <label htmlFor="asset_name" className="rw-label">Asset Name *</label>
            <input
              type="text"
              id="asset_name"
              name="asset_name"
              className="rw-input"
              value={formData.asset_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="asset_category" className="rw-label">Category *</label>
            <select
              id="asset_category"
              name="asset_category"
              className="rw-input"
              value={formData.asset_category}
              onChange={handleChange}
              required
            >
              <option value="HVAC">HVAC</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELEVATOR">Elevator</option>
              <option value="SECURITY">Security</option>
              <option value="FIRE_SAFETY">Fire Safety</option>
            </select>
          </div>

          <div className="rw-form-group">
            <label htmlFor="asset_type" className="rw-label">Asset Type</label>
            <input
              type="text"
              id="asset_type"
              name="asset_type"
              className="rw-input"
              value={formData.asset_type}
              onChange={handleChange}
              placeholder="e.g., Chiller, Boiler, Pump"
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="manufacturer" className="rw-label">Manufacturer</label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              className="rw-input"
              value={formData.manufacturer}
              onChange={handleChange}
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="model_number" className="rw-label">Model Number</label>
            <input
              type="text"
              id="model_number"
              name="model_number"
              className="rw-input"
              value={formData.model_number}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="rw-form-group">
          <label htmlFor="serial_number" className="rw-label">Serial Number</label>
          <input
            type="text"
            id="serial_number"
            name="serial_number"
            className="rw-input"
            value={formData.serial_number}
            onChange={handleChange}
          />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="purchase_date" className="rw-label">Purchase Date</label>
            <input
              type="date"
              id="purchase_date"
              name="purchase_date"
              className="rw-input"
              value={formData.purchase_date}
              onChange={handleChange}
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="purchase_cost" className="rw-label">Purchase Cost ($)</label>
            <input
              type="number"
              id="purchase_cost"
              name="purchase_cost"
              className="rw-input"
              value={formData.purchase_cost}
              onChange={handleChange}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="warranty_expiry" className="rw-label">Warranty Expiry</label>
            <input
              type="date"
              id="warranty_expiry"
              name="warranty_expiry"
              className="rw-input"
              value={formData.warranty_expiry}
              onChange={handleChange}
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="status" className="rw-label">Status *</label>
            <select
              id="status"
              name="status"
              className="rw-input"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="OPERATIONAL">Operational</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
              <option value="BROKEN">Broken</option>
            </select>
          </div>
        </div>

        <div className="rw-form-actions">
          <button
            type="button"
            className="rw-btn rw-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rw-btn rw-btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (asset ? 'Update Asset' : 'Create Asset')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AssetForm;
