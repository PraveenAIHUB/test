import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const API = API_URL;
const ROOM_TYPES = ['LIVING', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'BALCONY', 'OFFICE', 'MEETING', 'OTHER'];

export default function AllRooms() {
  const [rooms, setRooms] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [spaceFilter, setSpaceFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ space_id: '', room_type: 'OFFICE', room_name: '', length_m: '', width_m: '' });

  useEffect(() => {
    axios.get(API + '/rooms').then(r => setRooms(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
    axios.get(API + '/space?limit=500').then(r => setSpaces(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
  }, []);

  const filteredRooms = spaceFilter ? rooms.filter(r => (r.SPACE_ID || r.space_id) === spaceFilter) : rooms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API + '/rooms', {
        space_id: form.space_id || (spaces[0] && (spaces[0].SPACE_ID || spaces[0].space_id)),
        room_type: form.room_type,
        room_name: form.room_name,
        length_m: form.length_m ? Number(form.length_m) : null,
        width_m: form.width_m ? Number(form.width_m) : null
      });
      const res = await axios.get(API + '/rooms');
      setRooms(res.data.data || []);
      setShowForm(false);
      setForm({ space_id: '', room_type: 'OFFICE', room_name: '', length_m: '', width_m: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add room');
    }
  };

  const getSpaceLabel = (spaceId) => {
    const s = spaces.find(x => (x.SPACE_ID || x.space_id) === spaceId);
    return s ? (s.SPACE_CODE || s.space_code) : spaceId;
  };

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <h2>Rooms (unit dimensions)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="rw-select" value={spaceFilter} onChange={(e) => setSpaceFilter(e.target.value)} style={{ width: '200px' }}>
            <option value="">All units</option>
            {spaces.map(s => (
              <option key={s.SPACE_ID || s.space_id} value={s.SPACE_ID || s.space_id}>{s.SPACE_CODE || s.space_code}</option>
            ))}
          </select>
          <button type="button" className="rw-button rw-button-primary" onClick={() => setShowForm(true)}>Add Room</button>
        </div>
      </div>

      {showForm && (
        <div className="rw-card" style={{ marginBottom: '24px' }}>
          <div className="rw-card-header"><h3>Add room</h3></div>
          <div className="rw-card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'end' }}>
              <div className="rw-form-group">
                <label>Unit</label>
                <select className="rw-select" value={form.space_id} onChange={(e) => setForm(f => ({ ...f, space_id: e.target.value }))} required>
                  <option value="">Select unit</option>
                  {spaces.map(s => (
                    <option key={s.SPACE_ID || s.space_id} value={s.SPACE_ID || s.space_id}>{s.SPACE_CODE || s.space_code}</option>
                  ))}
                </select>
              </div>
              <div className="rw-form-group">
                <label>Type</label>
                <select className="rw-select" value={form.room_type} onChange={(e) => setForm(f => ({ ...f, room_type: e.target.value }))}>
                  {ROOM_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="rw-form-group">
                <label>Name</label>
                <input className="rw-input" value={form.room_name} onChange={(e) => setForm(f => ({ ...f, room_name: e.target.value }))} />
              </div>
              <div className="rw-form-group">
                <label>Length (m)</label>
                <input type="number" step="0.01" className="rw-input" value={form.length_m} onChange={(e) => setForm(f => ({ ...f, length_m: e.target.value }))} />
              </div>
              <div className="rw-form-group">
                <label>Width (m)</label>
                <input type="number" step="0.01" className="rw-input" value={form.width_m} onChange={(e) => setForm(f => ({ ...f, width_m: e.target.value }))} />
              </div>
              <div className="rw-form-group">
                <button type="submit" className="rw-button rw-button-primary">Save</button>
                <button type="button" className="rw-button rw-button-secondary" style={{ marginLeft: '8px' }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rw-table-container">
        <table className="rw-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Room type</th>
              <th>Room name</th>
              <th>Length (m)</th>
              <th>Width (m)</th>
              <th>Area (sqm)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map(r => (
              <tr key={r.ROOM_ID || r.room_id}>
                <td className="rw-code">{getSpaceLabel(r.SPACE_ID || r.space_id)}</td>
                <td>{r.ROOM_TYPE || r.room_type}</td>
                <td>{r.ROOM_NAME || r.room_name || '-'}</td>
                <td>{r.LENGTH_M ?? r.length_m ?? '-'}</td>
                <td>{r.WIDTH_M ?? r.width_m ?? '-'}</td>
                <td>{r.AREA_SQM ?? r.area_sqm ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRooms.length === 0 && <p style={{ padding: '24px', color: 'var(--gray-500)' }}>No rooms. Add rooms to units to store dimensions.</p>}
      </div>
    </div>
  );
}
