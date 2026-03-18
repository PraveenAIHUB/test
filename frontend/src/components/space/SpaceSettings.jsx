import { useState } from 'react';
import Modal from '../Modal';
import '../../styles/redwood-authentic.css';

function SpaceSettings() {
  const [spaceTypes, setSpaceTypes] = useState([
    { id: 1, name: 'Office', active: true },
    { id: 2, name: 'Meeting Room', active: true },
    { id: 3, name: 'Common Area', active: true },
    { id: 4, name: 'Storage', active: true },
    { id: 5, name: 'Cafeteria', active: true }
  ]);
  const [editingType, setEditingType] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', active: true });

  const openEdit = (type) => {
    setEditingType(type);
    setEditForm({ name: type.name, active: type.active });
  };

  const closeEdit = () => {
    setEditingType(null);
    setEditForm({ name: '', active: true });
  };

  const saveEdit = () => {
    if (!editingType) return;
    setSpaceTypes(prev =>
      prev.map(t => (t.id === editingType.id ? { ...t, name: editForm.name.trim() || t.name, active: editForm.active } : t))
    );
    closeEdit();
  };

  const addType = () => {
    const newId = Math.max(0, ...spaceTypes.map(t => t.id)) + 1;
    const newType = { id: newId, name: 'New Type', active: true };
    setSpaceTypes(prev => [...prev, newType]);
    openEdit(newType);
  };

  const deleteType = (id) => {
    if (window.confirm('Remove this space type?')) setSpaceTypes(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="rw-page-content">
      <div className="rw-section">
        <h2 className="rw-section-title">Space Management Settings</h2>
        
        {/* Space Types */}
        <div className="rw-card" style={{ marginTop: '24px' }}>
          <div className="rw-card-header">
            <h3 className="rw-chart-title">Space Types</h3>
            <button type="button" className="rw-btn rw-btn-primary rw-btn-sm" onClick={addType}>Add Type</button>
          </div>
          <div className="rw-card-body">
            <div className="rw-table-container">
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Type Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spaceTypes.map(type => (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>
                        <span className={`rw-badge ${type.active ? 'rw-status-active' : 'rw-status-inactive'}`}>
                          {type.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="rw-btn rw-btn-sm rw-btn-secondary" onClick={() => openEdit(type)}>Edit</button>
                        {' '}
                        <button type="button" className="rw-btn rw-btn-sm rw-btn-secondary" onClick={() => deleteType(type.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Space Type Modal */}
        <Modal isOpen={!!editingType} onClose={closeEdit} title="Edit Space Type" size="small">
          <div className="rw-form-group">
            <label className="rw-label">Type Name</label>
            <input
              type="text"
              className="rw-input"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Office"
            />
          </div>
          <div className="rw-form-group" style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm(prev => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="rw-form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="rw-btn rw-btn-secondary" onClick={closeEdit}>Cancel</button>
            <button type="button" className="rw-btn rw-btn-primary" onClick={saveEdit}>Save</button>
          </div>
        </Modal>

        {/* Utilization Thresholds */}
        <div className="rw-card" style={{ marginTop: '24px' }}>
          <div className="rw-card-header">
            <h3 className="rw-chart-title">Utilization Thresholds</h3>
          </div>
          <div className="rw-card-body">
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="rw-form-group">
                <label className="rw-form-label">Low Utilization Threshold (%)</label>
                <input type="number" className="rw-input" defaultValue="50" />
                <small style={{ color: '#757575', fontSize: '12px' }}>Alert when space utilization falls below this percentage</small>
              </div>
              <div className="rw-form-group">
                <label className="rw-form-label">High Utilization Threshold (%)</label>
                <input type="number" className="rw-input" defaultValue="90" />
                <small style={{ color: '#757575', fontSize: '12px' }}>Alert when space utilization exceeds this percentage</small>
              </div>
              <div className="rw-form-group">
                <label className="rw-form-label">Minimum Capacity per Person (sqm)</label>
                <input type="number" className="rw-input" defaultValue="10" />
                <small style={{ color: '#757575', fontSize: '12px' }}>Recommended space allocation per occupant</small>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="rw-btn rw-btn-primary">Save Settings</button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rw-card" style={{ marginTop: '24px' }}>
          <div className="rw-card-header">
            <h3 className="rw-chart-title">Notification Settings</h3>
          </div>
          <div className="rw-card-body">
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="notify-vacancy" defaultChecked />
                <label htmlFor="notify-vacancy">Notify when space becomes vacant</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="notify-low-util" defaultChecked />
                <label htmlFor="notify-low-util">Notify on low utilization</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="notify-high-util" defaultChecked />
                <label htmlFor="notify-high-util">Notify on high utilization</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="notify-changes" defaultChecked />
                <label htmlFor="notify-changes">Notify on space allocation changes</label>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button className="rw-btn rw-btn-primary">Save Notifications</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpaceSettings;

