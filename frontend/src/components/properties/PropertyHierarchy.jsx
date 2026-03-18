import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const API = API_URL;

export default function PropertyHierarchy() {
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [addFloorFor, setAddFloorFor] = useState(null);
  const [addAssetFor, setAddAssetFor] = useState(null);
  const [uploadingFloorId, setUploadingFloorId] = useState(null);

  useEffect(() => {
    setError(null);
    const opts = { timeout: 15000 };
    Promise.allSettled([
      axios.get(`${API}/properties`, opts).then(r => (r.data && r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/floors`, opts).then(r => (r.data && r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/space?limit=500`, opts).then(r => (r.data && r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/rooms`, opts).then(r => (r.data && r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/amenities`, opts).then(r => (r.data && r.data.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []))
    ]).then(([p, f, s, r, a]) => {
      setProperties(Array.isArray(p.value) ? p.value : []);
      setFloors(Array.isArray(f.value) ? f.value : []);
      setSpaces(Array.isArray(s.value) ? s.value : []);
      setRooms(Array.isArray(r.value) ? r.value : []);
      setAssets(Array.isArray(a.value) ? a.value : []);
      const failed = [p.status === 'rejected' && 'Properties', f.status === 'rejected' && 'Floors', s.status === 'rejected' && 'Space', r.status === 'rejected' && 'Rooms', a.status === 'rejected' && 'Assets'].filter(Boolean);
      if (failed.length > 0) {
        const backendHint = 'Start the backend first: open a terminal, run `cd backend` then `npm start` (or `node server.js`). It runs on port 3000. If using Vite dev server, it will proxy /api to the backend.';
        setError(`Could not load: ${failed.join(', ')}. ${backendHint}`);
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const floorsByProperty = (id) => floors.filter(f => (f.PROPERTY_ID || f.property_id) === id);
  const spacesByProperty = (id) => spaces.filter(s => (s.PROPERTY_ID || s.property_id) === id);
  const spacesByFloor = (floor) => {
    const fid = floor?.FLOOR_ID ?? floor?.floor_id;
    const pid = floor?.PROPERTY_ID ?? floor?.property_id;
    const fnum = floor?.FLOOR_NUMBER ?? floor?.floor_number;
    return spaces.filter(s =>
      (s.FLOOR_ID || s.floor_id) === fid ||
      (pid != null && fnum != null && (s.PROPERTY_ID || s.property_id) === pid && String(s.FLOOR ?? s.floor_number ?? '') === String(fnum))
    );
  };
  const roomsBySpace = (spaceId) => rooms.filter(r => (r.SPACE_ID || r.space_id) === spaceId);
  const assetsByProperty = (id) => assets.filter(a => (a.PROPERTY_ID || a.property_id) === id);

  const handleAddFloor = async (propertyId) => {
    if (!addFloorFor) return;
    const num = floorsByProperty(propertyId).length + 1;
    try {
      await axios.post(`${API}/floors`, { property_id: propertyId, floor_number: num, floor_name: `Floor ${num}` });
      const res = await axios.get(`${API}/floors`);
      setFloors((res.data && res.data.data) ? res.data.data : []);
      setAddFloorFor(null);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add floor');
    }
  };

  const handleAddAsset = async (propertyId) => {
    const name = document.getElementById('asset-name')?.value || 'New Asset';
    const type = document.getElementById('asset-type')?.value || 'COMMON_AREA';
    try {
      await axios.post(`${API}/amenities`, { property_id: propertyId, amenity_name: name, amenity_type: type });
      const res = await axios.get(`${API}/amenities`);
      setAssets((res.data && res.data.data) ? res.data.data : []);
      setAddAssetFor(null);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add asset');
    }
  };

  const handleFloorPlanUpload = (floorId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      setUploadingFloorId(floorId);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post(`${API}/upload?type=floor`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = uploadRes.data?.data?.url;
        if (url) {
          await axios.put(`${API}/floors/${floorId}`, { floor_plan_image_url: url });
          const res = await axios.get(`${API}/floors`);
          setFloors((res.data && res.data.data) ? res.data.data : []);
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Upload failed');
      } finally {
        setUploadingFloorId(null);
      }
    };
    input.click();
  };

  if (loading) return <div className="rw-loading"><div className="rw-spinner" /> Loading hierarchy...</div>;

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>Property Hierarchy</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>Building → Floors → Units → Rooms & Assets</p>
      </div>

      {error && <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {properties.length === 0 && !loading && (
        <div className="rw-card">
          <div className="rw-card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No properties yet.</p>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Create a property from <strong>All Properties</strong> first, then return here to add floors, units, and assets.</p>
          </div>
        </div>
      )}

      <div className="rw-card">
        <div className="rw-card-body">
          {properties.map(prop => {
            const pid = prop.PROPERTY_ID || prop.property_id;
            const propKey = `prop-${pid}`;
            const isOpen = expanded[propKey];
            const propFloors = floorsByProperty(pid);
            const propSpaces = spacesByProperty(pid);
            const propAssets = assetsByProperty(pid);
            const floorNumbersFromSpaces = [...new Set(propSpaces.map(s => s.FLOOR ?? s.floor_number).filter(v => v != null && v !== ''))];
            const virtualFloors = floorNumbersFromSpaces.filter(n => !propFloors.some(f => String(f.FLOOR_NUMBER ?? f.floor_number) === String(n)));
            const allFloorsForProp = [...propFloors, ...virtualFloors.map(n => ({ PROPERTY_ID: pid, property_id: pid, FLOOR_NUMBER: n, floor_number: n, FLOOR_NAME: `Floor ${n}`, floor_name: `Floor ${n}`, _virtual: true }))].sort((a, b) => (Number(a.FLOOR_NUMBER ?? a.floor_number) || 0) - (Number(b.FLOOR_NUMBER ?? b.floor_number) || 0));

            return (
              <div key={pid} className="rw-card" style={{ marginBottom: '12px' }}>
                <div className="rw-card-header" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => toggle(propKey)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{isOpen ? '▼' : '▶'}</span>
                    <strong>{prop.PROPERTY_NAME || prop.property_name}</strong>
                    <span className="rw-badge rw-badge-success">{prop.PROPERTY_TYPE || prop.property_type}</span>
                  </div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                    {allFloorsForProp.length} floors · {propSpaces.length} units · {propAssets.length} assets
                  </span>
                </div>
                {isOpen && (
                  <div className="rw-card-body" style={{ borderTop: '1px solid var(--gray-200)' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <strong>Floors</strong>
                        {addFloorFor === pid ? (
                          <>
                            <button type="button" className="rw-button rw-button-primary" onClick={() => handleAddFloor(pid)}>Save Floor</button>
                            <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddFloorFor(null)}>Cancel</button>
                          </>
                        ) : (
                          <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddFloorFor(pid)}>+ Add Floor</button>
                        )}
                      </div>
                      <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                        {allFloorsForProp.map(f => (
                          <li key={f._virtual ? `v-${f.FLOOR_NUMBER ?? f.floor_number}` : (f.FLOOR_ID || f.floor_id)} style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="rw-code">Floor {f.FLOOR_NUMBER ?? f.floor_number}</span>
                            <span>{f.FLOOR_NAME || f.floor_name}</span>
                            <span style={{ color: 'var(--gray-500)' }}>({spacesByFloor(f).length} units)</span>
                            {f._virtual ? <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>— add from All Floors to upload plan</span> : null}
                            {!f._virtual && (f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url) ? (
                              <a href={f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url} target="_blank" rel="noopener noreferrer" className="rw-link" style={{ fontSize: '13px' }}>View plan</a>
                            ) : null}
                            {!f._virtual ? (
                              <button type="button" className="rw-button rw-button-secondary" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => handleFloorPlanUpload(f.FLOOR_ID || f.floor_id)} disabled={uploadingFloorId === (f.FLOOR_ID || f.floor_id)}>
                                {uploadingFloorId === (f.FLOOR_ID || f.floor_id) ? 'Uploading...' : (f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url ? 'Replace' : 'Upload') + ' floor plan'}
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <strong>Units (Spaces)</strong>
                      <div className="rw-table-container" style={{ marginTop: '8px' }}>
                        <table className="rw-table">
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Type</th>
                              <th>Floor</th>
                              <th>Area (sqm)</th>
                              <th>Price</th>
                              <th>Status</th>
                              <th>Rooms</th>
                            </tr>
                          </thead>
                          <tbody>
                            {propSpaces.slice(0, 15).map(s => (
                              <tr key={s.SPACE_ID || s.space_id}>
                                <td className="rw-code">{s.SPACE_CODE || s.space_code}</td>
                                <td>{s.SPACE_TYPE || s.space_type}</td>
                                <td>{s.FLOOR ?? s.floor_number ?? '—'}</td>
                                <td>{s.AREA ?? s.area ?? '—'}</td>
                                <td>{s.LIST_PRICE ?? s.list_price != null ? Number(s.LIST_PRICE ?? s.list_price).toLocaleString() : '—'}</td>
                                <td><span className={`rw-badge rw-badge-${(s.STATUS || s.occupancy_status) === 'OCCUPIED' ? 'success' : 'warning'}`}>{s.STATUS || s.occupancy_status}</span></td>
                                <td>{roomsBySpace(s.SPACE_ID || s.space_id).length}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {propSpaces.length > 15 && <p style={{ marginTop: '8px', color: 'var(--gray-500)' }}>+ {propSpaces.length - 15} more units</p>}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <strong>Assets (building / shared)</strong>
                        {addAssetFor === pid ? (
                          <>
                            <input id="asset-name" className="rw-input" placeholder="Name" style={{ width: '160px' }} />
                            <select id="asset-type" className="rw-select" style={{ width: '140px' }}>
                              <option value="COMMON_AREA">Common Area</option>
                              <option value="MEETING_ROOM">Meeting Room</option>
                              <option value="GYM">Gym</option>
                              <option value="PARKING">Parking</option>
                              <option value="CAFETERIA">Cafeteria</option>
                              <option value="COMMON_HALL">Common Hall</option>
                            </select>
                            <button type="button" className="rw-button rw-button-primary" onClick={() => handleAddAsset(pid)}>Add</button>
                            <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddAssetFor(null)}>Cancel</button>
                          </>
                        ) : (
                          <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddAssetFor(pid)}>+ Add Asset</button>
                        )}
                      </div>
                      <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                        {propAssets.map(a => (
                          <li key={a.AMENITY_ID || a.amenity_id} style={{ padding: '4px 0' }}>
                            <span className="rw-code">{a.AMENITY_TYPE || a.amenity_type}</span> {a.AMENITY_NAME || a.amenity_name}
                            {a.AREA_SQM != null && <span style={{ color: 'var(--gray-500)', marginLeft: '8px' }}>({a.AREA_SQM} sqm)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
