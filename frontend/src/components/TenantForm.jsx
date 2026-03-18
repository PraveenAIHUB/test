/**
 * Tenant Form Component
 * Create/Edit Tenant
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

function TenantForm({ isOpen, onClose, tenant, onSuccess }) {
  const [formData, setFormData] = useState({
    tenant_code: '',
    tenant_name: '',
    tenant_type: 'CORPORATE',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenant) {
      setFormData({
        tenant_code: tenant.TENANT_CODE || tenant.tenant_code || '',
        tenant_name: tenant.TENANT_NAME || tenant.tenant_name || '',
        tenant_type: tenant.TENANT_TYPE || tenant.tenant_type || 'CORPORATE',
        contact_person: tenant.CONTACT_PERSON || tenant.contact_person || '',
        email: tenant.EMAIL || tenant.email || tenant.contact_email || '',
        phone: tenant.PHONE || tenant.phone || tenant.contact_phone || '',
        address: tenant.ADDRESS || tenant.address || '',
        city: tenant.CITY || tenant.city || '',
        state: tenant.STATE || tenant.state || '',
        zip_code: tenant.ZIP_CODE || tenant.zip_code || '',
        country: tenant.COUNTRY || tenant.country || 'USA',
        status: tenant.STATUS || tenant.status || 'ACTIVE'
      });
    } else {
      setFormData({
        tenant_code: '',
        tenant_name: '',
        tenant_type: 'CORPORATE',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        status: 'ACTIVE'
      });
    }
  }, [tenant, isOpen]);

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
      const payload = {
        tenant_code: formData.tenant_code || undefined,
        tenant_name: formData.tenant_name,
        tenant_type: formData.tenant_type,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        status: formData.status
      };
      if (tenant) {
        const tenantId = tenant.TENANT_ID || tenant.tenant_id;
        await axios.put(`/api/tenants/${tenantId}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await axios.post('/api/tenants', payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save tenant';
      console.error('Error saving tenant:', err.response?.data || err.message);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tenant ? 'Edit Tenant' : 'Create New Tenant'}
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
            <label htmlFor="tenant_code" className="rw-label">Tenant Code</label>
            <input
              type="text"
              id="tenant_code"
              name="tenant_code"
              className="rw-input"
              value={formData.tenant_code}
              onChange={handleChange}
              placeholder="Auto-generated if left blank"
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="tenant_name" className="rw-label">Tenant Name *</label>
            <input
              type="text"
              id="tenant_name"
              name="tenant_name"
              className="rw-input"
              value={formData.tenant_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="tenant_type" className="rw-label">Tenant Type *</label>
            <select
              id="tenant_type"
              name="tenant_type"
              className="rw-input"
              value={formData.tenant_type}
              onChange={handleChange}
              required
            >
              <option value="CORPORATE">Corporate</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GOVERNMENT">Government</option>
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="contact_person" className="rw-label">Contact Person *</label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              className="rw-input"
              value={formData.contact_person}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="email" className="rw-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="rw-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="rw-form-group">
          <label htmlFor="phone" className="rw-label">Phone *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="rw-input"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="rw-form-group">
          <label htmlFor="address" className="rw-label">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            className="rw-input"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="city" className="rw-label">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              className="rw-input"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="state" className="rw-label">State *</label>
            <input
              type="text"
              id="state"
              name="state"
              className="rw-input"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="zip_code" className="rw-label">ZIP Code *</label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              className="rw-input"
              value={formData.zip_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="country" className="rw-label">Country *</label>
            <input
              type="text"
              id="country"
              name="country"
              className="rw-input"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
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
            {loading ? 'Saving...' : (tenant ? 'Update Tenant' : 'Create Tenant')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TenantForm;
