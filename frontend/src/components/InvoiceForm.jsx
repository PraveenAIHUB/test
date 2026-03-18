/**
 * Invoice Form - New Transaction (Create tenant invoice)
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { API_URL } from '../config/api';

function InvoiceForm({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    due_date: '',
    amount: '',
    invoice_type: 'RENT',
    description: ''
  });
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API_URL}/tenants?limit=100`).then(r => setTenants(r.data?.data ?? r.data ?? [])).catch(() => setTenants([]));
      axios.get(`${API_URL}/properties?limit=100`).then(r => setProperties(r.data?.data ?? r.data ?? [])).catch(() => setProperties([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !formData.due_date) {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setFormData(prev => ({ ...prev, due_date: d.toISOString().slice(0, 10) }));
    }
  }, [isOpen]);

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
        tenant_id: parseInt(formData.tenant_id, 10),
        property_id: parseInt(formData.property_id, 10),
        due_date: formData.due_date,
        amount: parseFloat(formData.amount) || 0,
        invoice_type: formData.invoice_type,
        description: formData.description.trim() || null
      };
      await axios.post(`${API_URL}/financials`, payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Transaction" size="large">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>{error}</div>
        )}

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Tenant *</label>
            <select name="tenant_id" className="rw-input" value={String(formData.tenant_id)} onChange={handleChange} required>
              <option value="">Select tenant</option>
              {tenants.map((t, idx) => {
                const id = t.tenant_id ?? t.TENANT_ID;
                if (id == null || id === '') return null;
                const label = t.tenant_name ?? t.TENANT_NAME ?? t.company_name ?? t.COMPANY_NAME ?? `Tenant ${id}`;
                return <option key={id ?? idx} value={String(id)}>{label}</option>;
              })}
            </select>
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Property *</label>
            <select name="property_id" className="rw-input" value={String(formData.property_id)} onChange={handleChange} required>
              <option value="">Select property</option>
              {properties.map((p, idx) => {
                const id = p.property_id ?? p.PROPERTY_ID;
                if (id == null || id === '') return null;
                const label = p.property_name ?? p.PROPERTY_NAME ?? p.property_code ?? p.PROPERTY_CODE ?? `Property ${id}`;
                return <option key={id ?? idx} value={String(id)}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Due Date *</label>
            <input
              type="date"
              name="due_date"
              className="rw-input"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Amount (KES) *</label>
            <input
              type="number"
              name="amount"
              className="rw-input"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Type</label>
            <select name="invoice_type" className="rw-input" value={formData.invoice_type} onChange={handleChange}>
              <option value="RENT">Rent</option>
              <option value="UTILITY">Utility</option>
              <option value="SERVICE">Service</option>
              <option value="PENALTY">Penalty</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Description</label>
          <textarea
            name="description"
            className="rw-input"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional notes"
          />
        </div>

        <div className="rw-form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="rw-button rw-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rw-button rw-button-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default InvoiceForm;
