/**
 * Portfolio & Map – full property details, map, filters, export, and actions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../../config/api';
import PropertyForm from '../PropertyForm';
import '../../styles/redwood-authentic.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const API = API_URL;

function MapFocus({ center, propertyId }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null && propertyId) {
      map.flyTo(center, 16, { duration: 0.5 });
    }
  }, [map, center, propertyId]);
  return null;
}

export default function PropertyPortfolio() {
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [addFloorFor, setAddFloorFor] = useState(null);
  const [addAssetFor, setAddAssetFor] = useState(null);
  const [uploadingFloorId, setUploadingFloorId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [focusedPropertyId, setFocusedPropertyId] = useState(null);
  const cardRefs = useRef({});

  const [filters, setFilters] = useState({ search: '', type: '', status: '', city: '' });

  const fetchData = useCallback(async () => {
    setError(null);
    const opts = { timeout: 15000 };
    const params = new URLSearchParams();
    params.append('limit', '500');
    Promise.allSettled([
      axios.get(`${API}/properties?${params}`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/floors`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/space?limit=500`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/rooms`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/amenities`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])),
      axios.get(`${API}/work-orders?limit=500`, opts).then(r => (r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []))
    ]).then(([p, f, s, r, a, w]) => {
      setProperties(Array.isArray(p.value) ? p.value : []);
      setFloors(Array.isArray(f.value) ? f.value : []);
      setSpaces(Array.isArray(s.value) ? s.value : []);
      setRooms(Array.isArray(r.value) ? r.value : []);
      setAssets(Array.isArray(a.value) ? a.value : []);
      setWorkOrders(Array.isArray(w.value) ? w.value : []);
      const failed = [p.status === 'rejected' && 'Properties', f.status === 'rejected' && 'Floors', s.status === 'rejected' && 'Space', r.status === 'rejected' && 'Rooms', a.status === 'rejected' && 'Assets'].filter(Boolean);
      if (failed.length > 0) setError(`Could not load: ${failed.join(', ')}. Start the backend: open a terminal, run \`cd backend\` then \`npm start\` (default port 3000). If using Vite, ensure the dev server proxies /api to the backend.`);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  const floorsByProperty = (id) => floors.filter(f => (f.PROPERTY_ID || f.property_id) == id);
  const spacesByProperty = (id) => spaces.filter(s => (s.PROPERTY_ID || s.property_id) == id);
  const spacesByFloor = (floor) => {
    const fid = floor?.FLOOR_ID ?? floor?.floor_id;
    const pid = floor?.PROPERTY_ID ?? floor?.property_id;
    const fnum = floor?.FLOOR_NUMBER ?? floor?.floor_number;
    return spaces.filter(s =>
      (s.FLOOR_ID || s.floor_id) === fid ||
      (pid != null && fnum != null && (s.PROPERTY_ID || s.property_id) == pid && String(s.FLOOR ?? s.floor_number ?? '') === String(fnum))
    );
  };
  const roomsBySpace = (spaceId) => rooms.filter(r => (r.SPACE_ID || r.space_id) === spaceId);
  const assetsByProperty = (id) => assets.filter(a => (a.PROPERTY_ID || a.property_id) == id);
  const workOrdersByProperty = (id) => workOrders.filter(w => (w.PROPERTY_ID || w.property_id) == id);

  const handleAddFloor = async (propertyId) => {
    if (!addFloorFor) return;
    const num = floorsByProperty(propertyId).length + 1;
    try {
      await axios.post(`${API}/floors`, { property_id: propertyId, floor_number: num, floor_name: `Floor ${num}` });
      const res = await axios.get(`${API}/floors`);
      setFloors((res.data?.data) ? res.data.data : []);
      setAddFloorFor(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed to add floor'); }
  };

  const handleAddAsset = async (propertyId) => {
    const name = document.getElementById(`asset-name-${propertyId}`)?.value || 'New Asset';
    const type = document.getElementById(`asset-type-${propertyId}`)?.value || 'COMMON_AREA';
    try {
      await axios.post(`${API}/amenities`, { property_id: propertyId, amenity_name: name, amenity_type: type });
      const res = await axios.get(`${API}/amenities`);
      setAssets((res.data?.data) ? res.data.data : []);
      setAddAssetFor(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed to add asset'); }
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
          setFloors((res.data?.data) ? res.data.data : []);
        }
      } catch (err) { alert(err.response?.data?.error || 'Upload failed'); }
      finally { setUploadingFloorId(null); }
    };
    input.click();
  };

  const handleEdit = (prop) => { setSelectedProperty(prop); setShowEditForm(true); };
  const handleFormSuccess = () => { setShowEditForm(false); setSelectedProperty(null); fetchData(); };

  const focusOnMap = (prop) => {
    const id = prop.PROPERTY_ID ?? prop.property_id;
    const lat = prop.latitude ?? prop.LATITUDE;
    const lng = prop.longitude ?? prop.LONGITUDE;
    setExpanded(prev => ({ ...prev, [`prop-${id}`]: true }));
    if (lat != null && lng != null) setFocusedPropertyId(id);
    setTimeout(() => { const el = cardRefs.current[id]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 300);
  };

  const handleExport = async (format) => {
    try {
      const res = await axios.get(`${API}/properties/export?format=${format}`, { responseType: format === 'csv' ? 'blob' : 'json' });
      if (format === 'csv') {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a'); a.href = url; a.download = 'properties.csv'; a.click(); URL.revokeObjectURL(url);
      } else {
        const data = res.data?.data ?? res.data;
        const blob = new Blob([JSON.stringify(Array.isArray(data) ? data : { data }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'properties.json'; a.click(); URL.revokeObjectURL(url);
      }
    } catch (e) { alert('Export failed'); }
  };

  const filteredProperties = properties.filter(p => {
    const name = (p.PROPERTY_NAME || p.property_name || '').toLowerCase();
    const code = (p.PROPERTY_CODE || p.property_code || '').toLowerCase();
    const addr = (p.ADDRESS || p.address || p.ADDRESS_LINE1 || p.address_line1 || '').toLowerCase();
    const city = (p.CITY || p.city || '').toLowerCase();
    const search = (filters.search || '').toLowerCase();
    if (search && !name.includes(search) && !code.includes(search) && !addr.includes(search) && !city.includes(search)) return false;
    if (filters.type && (p.PROPERTY_TYPE || p.property_type) !== filters.type) return false;
    if (filters.status && (p.STATUS || p.status) !== filters.status) return false;
    if (filters.city && (p.CITY || p.city) !== filters.city) return false;
    return true;
  });

  const mapCenter = (() => {
    const withCoords = filteredProperties.filter(p => {
      const lat = p.latitude ?? p.LATITUDE;
      const lng = p.longitude ?? p.LONGITUDE;
      return lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
    });
    if (withCoords.length === 0) return [-1.2921, 36.8219];
    const sumLat = withCoords.reduce((a, p) => a + Number(p.latitude ?? p.LATITUDE), 0);
    const sumLng = withCoords.reduce((a, p) => a + Number(p.longitude ?? p.LONGITUDE), 0);
    return [sumLat / withCoords.length, sumLng / withCoords.length];
  })();

  const focusedCenter = focusedPropertyId && (() => {
    const p = properties.find(pr => (pr.PROPERTY_ID ?? pr.property_id) == focusedPropertyId);
    if (!p) return null;
    const lat = p.latitude ?? p.LATITUDE;
    const lng = p.longitude ?? p.LONGITUDE;
    return (lat != null && lng != null) ? [Number(lat), Number(lng)] : null;
  })();

  if (loading) return <div className="rw-all-records-content"><div className="rw-loading"><div className="rw-spinner" /> Loading portfolio...</div></div>;

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2>Portfolio & Map</h2>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>View all properties on the map, full details, floors, units, assets, and quick actions.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => handleExport('csv')}>Export CSV</button>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => handleExport('json')}>Export JSON</button>
        </div>
      </div>

      {error && <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

      <div className="rw-card" style={{ marginBottom: '16px' }}>
        <div className="rw-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div className="rw-form-group" style={{ marginBottom: 0 }}>
            <label className="rw-label">Search</label>
            <input type="text" className="rw-input" placeholder="Name, code, address, city" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ minWidth: '200px' }} />
          </div>
          <div className="rw-form-group" style={{ marginBottom: 0 }}>
            <label className="rw-label">Type</label>
            <select className="rw-select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={{ minWidth: '140px' }}>
              <option value="">All</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="RETAIL">Retail</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="MIXED_USE">Mixed Use</option>
            </select>
          </div>
          <div className="rw-form-group" style={{ marginBottom: 0 }}>
            <label className="rw-label">Status</label>
            <select className="rw-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ minWidth: '120px' }}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
          <div className="rw-form-group" style={{ marginBottom: 0 }}>
            <label className="rw-label">City</label>
            <select className="rw-select" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} style={{ minWidth: '140px' }}>
              <option value="">All</option>
              {[...new Set(properties.map(p => p.CITY || p.city).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="button" className="rw-button rw-button-secondary" onClick={() => setFilters({ search: '', type: '', status: '', city: '' })}>Clear filters</button>
        </div>
      </div>

      <div className="rw-card" style={{ marginBottom: '24px' }}>
        <div className="rw-card-header">
          <h3>Property locations</h3>
          <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
            {filteredProperties.filter(p => (p.latitude ?? p.LATITUDE) != null && (p.longitude ?? p.LONGITUDE) != null).length} of {filteredProperties.length} with coordinates
          </span>
        </div>
        <div style={{ height: '360px', width: '100%', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFocus center={focusedCenter} propertyId={focusedPropertyId} />
            {filteredProperties.map(prop => {
              const lat = prop.latitude ?? prop.LATITUDE;
              const lng = prop.longitude ?? prop.LONGITUDE;
              if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return null;
              const pid = prop.PROPERTY_ID ?? prop.property_id;
              const name = prop.PROPERTY_NAME ?? prop.property_name ?? `Property ${pid}`;
              return (
                <Marker key={pid} position={[Number(lat), Number(lng)]} eventHandlers={{ click: () => { setFocusedPropertyId(pid); setExpanded(prev => ({ ...prev, [`prop-${pid}`]: true })); setTimeout(() => { const el = cardRefs.current[pid]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 200); } }}>
                  <Popup>{name}</Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rw-card">
          <div className="rw-card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--gray-600)' }}>No properties match the filters. Create a property from All Properties or clear filters.</p>
          </div>
        </div>
      ) : (
        <div className="rw-card">
          <div className="rw-card-body">
            {filteredProperties.map(prop => {
              const pid = prop.PROPERTY_ID ?? prop.property_id;
              const propKey = `prop-${pid}`;
              const isOpen = expanded[propKey];
              const propFloors = floorsByProperty(pid);
              const propSpaces = spacesByProperty(pid);
              const propAssets = assetsByProperty(pid);
              const woCount = workOrdersByProperty(pid).length;
              const floorNumbersFromSpaces = [...new Set(propSpaces.map(s => s.FLOOR ?? s.floor_number).filter(v => v != null && v !== ''))];
              const virtualFloors = floorNumbersFromSpaces.filter(n => !propFloors.some(f => String(f.FLOOR_NUMBER ?? f.floor_number) === String(n)));
              const allFloorsForProp = [...propFloors, ...virtualFloors.map(n => ({ PROPERTY_ID: pid, property_id: pid, FLOOR_NUMBER: n, floor_number: n, FLOOR_NAME: `Floor ${n}`, floor_name: `Floor ${n}`, _virtual: true }))].sort((a, b) => (Number(a.FLOOR_NUMBER ?? a.floor_number) || 0) - (Number(b.FLOOR_NUMBER ?? b.floor_number) || 0));
              const lat = prop.latitude ?? prop.LATITUDE;
              const lng = prop.longitude ?? prop.LONGITUDE;
              const hasCoords = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
              const googleMapsUrl = hasCoords ? `https://www.google.com/maps?q=${encodeURIComponent(Number(lat) + ',' + Number(lng))}` : null;

              return (
                <div key={pid} ref={el => { cardRefs.current[pid] = el; }} className="rw-card" style={{ marginBottom: '16px' }}>
                  <div className="rw-card-header" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }} onClick={() => toggle(propKey)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px' }}>{isOpen ? '▼' : '▶'}</span>
                      <strong>{prop.PROPERTY_NAME || prop.property_name}</strong>
                      <span className="rw-code">{prop.PROPERTY_CODE || prop.property_code}</span>
                      <span className={`rw-badge rw-badge-${(prop.STATUS || prop.status) === 'ACTIVE' ? 'success' : 'warning'}`}>{prop.PROPERTY_TYPE || prop.property_type}</span>
                    </div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>{allFloorsForProp.length} floors · {propSpaces.length} units · {propAssets.length} assets{woCount > 0 ? ` · ${woCount} work order(s)` : ''}</span>
                  </div>

                  {isOpen && (
                    <div className="rw-card-body" style={{ borderTop: '1px solid var(--gray-200)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-200)' }}>
                        <button type="button" className="rw-button rw-button-primary" onClick={() => handleEdit(prop)}>Edit property</button>
                        {googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="rw-button rw-button-secondary">Open in Google Maps</a>}
                        <button type="button" className="rw-button rw-button-secondary" onClick={() => focusOnMap(prop)}>View on map</button>
                        <Link to={`/workorders?property_id=${pid}`} className="rw-button rw-button-secondary">Work orders {woCount > 0 ? `(${woCount})` : ''}</Link>
                        <Link to={`/space?property_id=${pid}`} className="rw-button rw-button-secondary">Space Management</Link>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div><strong>Address</strong><br />{(prop.ADDRESS || prop.address || prop.ADDRESS_LINE1 || prop.address_line1) || '—'}</div>
                        <div><strong>City</strong><br />{prop.CITY || prop.city || '—'}</div>
                        <div><strong>State / Country</strong><br />{(prop.STATE || prop.state) || '—'} / {prop.COUNTRY || prop.country || '—'}</div>
                        <div><strong>Postal</strong><br />{prop.POSTAL_CODE || prop.postal_code || prop.zip_code || '—'}</div>
                        <div><strong>Total area</strong><br />{prop.TOTAL_AREA ?? prop.total_area != null ? `${Number(prop.TOTAL_AREA ?? prop.total_area).toLocaleString()} sqm` : '—'}</div>
                        <div><strong>Total units</strong><br />{prop.TOTAL_UNITS ?? prop.total_units ?? '—'}</div>
                        <div><strong>Floors</strong><br />{prop.TOTAL_FLOORS ?? prop.total_floors ?? prop.FLOORS ?? prop.floors ?? '—'}</div>
                        <div><strong>Year built</strong><br />{prop.YEAR_BUILT ?? prop.year_built ?? '—'}</div>
                        {hasCoords && <div><strong>Coordinates</strong><br />{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</div>}
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <strong>Floors</strong>
                          {addFloorFor === pid ? (<><button type="button" className="rw-button rw-button-primary" onClick={() => handleAddFloor(pid)}>Save floor</button><button type="button" className="rw-button rw-button-secondary" onClick={() => setAddFloorFor(null)}>Cancel</button></>) : <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddFloorFor(pid)}>+ Add floor</button>}
                        </div>
                        <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                          {allFloorsForProp.map(f => (
                            <li key={f._virtual ? `v-${f.FLOOR_NUMBER ?? f.floor_number}` : (f.FLOOR_ID ?? f.floor_id)} style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="rw-code">Floor {f.FLOOR_NUMBER ?? f.floor_number}</span>
                              <span>{f.FLOOR_NAME || f.floor_name}</span>
                              <span style={{ color: 'var(--gray-500)' }}>({spacesByFloor(f).length} units)</span>
                              {f._virtual ? <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>— add from All Floors to upload plan</span> : null}
                              {!f._virtual && (f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url) ? <a href={f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url} target="_blank" rel="noopener noreferrer" className="rw-link" style={{ fontSize: '13px' }}>View plan</a> : null}
                              {!f._virtual ? <button type="button" className="rw-button rw-button-secondary" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => handleFloorPlanUpload(f.FLOOR_ID ?? f.floor_id)} disabled={uploadingFloorId === (f.FLOOR_ID ?? f.floor_id)}>{uploadingFloorId === (f.FLOOR_ID ?? f.floor_id) ? 'Uploading...' : (f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url ? 'Replace' : 'Upload') + ' floor plan'}</button> : null}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong>Units (Spaces)</strong>
                        <div className="rw-table-container" style={{ marginTop: '8px' }}>
                          <table className="rw-table">
                            <thead><tr><th>Code</th><th>Type</th><th>Floor</th><th>Area (sqm)</th><th>Price</th><th>Status</th><th>Rooms</th></tr></thead>
                            <tbody>
                              {propSpaces.slice(0, 20).map(s => (
                                <tr key={s.SPACE_ID ?? s.space_id}>
                                  <td className="rw-code">{s.SPACE_CODE || s.space_code}</td>
                                  <td>{s.SPACE_TYPE || s.space_type}</td>
                                  <td>{s.FLOOR ?? s.floor_number ?? '—'}</td>
                                  <td>{s.AREA ?? s.area ?? '—'}</td>
                                  <td>{s.LIST_PRICE ?? s.list_price != null ? Number(s.LIST_PRICE ?? s.list_price).toLocaleString() : '—'}</td>
                                  <td><span className={`rw-badge rw-badge-${(s.STATUS || s.occupancy_status) === 'OCCUPIED' ? 'success' : 'warning'}`}>{s.STATUS || s.occupancy_status}</span></td>
                                  <td>{roomsBySpace(s.SPACE_ID ?? s.space_id).length}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {propSpaces.length > 20 && <p style={{ marginTop: '8px', color: 'var(--gray-500)' }}>+ {propSpaces.length - 20} more units</p>}
                        </div>
                        <p style={{ marginTop: '8px' }}><Link to={`/space?property_id=${pid}`} className="rw-link">View all in Space Management →</Link></p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <strong>Assets</strong>
                          {addAssetFor === pid ? (
                            <><input id={`asset-name-${pid}`} className="rw-input" placeholder="Name" style={{ width: '160px' }} />
                              <select id={`asset-type-${pid}`} className="rw-select" style={{ width: '140px' }}>
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
                          ) : <button type="button" className="rw-button rw-button-secondary" onClick={() => setAddAssetFor(pid)}>+ Add asset</button>}
                        </div>
                        <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                          {propAssets.map(a => <li key={a.AMENITY_ID ?? a.amenity_id} style={{ padding: '4px 0' }}><span className="rw-code">{a.AMENITY_TYPE || a.amenity_type}</span> {a.AMENITY_NAME || a.amenity_name}{a.AREA_SQM != null && <span style={{ color: 'var(--gray-500)', marginLeft: '8px' }}>({a.AREA_SQM} sqm)</span>}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showEditForm && <PropertyForm isOpen={showEditForm} onClose={() => { setShowEditForm(false); setSelectedProperty(null); }} property={selectedProperty} onSuccess={handleFormSuccess} />}
    </div>
  );
}
