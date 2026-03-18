/**
 * Vendor Form - Create/Edit Vendor
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { API_URL } from '../config/api';

function VendorForm({ isOpen, onClose, vendor, onSuccess }) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: 'SERVICE',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    status: 'ACTIVE',
    rating: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name ?? vendor.VENDOR_NAME ?? '',
        vendor_type: vendor.vendor_type ?? vendor.VENDOR_TYPE ?? 'SERVICE',
        contact_person: vendor.contact_person ?? vendor.CONTACT_PERSON ?? '',
        contact_email: vendor.contact_email ?? vendor.CONTACT_EMAIL ?? '',
        contact_phone: vendor.contact_phone ?? vendor.CONTACT_PHONE ?? '',
        address: vendor.address ?? vendor.ADDRESS ?? '',
        status: vendor.status ?? vendor.STATUS ?? 'ACTIVE',
        rating: vendor.rating != null ? String(vendor.rating) : (vendor.RATING != null ? String(vendor.RATING) : '')
      });
    } else {
      setFormData({
        vendor_name: '',
        vendor_type: 'SERVICE',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        status: 'ACTIVE',
        rating: ''
      });
    }
  }, [vendor, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        vendor_name: formData.vendor_name.trim(),
        vendor_type: formData.vendor_type,
        contact_person: formData.contact_person.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status,
        rating: formData.rating !== '' ? Number(formData.rating) : null
      };
      if (vendor) {
        const id = vendor.vendor_id ?? vendor.VENDOR_ID;
        await axios.put(`${API_URL}/vendors/${id}`, payload);
      } else {
        await axios.post(`${API_URL}/vendors`, payload);
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving vendor:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendor ? 'Edit Vendor' : 'Add Vendor'}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>{error}</div>
        )}

        <div className="rw-form-group">
          <label className="rw-label">Vendor Name *</label>
          <input
            type="text"
            name="vendor_name"
            className="rw-input"
            value={formData.vendor_name}
            onChange={handleChange}
            required
            placeholder="e.g. Acme Maintenance"
          />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Vendor Type</label>
            <select name="vendor_type" className="rw-input" value={formData.vendor_type} onChange={handleChange}>
              <option value="SERVICE">Service</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="UTILITY">Utility</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Status</label>
            <select name="status" className="rw-input" value={formData.status} onChange={handleChange}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Contact Person</label>
            <input
              type="text"
              name="contact_person"
              className="rw-input"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Full name"
            />
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              className="rw-input"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Contact Phone</label>
          <input
            type="text"
            name="contact_phone"
            className="rw-input"
            value={formData.contact_phone}
            onChange={handleChange}
            placeholder="+254..."
          />
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Address</label>
          <textarea
            name="address"
            className="rw-input"
            rows={2}
            value={formData.address}
            onChange={handleChange}
            placeholder="Street, city, country"
          />
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Rating (1-5)</label>
          <input
            type="number"
            name="rating"
            className="rw-input"
            min="1"
            max="5"
            step="0.1"
            value={formData.rating}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="rw-form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="rw-button rw-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rw-button rw-button-primary" disabled={loading}>
            {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default VendorForm;
