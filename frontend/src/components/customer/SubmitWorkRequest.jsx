/**
 * Customer: Submit asset/unit maintenance request (AC, electrical, etc.)
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const API = API_URL;

export default function SubmitWorkRequest() {
  const [properties, setProperties] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [form, setForm] = useState({
    property_id: '',
    space_id: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    work_order_type: 'CORRECTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    axios.get(`${API}/properties`).then(r => setProperties(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
    axios.get(`${API}/space?limit=500`).then(r => setSpaces(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
  }, []);

  const spacesInProperty = form.property_id
    ? spaces.filter(s => (s.PROPERTY_ID || s.property_id) === form.property_id)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.property_id) {
      alert('Title and property are required.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/workorders/request`, {
        property_id: form.property_id,
        space_id: form.space_id || undefined,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        work_order_type: form.work_order_type
      });
      setSent(true);
      setForm({ property_id: '', space_id: '', title: '', description: '', priority: 'MEDIUM', work_order_type: 'CORRECTIVE' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>Submit Maintenance Request</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>
          Report issues with equipment in your unit or floor (AC, electrical, etc.)
        </p>
      </div>

      {sent && (
        <div className="rw-alert rw-alert-success" style={{ marginBottom: '16px' }}>
          Request submitted. We will process it shortly.
        </div>
      )}

      <div className="rw-card">
        <div className="rw-card-body">
          <form onSubmit={handleSubmit}>
            <div className="rw-form-group">
              <label className="rw-label">Property *</label>
              <select
                className="rw-input"
                value={form.property_id}
                onChange={e => setForm(f => ({ ...f, property_id: e.target.value, space_id: '' }))}
                required
              >
                <option value="">Select property</option>
                {properties.map(p => (
                  <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID || p.property_id}>
                    {p.PROPERTY_NAME || p.property_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Unit (optional)</label>
              <select
                className="rw-input"
                value={form.space_id}
                onChange={e => setForm(f => ({ ...f, space_id: e.target.value }))}
              >
                <option value="">Select unit</option>
                {spacesInProperty.map(s => (
                  <option key={s.SPACE_ID || s.space_id} value={s.SPACE_ID || s.space_id}>
                    {s.SPACE_CODE || s.space_code} – {s.SPACE_TYPE || s.space_type}
                  </option>
                ))}
              </select>
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Issue title *</label>
              <input
                type="text"
                className="rw-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. AC not cooling, Electrical fault in unit"
                required
              />
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Description</label>
              <textarea
                className="rw-input"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="More details about the issue"
              />
            </div>
            <div className="rw-form-row">
              <div className="rw-form-group">
                <label className="rw-label">Priority</label>
                <select
                  className="rw-input"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Type</label>
                <select
                  className="rw-input"
                  value={form.work_order_type}
                  onChange={e => setForm(f => ({ ...f, work_order_type: e.target.value }))}
                >
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="INSPECTION">Inspection</option>
                </select>
              </div>
            </div>
            <button type="submit" className="rw-button rw-button-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
