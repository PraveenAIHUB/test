/**
 * Work Order Form - Create/Edit
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { API_URL } from '../config/api';

function WorkOrderForm({ isOpen, onClose, workOrder, onSuccess, defaultType = 'CORRECTIVE', title: formTitle }) {
  const [formData, setFormData] = useState({
    title: '',
    property_id: '',
    asset_id: '',
    description: '',
    work_order_type: 'CORRECTIVE',
    priority: 'MEDIUM',
    vendor_id: '',
    status: 'OPEN',
    scheduled_date: ''
  });
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API_URL}/properties?limit=100`).then(r => setProperties(r.data.data || [])).catch(() => setProperties([]));
      axios.get(`${API_URL}/vendors?limit=100`).then(r => setVendors(r.data.data || [])).catch(() => setVendors([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (workOrder) {
      setFormData({
        title: workOrder.title ?? workOrder.TITLE ?? '',
        property_id: String(workOrder.property_id ?? workOrder.PROPERTY_ID ?? ''),
        asset_id: workOrder.asset_id != null ? String(workOrder.asset_id) : (workOrder.ASSET_ID != null ? String(workOrder.ASSET_ID) : ''),
        description: workOrder.description ?? workOrder.DESCRIPTION ?? '',
        work_order_type: workOrder.work_order_type ?? workOrder.WORK_ORDER_TYPE ?? workOrder.TYPE ?? 'CORRECTIVE',
        priority: workOrder.priority ?? workOrder.PRIORITY ?? 'MEDIUM',
        vendor_id: workOrder.vendor_id != null ? String(workOrder.vendor_id) : (workOrder.VENDOR_ID != null ? String(workOrder.VENDOR_ID) : ''),
        status: workOrder.status ?? workOrder.STATUS ?? 'OPEN',
        scheduled_date: workOrder.scheduled_date ?? workOrder.SCHEDULED_DATE ?? ''
      });
    } else {
      setFormData({
        title: '',
        property_id: '',
        asset_id: '',
        description: '',
        work_order_type: defaultType,
        priority: 'MEDIUM',
        vendor_id: '',
        status: 'OPEN',
        scheduled_date: ''
      });
    }
  }, [workOrder, isOpen, defaultType]);

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
        title: formData.title.trim(),
        property_id: formData.property_id ? parseInt(formData.property_id, 10) : undefined,
        asset_id: formData.asset_id ? parseInt(formData.asset_id, 10) : null,
        description: formData.description.trim() || null,
        work_order_type: formData.work_order_type,
        priority: formData.priority,
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
        status: formData.status,
        scheduled_date: formData.scheduled_date || null
      };
      if (workOrder) {
        const id = workOrder.work_order_id ?? workOrder.WORK_ORDER_ID;
        await axios.put(`${API_URL}/workorders/${id}`, payload);
      } else {
        await axios.post(`${API_URL}/workorders`, payload);
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('Error saving work order:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formTitle ?? (workOrder ? 'Edit Work Order' : 'Create Work Order')} size="large">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>{error}</div>
        )}

        <div className="rw-form-group">
          <label className="rw-label">Title *</label>
          <input
            type="text"
            name="title"
            className="rw-input"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. HVAC Repair - Floor 3"
          />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Property *</label>
            <select name="property_id" className="rw-input" value={formData.property_id} onChange={handleChange} required>
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.property_id ?? p.PROPERTY_ID} value={p.property_id ?? p.PROPERTY_ID}>
                  {p.property_name ?? p.PROPERTY_NAME ?? p.property_code ?? p.PROPERTY_CODE}
                </option>
              ))}
            </select>
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Asset ID (optional)</label>
            <input
              type="number"
              name="asset_id"
              className="rw-input"
              value={formData.asset_id}
              onChange={handleChange}
              placeholder="e.g. 1"
              min="1"
            />
          </div>
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Description</label>
          <textarea name="description" className="rw-input" value={formData.description} onChange={handleChange} rows={3} />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Type</label>
            <select name="work_order_type" className="rw-input" value={formData.work_order_type} onChange={handleChange}>
              <option value="CORRECTIVE">Corrective</option>
              <option value="PREVENTIVE">Preventive</option>
              <option value="INSPECTION">Inspection</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Priority</label>
            <select name="priority" className="rw-input" value={formData.priority} onChange={handleChange}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label className="rw-label">Vendor</label>
            <select name="vendor_id" className="rw-input" value={formData.vendor_id} onChange={handleChange}>
              <option value="">None</option>
              {vendors.map((v) => (
                <option key={v.vendor_id ?? v.VENDOR_ID} value={v.vendor_id ?? v.VENDOR_ID}>
                  {v.vendor_name ?? v.VENDOR_NAME ?? v.vendor_code ?? v.VENDOR_CODE}
                </option>
              ))}
            </select>
          </div>
          <div className="rw-form-group">
            <label className="rw-label">Scheduled date</label>
            <input type="date" name="scheduled_date" className="rw-input" value={formData.scheduled_date} onChange={handleChange} />
          </div>
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Status</label>
          <select name="status" className="rw-input" value={formData.status} onChange={handleChange}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="rw-form-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="rw-btn rw-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="rw-btn rw-btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (workOrder ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default WorkOrderForm;
