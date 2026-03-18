/**
 * Lease Form Component
 * Create/Edit Lease
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

function LeaseForm({ isOpen, onClose, lease, onSuccess }) {
  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    lease_type: 'COMMERCIAL',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: '',
    payment_terms: 'MONTHLY',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      fetchTenants();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lease) {
      setFormData({
        property_id: lease.PROPERTY_ID || lease.property_id || '',
        tenant_id: lease.TENANT_ID || lease.tenant_id || '',
        lease_type: lease.LEASE_TYPE || lease.lease_type || 'COMMERCIAL',
        start_date: lease.START_DATE || lease.start_date || '',
        end_date: lease.END_DATE || lease.end_date || '',
        monthly_rent: lease.MONTHLY_RENT || lease.monthly_rent || '',
        security_deposit: lease.SECURITY_DEPOSIT || lease.security_deposit || '',
        payment_terms: lease.PAYMENT_TERMS || lease.payment_terms || 'MONTHLY',
        status: lease.STATUS || lease.status || 'ACTIVE'
      });
    } else {
      setFormData({
        property_id: '',
        tenant_id: '',
        lease_type: 'COMMERCIAL',
        start_date: '',
        end_date: '',
        monthly_rent: '',
        security_deposit: '',
        payment_terms: 'MONTHLY',
        status: 'ACTIVE'
      });
    }
  }, [lease, isOpen]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data.data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/api/tenants');
      setTenants(response.data.data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
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
      if (lease) {
        const leaseId = lease.LEASE_ID || lease.lease_id;
        await axios.put(`/api/leases/${leaseId}`, formData);
      } else {
        await axios.post('/api/leases', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving lease:', err);
      setError(err.response?.data?.error || 'Failed to save lease');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={lease ? 'Edit Lease' : 'Create New Lease'}
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
            <label htmlFor="tenant_id" className="rw-label">Tenant *</label>
            <select
              id="tenant_id"
              name="tenant_id"
              className="rw-input"
              value={formData.tenant_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map(tenant => (
                <option key={tenant.TENANT_ID} value={tenant.TENANT_ID}>
                  {tenant.TENANT_NAME}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="lease_type" className="rw-label">Lease Type *</label>
            <select
              id="lease_type"
              name="lease_type"
              className="rw-input"
              value={formData.lease_type}
              onChange={handleChange}
              required
            >
              <option value="COMMERCIAL">Commercial</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="INDUSTRIAL">Industrial</option>
            </select>
          </div>

          <div className="rw-form-group">
            <label htmlFor="payment_terms" className="rw-label">Payment Terms *</label>
            <select
              id="payment_terms"
              name="payment_terms"
              className="rw-input"
              value={formData.payment_terms}
              onChange={handleChange}
              required
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUALLY">Annually</option>
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="start_date" className="rw-label">Start Date *</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              className="rw-input"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="end_date" className="rw-label">End Date *</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              className="rw-input"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="monthly_rent" className="rw-label">Monthly Rent ($) *</label>
            <input
              type="number"
              id="monthly_rent"
              name="monthly_rent"
              className="rw-input"
              value={formData.monthly_rent}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="security_deposit" className="rw-label">Security Deposit ($)</label>
            <input
              type="number"
              id="security_deposit"
              name="security_deposit"
              className="rw-input"
              value={formData.security_deposit}
              onChange={handleChange}
              step="0.01"
              min="0"
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
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
            <option value="PENDING">Pending</option>
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
            {loading ? 'Saving...' : (lease ? 'Update Lease' : 'Create Lease')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default LeaseForm;

