import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import FloorLayout from './FloorLayout';
import FloorPlanViewer from './FloorPlanViewer';
import './FloorPlans.css';

const API = API_URL;
const SQM_TO_SQFT = 10.7639;

const SPACE_TYPES = ['OFFICE', 'RETAIL', 'WAREHOUSE', 'UNIT', 'MEETING_ROOM', 'STORE', 'OTHER'];
const INITIAL_STATUSES = ['VACANT', 'RESERVED', 'OCCUPIED', 'LEASED'];

function FloorPlans() {
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedFloorNum, setSelectedFloorNum] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [addingFloor, setAddingFloor] = useState(false);
  const [formFloorNumber, setFormFloorNumber] = useState('');
  const [formFloorName, setFormFloorName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFloorPlanUrl, setFormFloorPlanUrl] = useState('');
  const [layoutPreview, setLayoutPreview] = useState(null);
  const [layoutSpaces, setLayoutSpaces] = useState([]);
  const [layoutDiagram, setLayoutDiagram] = useState(null);
  const [layoutMessage, setLayoutMessage] = useState('');
  const [uploadingLayout, setUploadingLayout] = useState(false);
  const [uploadLayoutError, setUploadLayoutError] = useState('');
  const [savingFloor, setSavingFloor] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingSpace, setAddingSpace] = useState(false);
  const [formCategory, setFormCategory] = useState('SPACE');
  const [formSpaceType, setFormSpaceType] = useState('OFFICE');
  const [formArea, setFormArea] = useState('');
  const [formCount, setFormCount] = useState(1);
  const [formInitialStatus, setFormInitialStatus] = useState('VACANT');
  const [savingSpaces, setSavingSpaces] = useState(false);
  const [aiDiagram, setAiDiagram] = useState(null);
  const [generatingAiDiagram, setGeneratingAiDiagram] = useState(false);
  const [aiDiagramError, setAiDiagramError] = useState('');
  const [floorPlanLayout, setFloorPlanLayout] = useState(null);
  const [floorPlanLayoutLoading, setFloorPlanLayoutLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/properties`).then(r => setProperties(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
    axios.get(`${API}/floors`).then(r => setFloors(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
    axios.get(`${API}/space?limit=500`).then(r => setSpaces(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(false);
    if (properties.length && !selectedPropertyId) setSelectedPropertyId(properties[0].PROPERTY_ID || properties[0].property_id);
  }, [properties]);

  const propertyFloors = floors.filter(f => (f.PROPERTY_ID || f.property_id) === selectedPropertyId);
  const spacesForProperty = spaces.filter(s => (s.PROPERTY_ID || s.property_id) === selectedPropertyId);
  const floorNumbersFromSpaces = [...new Set(spacesForProperty.map(s => String(s.FLOOR ?? s.floor_number ?? '')))].filter(Boolean);
  const existingFloorNumbers = new Set([
    ...propertyFloors.map(f => String(f.FLOOR_NUMBER ?? f.floor_number ?? '')),
    ...floorNumbersFromSpaces,
    ...(selectedFloorNum != null && selectedFloorNum !== '' ? [String(selectedFloorNum)] : [])
  ]);
  const floorSpaces = spaces.filter(s => {
    const pid = s.PROPERTY_ID || s.property_id;
    const fn = s.FLOOR ?? s.floor_number;
    const onSelectedProperty = selectedPropertyId != null && (String(pid) === String(selectedPropertyId) || pid == selectedPropertyId);
    const fnStr = String(fn ?? '');
    const onExistingFloor = fnStr !== '' && (existingFloorNumbers.has(fnStr) || existingFloorNumbers.has(String(Number(fn))));
    if (!onSelectedProperty || !onExistingFloor) return false;
    if (selectedFloorNum === '' || selectedFloorNum == null) return true;
    return String(fn) === String(selectedFloorNum) || fn == selectedFloorNum;
  });

  const selectedProperty = properties.find(p => (p.PROPERTY_ID || p.property_id) === selectedPropertyId);
  const selectedFloorRecord = propertyFloors.find((f) => String(f.FLOOR_NUMBER ?? f.floor_number) === String(selectedFloorNum));
  const getPropertyNameForSpace = (space) => {
    if (!space) return '—';
    const pid = space.PROPERTY_ID ?? space.property_id;
    const p = properties.find(pr => String(pr.PROPERTY_ID ?? pr.property_id) === String(pid));
    return p ? (p.PROPERTY_NAME || p.property_name) : ((space.PROPERTY_NAME || space.property_name || pid) ?? '—');
  };
  const totalArea = floorSpaces.reduce((sum, s) => sum + (Number(s.AREA || s.area) || 0), 0);
  const occupiedArea = floorSpaces.filter(s => (s.STATUS || s.occupancy_status) === 'OCCUPIED').reduce((sum, s) => sum + (Number(s.AREA || s.area) || 0), 0);

  const gridCols = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(floorSpaces.length))));
  const floorPlanSpaces = [...floorSpaces]
    .filter((s) => Number(s.AREA || s.area) > 0)
    .sort((a, b) => {
      const areaA = Number(a.AREA || a.area) || 0;
      const areaB = Number(b.AREA || b.area) || 0;
      return areaB - areaA;
    });
  const primaryPlanSpaces = floorPlanSpaces.slice(0, 4);
  const overflowPlanSpaces = floorPlanSpaces.slice(4);

  const formatAreaForDiagram = (space) => {
    const raw = Number(space.AREA || space.area) || 0;
    if (!raw) return '0 SQT';
    // Heuristic: values <= 120 are most likely sqm from admin form; convert to sqft for "SQT" display.
    const asSqft = raw <= 120 ? raw * SQM_TO_SQFT : raw;
    return `${Math.round(asSqft)} SQT`;
  };

  const getCardinalPlanPosition = (idx) => {
    if (idx === 0) return { left: '2%', top: '2%', width: '44%', height: '39%', bg: '#f6efbe' };
    if (idx === 1) return { left: '54%', top: '2%', width: '44%', height: '39%', bg: '#f8dbbd' };
    if (idx === 2) return { left: '2%', top: '45%', width: '44%', height: '53%', bg: '#dce9f9' };
    return { left: '54%', top: '45%', width: '44%', height: '53%', bg: '#d9f0cf' };
  };

  const fetchFloorPlanLayout = useCallback((forceRegenerate = false) => {
    if (!selectedPropertyId || !selectedFloorNum) {
      setFloorPlanLayout(null);
      return;
    }
    setFloorPlanLayoutLoading(true);
    const params = { property_id: selectedPropertyId, floor_number: selectedFloorNum };
    if (forceRegenerate) params.force_regenerate = '1';
    axios
      .get(`${API}/floors/floor-plan`, { params })
      .then((r) => setFloorPlanLayout(r.data?.data || null))
      .catch(() => setFloorPlanLayout(null))
      .finally(() => setFloorPlanLayoutLoading(false));
  }, [selectedPropertyId, selectedFloorNum]);

  useEffect(() => {
    fetchFloorPlanLayout();
  }, [fetchFloorPlanLayout]);

  const handleGenerateAiDiagram = async () => {
    if (!selectedPropertyId || !selectedFloorNum || primaryPlanSpaces.length === 0) return;
    setGeneratingAiDiagram(true);
    setAiDiagramError('');
    try {
      const payloadSpaces = primaryPlanSpaces.map((s, idx) => ({
        code: s.SPACE_CODE || s.space_code || `UNIT-${idx + 1}`,
        area_sqm: Number(s.AREA || s.area) || 0
      }));
      const prompt = 'my floor 300sqt and 400 sqt space and 400 sqt unit and 500 sqt unit create one floor plan diagram';
      const res = await axios.post(`${API}/ai/floor-plan-diagram`, {
        spaces: payloadSpaces,
        user_prompt: prompt,
        style_reference: `${selectedFloorRecord?.FLOOR_PLAN_IMAGE_URL || selectedFloorRecord?.floor_plan_image_url || ''} match uploaded sample look with center core and four outer rooms`
      });
      const d = res.data?.data;
      if (!d || !Array.isArray(d.rooms)) throw new Error('Invalid AI response');
      setAiDiagram(d);
    } catch (err) {
      setAiDiagramError(err.response?.data?.error || err.message || 'Failed to generate AI diagram');
      setAiDiagram(null);
    } finally {
      setGeneratingAiDiagram(false);
    }
  };

  const handleAddFloor = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      alert('Select a property first');
      return;
    }
    const num = formFloorNumber !== '' ? Number(formFloorNumber) : (propertyFloors.length ? (Math.max(...propertyFloors.map(f => (f.FLOOR_NUMBER ?? f.floor_number) || 0)) + 1) : 1);
    setSavingFloor(true);
    try {
      const res = await axios.post(`${API}/floors`, {
        property_id: selectedPropertyId,
        floor_number: num,
        floor_name: formFloorName || `Floor ${num}`,
        floor_plan_image_url: formFloorPlanUrl || undefined,
        floor_plan_layout: formDescription || undefined
      });
      const floor = res.data?.data;
      const all = await axios.get(`${API}/floors`);
      setFloors(Array.isArray(all.data.data) ? all.data.data : []);
      setSelectedFloorNum(String(floor.FLOOR_NUMBER ?? floor.floor_number ?? num));
      setAddingFloor(false);
      setFormFloorName('');
      setFormFloorNumber('');
      setFormDescription('');
      setFormFloorPlanUrl('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add floor');
    } finally {
      setSavingFloor(false);
    }
  };

  const handleFloorImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API}/upload?type=floor`, form, { headers: { Accept: 'application/json' } });
      const url = res.data?.data?.url || res.data?.url;
      if (url) setFormFloorPlanUrl(url.startsWith('http') ? url : (url.startsWith('/') ? url : `/${url}`));
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleUploadLayout = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPropertyId || !selectedFloorNum) return;
    setUploadingLayout(true);
    setUploadLayoutError('');
    setLayoutPreview(null);
    setLayoutSpaces([]);
    setLayoutDiagram(null);
    setLayoutMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('property_id', selectedPropertyId);
      form.append('floor_number', selectedFloorNum);
      const res = await axios.post(`${API}/floors/parse-layout`, form, {
        headers: { Accept: 'application/json' }
      });
      const d = res.data?.data || {};
      setLayoutPreview(d.floor_plan_image_url || null);
      setLayoutSpaces(Array.isArray(d.spaces) ? d.spaces : []);
      setLayoutDiagram(d.diagram || null);
      setLayoutMessage(d.message || '');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to parse layout';
      setUploadLayoutError(msg);
    } finally {
      setUploadingLayout(false);
      e.target.value = '';
    }
  };

  const handleCreateSpacesFromLayout = async () => {
    if (!selectedPropertyId || !selectedFloorNum || !layoutSpaces.length) return;
    try {
      const floorsRes = await axios.get(`${API}/floors?property_id=${encodeURIComponent(selectedPropertyId)}`);
      const existingFloors = Array.isArray(floorsRes.data.data) ? floorsRes.data.data : [];
      const selectedNum = selectedFloorNum;
      const matchFloor = (f) => {
        const n = f.FLOOR_NUMBER ?? f.floor_number;
        return n == selectedNum || String(n) === String(selectedNum);
      };
      let floorRecord = existingFloors.find(matchFloor);
      let floorNum = floorRecord != null ? (Number(floorRecord.FLOOR_NUMBER ?? floorRecord.floor_number) || Number(selectedNum)) : Number(selectedNum);
      if (!floorRecord && (floorNum === undefined || floorNum === null || Number.isNaN(floorNum))) floorNum = 1;
      if (!floorRecord) {
        const createRes = await axios.post(`${API}/floors`, {
          property_id: selectedPropertyId,
          floor_number: floorNum,
          floor_name: `Floor ${floorNum}`
        });
        floorRecord = createRes.data?.data || null;
        if (floorRecord) floorNum = floorRecord.FLOOR_NUMBER ?? floorRecord.floor_number ?? floorNum;
        const floorsListRes = await axios.get(`${API}/floors`);
        setFloors(Array.isArray(floorsListRes.data.data) ? floorsListRes.data.data : []);
      }
      const floorId = floorRecord ? (floorRecord.FLOOR_ID ?? floorRecord.floor_id) : null;
      const numToUse = floorRecord ? (floorRecord.FLOOR_NUMBER ?? floorRecord.floor_number ?? floorNum) : floorNum;
      for (const s of layoutSpaces) {
        await axios.post(`${API}/space`, {
          property_id: selectedPropertyId,
          floor_number: numToUse,
          floor_id: floorId,
          space_code: s.code,
          space_type: s.type || 'OFFICE',
          area: s.area_sqm,
          status: 'VACANT'
        });
      }
      const updated = await axios.get(`${API}/space?limit=500`);
      setSpaces(Array.isArray(updated.data.data) ? updated.data.data : []);
      setSelectedFloorNum(String(numToUse));
      fetchFloorPlanLayout(true);
      alert('Spaces created from layout. They now appear in the grid and under Property → Floors.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create spaces from layout');
    }
  };

  const handleDeleteFloor = async (floor) => {
    if (!window.confirm(`Delete "${floor.FLOOR_NAME || floor.floor_name || floor.FLOOR_ID}"? All spaces/units on this floor will be removed.`)) return;
    try {
      await axios.delete(`${API}/floors/${floor.FLOOR_ID || floor.floor_id}`);
      const [floorsRes, spacesRes] = await Promise.all([
        axios.get(`${API}/floors`),
        axios.get(`${API}/space?limit=500`)
      ]);
      setFloors(Array.isArray(floorsRes.data.data) ? floorsRes.data.data : []);
      setSpaces(Array.isArray(spacesRes.data.data) ? spacesRes.data.data : []);
      if (String(selectedFloorNum) === String(floor.FLOOR_NUMBER ?? floor.floor_number)) setSelectedFloorNum('');
      setSelectedUnit(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete floor');
    }
  };

  const handleDeleteSpace = async (space) => {
    const code = space.SPACE_CODE ?? space.space_code ?? 'this space';
    if (!window.confirm(`Delete "${code}"? This cannot be undone.`)) return;
    const id = String(space.SPACE_ID ?? space.space_id ?? '').trim();
    if (!id) return;
    try {
      await axios.delete(`${API}/space/${id}`);
      const updated = await axios.get(`${API}/space?limit=500`);
      setSpaces(Array.isArray(updated.data.data) ? updated.data.data : []);
      setSelectedUnit(null);
      fetchFloorPlanLayout(true);
    } catch (err) {
      const e = err.response?.data?.error;
      const msg = typeof e === 'string' ? e : (e?.message || err.response?.data?.message || err.message || 'Failed to delete space/unit');
      alert(msg);
    }
  };

  const handleAddSpaces = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId || !selectedFloorNum) {
      alert('Select a property and a floor first.');
      return;
    }
    const areaNum = formArea != null && formArea !== '' ? parseFloat(formArea) : NaN;
    if (isNaN(areaNum) || areaNum <= 0) {
      alert('Enter a valid Area (sqm).');
      return;
    }
    const count = Math.max(1, Math.min(50, Math.floor(Number(formCount)) || 1));
    const prefix = `F${selectedFloorNum}-${formCategory === 'UNIT' ? 'U' : 'S'}`;
    setSavingSpaces(true);
    try {
      for (let i = 1; i <= count; i++) {
        const code = `${prefix}-${i}`;
        await axios.post(`${API}/space`, {
          property_id: selectedPropertyId,
          PROPERTY_ID: selectedPropertyId,
          floor_number: Number(selectedFloorNum),
          space_code: code,
          space_type: formSpaceType,
          area: areaNum,
          status: formInitialStatus,
          category: formCategory,
          CATEGORY: formCategory
        });
      }
      const updated = await axios.get(`${API}/space?limit=500`);
      setSpaces(Array.isArray(updated.data.data) ? updated.data.data : []);
      setAddingSpace(false);
      setFormArea('');
      setFormCount(1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add space/unit');
    } finally {
      setSavingSpaces(false);
      fetchFloorPlanLayout(true);
    }
  };

  return (
    <div className="rw-all-records-content floors-page">
      <header className="floors-page__hero">
        <h1 className="floors-page__title">All Floors</h1>
        <p className="floors-page__subtitle">
          Add floors by form or upload a layout (PDF/DXF/image) for AI to suggest units. View booking status by property and floor.
        </p>
      </header>

      {/* Add floor – full form */}
      <section className="floors-page__card">
        <div className="floors-page__card-header">
          <h2 className="floors-page__card-title">Add floor</h2>
          {!addingFloor ? (
            <button type="button" className="rw-button rw-button-primary" onClick={() => setAddingFloor(true)}>+ Add floor</button>
          ) : (
            <button type="button" className="rw-button rw-button-secondary" onClick={() => { setAddingFloor(false); setFormFloorName(''); setFormFloorNumber(''); setFormDescription(''); setFormFloorPlanUrl(''); }}>Cancel</button>
          )}
        </div>
        {addingFloor && (
          <div className="floors-page__card-body">
            <form onSubmit={handleAddFloor}>
              <div className="floors-page__form-row">
                <div className="rw-form-group">
                  <label className="rw-label">Property *</label>
                  <select
                    className="rw-select"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required
                  >
                    <option value="">Select property</option>
                    {properties.map(p => (
                      <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID || p.property_id}>{p.PROPERTY_NAME || p.property_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="floors-page__form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="rw-form-group">
                  <label className="rw-label">Floor number</label>
                  <input
                    type="number"
                    className="rw-input"
                    placeholder="Auto if empty"
                    value={formFloorNumber}
                    onChange={(e) => setFormFloorNumber(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="rw-form-group">
                  <label className="rw-label">Floor name</label>
                  <input
                    type="text"
                    className="rw-input"
                    placeholder="e.g. Ground, Floor 1"
                    value={formFloorName}
                    onChange={(e) => setFormFloorName(e.target.value)}
                  />
                </div>
              </div>
              <div className="floors-page__form-row">
                <div className="rw-form-group">
                  <label className="rw-label">Description / notes</label>
                  <textarea
                    className="rw-input"
                    placeholder="Optional notes for this floor"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="floors-page__form-row">
                <div className="rw-form-group">
                  <label className="rw-label">Floor plan image URL</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="rw-input"
                      placeholder="/uploads/floor/... or full URL"
                      value={formFloorPlanUrl}
                      onChange={(e) => setFormFloorPlanUrl(e.target.value)}
                      style={{ flex: '1 1 200px' }}
                    />
                    <label className="rw-button rw-button-secondary" style={{ margin: 0, cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFloorImageUpload} disabled={uploadingImage} />
                      {uploadingImage ? 'Uploading...' : 'Upload image'}
                    </label>
                  </div>
                </div>
              </div>
              <div className="floors-page__form-actions">
                <button type="submit" className="rw-button rw-button-primary" disabled={savingFloor}>{savingFloor ? 'Saving...' : 'Save floor'}</button>
                <button type="button" className="rw-button rw-button-secondary" onClick={() => { setAddingFloor(false); setFormFloorName(''); setFormFloorNumber(''); setFormDescription(''); setFormFloorPlanUrl(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Floors list for selected property */}
      <section className="floors-page__card">
        <div className="floors-page__card-header">
          <h2 className="floors-page__card-title">Floors in this property</h2>
        </div>
        <div className="floors-page__card-body">
          <div className="floors-page__toolbar">
            <div className="rw-form-group">
              <label className="rw-label">Property</label>
              <select
                className="rw-select"
                value={selectedPropertyId}
                onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedFloorNum(''); setSelectedUnit(null); }}
                style={{ minWidth: '240px' }}
              >
                <option value="">Select property</option>
                {properties.map(p => (
                  <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID || p.property_id}>{p.PROPERTY_NAME || p.property_name}</option>
                ))}
              </select>
            </div>
          </div>
          {propertyFloors.length === 0 ? (
            <div className="floors-page__empty">No floors yet. Add one above.</div>
          ) : (
            <div className="floors-page__table-wrap">
              <table className="floors-page__table">
                <thead>
                  <tr>
                    <th>Floor #</th>
                    <th>Name</th>
                    <th>Plan</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyFloors.map(f => (
                    <tr key={f.FLOOR_ID || f.floor_id}>
                      <td className="rw-code">{f.FLOOR_NUMBER ?? f.floor_number}</td>
                      <td>{f.FLOOR_NAME || f.floor_name || '—'}</td>
                      <td>{(f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url) ? <a href={f.FLOOR_PLAN_IMAGE_URL || f.floor_plan_image_url} target="_blank" rel="noopener noreferrer" className="rw-link">View</a> : '—'}</td>
                      <td>
                        <span className="floors-page__btn-group">
                          <button type="button" className="rw-button rw-button-secondary floors-page__btn-sm" onClick={() => setSelectedFloorNum(String(f.FLOOR_NUMBER ?? f.floor_number))}>View</button>
                          <button type="button" className="rw-button rw-button-secondary floors-page__btn-sm" onClick={() => handleDeleteFloor(f)}>Delete</button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Select floor & upload layout */}
      <section className="floors-page__card">
        <div className="floors-page__card-header">
          <h2 className="floors-page__card-title">View map & upload layout (AI)</h2>
        </div>
        <div className="floors-page__card-body">
          <div className="floors-page__toolbar">
            <div className="rw-form-group">
              <label className="rw-label">Property</label>
              <select className="rw-select" value={selectedPropertyId} onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedFloorNum(''); }} style={{ minWidth: '200px' }}>
                <option value="">Select property</option>
                {properties.map(p => (
                  <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID || p.property_id}>{p.PROPERTY_NAME || p.property_name}</option>
                ))}
              </select>
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Floor</label>
              <select className="rw-select" value={selectedFloorNum} onChange={(e) => { setSelectedFloorNum(e.target.value); setSelectedUnit(null); }} style={{ minWidth: '160px' }}>
                <option value="">All floors</option>
                {propertyFloors.map(f => (
                  <option key={f.FLOOR_ID || f.floor_id} value={f.FLOOR_NUMBER ?? f.floor_number}>{f.FLOOR_NAME || f.floor_name || `Floor ${f.FLOOR_NUMBER ?? f.floor_number}`}</option>
                ))}
                {selectedPropertyId && [...new Set(floorNumbersFromSpaces)].sort((a, b) => (Number(a) || 0) - (Number(b) || 0)).filter(n => !propertyFloors.some(f => String(f.FLOOR_NUMBER ?? f.floor_number) === n)).map(n => (
                  <option key={`space-${n}`} value={n}>Floor {n}</option>
                ))}
              </select>
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Upload layout</label>
              <label className="rw-button rw-button-secondary" style={{ margin: 0, cursor: uploadingLayout || !selectedPropertyId || !selectedFloorNum ? 'not-allowed' : 'pointer', display: 'inline-block' }}>
                <input type="file" accept=".pdf,.dxf,.dwg,.jpg,.jpeg,.png,.gif,.webp" onChange={handleUploadLayout} disabled={uploadingLayout || !selectedPropertyId || !selectedFloorNum} style={{ display: 'none' }} />
                {uploadingLayout ? 'Analyzing...' : 'Upload layout (AI)'}
              </label>
            </div>
          </div>
          {uploadLayoutError && (
            <div className="floors-page__alert floors-page__alert--error">{uploadLayoutError}</div>
          )}
          <p className="floors-page__hint">Select property and floor, then upload a PDF, DXF, or image. AI will suggest units and a diagram; you can then create spaces from the layout.</p>
        </div>
      </section>

      {/* Add space or unit for this floor */}
      {selectedPropertyId && selectedFloorNum && (
        <section className="floors-page__card">
          <div className="floors-page__card-header">
            <h2 className="floors-page__card-title">Add space or unit</h2>
            {!addingSpace ? (
              <button type="button" className="rw-button rw-button-primary" onClick={() => setAddingSpace(true)}>+ Add space / unit</button>
            ) : (
              <button type="button" className="rw-button rw-button-secondary" onClick={() => { setAddingSpace(false); setFormArea(''); setFormCount(1); }}>Cancel</button>
            )}
          </div>
          {addingSpace && (
            <div className="floors-page__card-body">
              <form onSubmit={handleAddSpaces}>
                <div className="floors-page__form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="rw-form-group">
                    <label className="rw-label">Category</label>
                    <select className="rw-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                      <option value="SPACE">Space</option>
                      <option value="UNIT">Unit</option>
                    </select>
                  </div>
                  <div className="rw-form-group">
                    <label className="rw-label">Type</label>
                    <select className="rw-select" value={formSpaceType} onChange={(e) => setFormSpaceType(e.target.value)}>
                      {SPACE_TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                </div>
                <div className="floors-page__form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="rw-form-group">
                    <label className="rw-label">Area (sqm) *</label>
                    <input type="number" className="rw-input" placeholder="e.g. 50" min="0.01" step="0.01" value={formArea} onChange={(e) => setFormArea(e.target.value)} required />
                  </div>
                  <div className="rw-form-group">
                    <label className="rw-label">Count</label>
                    <input type="number" className="rw-input" min={1} max={50} value={formCount} onChange={(e) => { const v = e.target.value === '' ? 1 : Math.min(50, Math.max(1, Math.floor(Number(e.target.value)))); setFormCount(v); }} />
                  </div>
                </div>
                <div className="floors-page__form-row">
                  <div className="rw-form-group">
                    <label className="rw-label">Initial status</label>
                    <select className="rw-select" value={formInitialStatus} onChange={(e) => setFormInitialStatus(e.target.value)}>
                      {INITIAL_STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
                <div className="floors-page__form-actions">
                  <button type="submit" className="rw-button rw-button-primary" disabled={savingSpaces}>{savingSpaces ? 'Adding…' : 'Add'}</button>
                  <button type="button" className="rw-button rw-button-secondary" onClick={() => { setAddingSpace(false); setFormArea(''); setFormCount(1); }}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      <section className="floors-page__card">
        <div className="floors-page__card-header">
          <h2 className="floors-page__card-title">
            {selectedProperty ? (selectedProperty.PROPERTY_NAME || selectedProperty.property_name) : 'Select property'} – {selectedFloorNum ? `Floor ${selectedFloorNum}` : 'All floors'}
          </h2>
        </div>
        <div className="floors-page__card-body">
          <FloorLayout
            spaces={floorSpaces}
            selectedSpaceId={selectedUnit ? (selectedUnit.SPACE_ID || selectedUnit.space_id) : null}
            onSelectSpace={setSelectedUnit}
            selectableStatuses={['VACANT', 'RESERVED', 'OCCUPIED', 'LEASED']}
            showLegend={true}
            columns={gridCols}
            compact={false}
            emptyMessage="No spaces or units on this floor. Add them above or via Space Management."
          />
        </div>
      </section>

      {selectedPropertyId && selectedFloorNum && (
        <section className="floors-page__card">
          <div className="floors-page__card-header">
            <h2 className="floors-page__card-title">Interactive floor plan (persisted)</h2>
            <span className="floors-page__btn-group">
              <button type="button" className="rw-button rw-button-secondary" onClick={() => fetchFloorPlanLayout()} disabled={floorPlanLayoutLoading}>
                {floorPlanLayoutLoading ? 'Loading…' : 'Refresh'}
              </button>
              <button type="button" className="rw-button rw-button-secondary" onClick={() => fetchFloorPlanLayout(true)} disabled={floorPlanLayoutLoading}>
                Regenerate layout
              </button>
            </span>
          </div>
          <div className="floors-page__card-body">
            {floorPlanLayoutLoading ? (
              <p className="floors-page__hint">Loading layout…</p>
            ) : floorPlanLayout?.layout?.length > 0 ? (
              <>
                <FloorPlanViewer
                  layout={floorPlanLayout}
                  mode="admin"
                  onSelectBlock={(block) => {
                    const match = floorSpaces.find((s) => (s.SPACE_ID || s.space_id) === block.id);
                    setSelectedUnit(match || null);
                  }}
                  width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 80 : 800)}
                  height={480}
                  selectableStatuses={['VACANT', 'RESERVED', 'OCCUPIED', 'LEASED']}
                />
                <p className="floors-page__hint" style={{ marginTop: 8 }}>
                  Layout is saved and will persist on refresh. Click a block to view details. Regenerate when you add/remove units or spaces.
                </p>
              </>
            ) : (
              <p className="floors-page__hint">Add units and spaces for this floor above; then the diagram will appear and persist.</p>
            )}
          </div>
        </section>
      )}

      {selectedPropertyId && selectedFloorNum && (
        <section className="floors-page__card">
          <div className="floors-page__card-header">
            <h2 className="floors-page__card-title">AI generated floor plan diagram (from spaces/units)</h2>
            <button
              type="button"
              className="rw-button rw-button-primary"
              disabled={generatingAiDiagram || primaryPlanSpaces.length === 0}
              onClick={handleGenerateAiDiagram}
            >
              {generatingAiDiagram ? 'Generating with OpenAI...' : 'Create with OpenAI'}
            </button>
          </div>
          <div className="floors-page__card-body">
            {primaryPlanSpaces.length === 0 ? (
              <p className="floors-page__hint" style={{ marginTop: 0 }}>
                Add spaces/units for this floor first. Diagram is generated automatically from created area sizes.
              </p>
            ) : (
              <>
                {aiDiagramError && (
                  <div className="floors-page__alert floors-page__alert--error" style={{ marginTop: 0, marginBottom: '10px' }}>
                    {aiDiagramError}
                  </div>
                )}
                <div className="floors-page__ai-plan">
                  <div className="floors-page__ai-plan-core">
                    <div className="floors-page__ai-plan-core-label">{aiDiagram?.center?.title || 'ELEV'}</div>
                    <div className="floors-page__ai-plan-core-sub">{aiDiagram?.center?.subtitle || 'RESTROOMS'}</div>
                  </div>
                  {primaryPlanSpaces.map((space, idx) => {
                    const aiRoom = aiDiagram?.rooms?.[idx];
                    const p = aiRoom
                      ? {
                          left: `${Math.max(0, Math.min(98, Number(aiRoom.left) || 0))}%`,
                          top: `${Math.max(0, Math.min(98, Number(aiRoom.top) || 0))}%`,
                          width: `${Math.max(8, Math.min(98, Number(aiRoom.width) || 20))}%`,
                          height: `${Math.max(8, Math.min(98, Number(aiRoom.height) || 20))}%`,
                          bg: aiRoom.color || '#ececec'
                        }
                      : getCardinalPlanPosition(idx);
                    const sid = space.SPACE_ID || space.space_id;
                    const selected = selectedUnit && (selectedUnit.SPACE_ID || selectedUnit.space_id) === sid;
                    const code = space.SPACE_CODE || space.space_code || `Unit ${idx + 1}`;
                    return (
                      <button
                        type="button"
                        key={sid || `${code}-${idx}`}
                        className={`floors-page__ai-room ${selected ? 'floors-page__ai-room--selected' : ''}`}
                        style={{ left: p.left, top: p.top, width: p.width, height: p.height, background: p.bg }}
                        onClick={() => setSelectedUnit(space)}
                        title={`Select ${code}`}
                      >
                        <span className="floors-page__ai-room-area">{aiRoom?.area_label || formatAreaForDiagram(space)}</span>
                        <span className="floors-page__ai-room-code rw-code">{code}</span>
                      </button>
                    );
                  })}
                </div>
                {overflowPlanSpaces.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <h3 className="floors-page__section-title">Additional spaces on this floor</h3>
                    <div className="floors-page__legend">
                      {overflowPlanSpaces.map((s, idx) => {
                        const sid = s.SPACE_ID || s.space_id;
                        const code = s.SPACE_CODE || s.space_code || `Space ${idx + 5}`;
                        return (
                          <button
                            type="button"
                            key={sid || `${code}-${idx}`}
                            className="rw-button rw-button-secondary floors-page__btn-sm"
                            onClick={() => setSelectedUnit(s)}
                          >
                            {code} · {formatAreaForDiagram(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="floors-page__hint">
                  This plan is generated dynamically from the spaces/units created by admin for this floor. Click any block to open its details.
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {layoutSpaces.length > 0 && (
        <section className="floors-page__card">
          <div className="floors-page__card-header">
            <h2 className="floors-page__card-title">AI layout diagram & suggested units</h2>
            <button
              type="button"
              className="rw-button rw-button-primary"
              onClick={handleCreateSpacesFromLayout}
              disabled={!selectedPropertyId || !selectedFloorNum}
            >
              Create spaces from layout
            </button>
          </div>
          <div className="floors-page__card-body">
            {layoutMessage && (
              <p className="floors-page__hint" style={{ marginTop: 0 }}>{layoutMessage}</p>
            )}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px' }}>
                <div className="floors-page__layout-diagram">
                  {layoutDiagram ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${layoutDiagram.cols}, minmax(60px, 1fr))`,
                        gap: '8px'
                      }}
                    >
                      {layoutSpaces.map((s, idx) => (
                        <div
                          key={`${s.code}-${idx}`}
                          style={{
                            borderRadius: '4px',
                            border: '1px solid var(--floors-border)',
                            background: 'var(--gray-100)',
                            padding: '8px',
                            fontSize: '11px'
                          }}
                        >
                          <div className="rw-code" style={{ marginBottom: '2px' }}>{s.code}</div>
                          <div>{s.type}</div>
                          <div style={{ color: 'var(--floors-text-muted)' }}>{s.area_sqm ? `${s.area_sqm} sqm` : ''}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="floors-page__hint">Upload a layout for this floor to see the diagram.</p>
                  )}
                </div>
              </div>
              <div style={{ flex: '1 1 260px' }}>
                <h3 className="floors-page__section-title">Suggested spaces & units</h3>
                <div className="floors-page__table-wrap">
                  <table className="floors-page__table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Area (sqm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layoutSpaces.map((s, idx) => (
                        <tr key={`${s.code}-${idx}`}>
                          <td className="rw-code">{s.code}</td>
                          <td>{s.type}</td>
                          <td>{s.area_sqm ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {layoutPreview && (
                <div style={{ flex: '1 1 260px' }}>
                  <h3 className="floors-page__section-title">Uploaded layout preview</h3>
                  <a href={layoutPreview} target="_blank" rel="noopener noreferrer" className="rw-link" style={{ fontSize: '0.8125rem' }}>
                    Open original layout
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedUnit && (
        <section className="floors-page__card">
          <div className="floors-page__card-header">
            <h2 className="floors-page__card-title">Unit details</h2>
            <span className="floors-page__btn-group">
              <button type="button" className="rw-button rw-button-secondary" onClick={() => setSelectedUnit(null)}>Close</button>
              <button type="button" className="rw-button rw-button-secondary" style={{ color: 'var(--rw-error, #c62828)' }} onClick={() => handleDeleteSpace(selectedUnit)}>Delete</button>
            </span>
          </div>
          <div className="floors-page__card-body">
            <dl className="floors-page__detail-list">
              <dt>Code</dt><dd className="rw-code">{selectedUnit.SPACE_CODE || selectedUnit.space_code}</dd>
              <dt>Category</dt><dd>{selectedUnit.CATEGORY || selectedUnit.category || (String(selectedUnit.SPACE_CODE || selectedUnit.space_code || '').includes('-U-') ? 'Unit' : 'Space')}</dd>
              <dt>Type</dt><dd>{selectedUnit.SPACE_TYPE || selectedUnit.space_type}</dd>
              <dt>Floor</dt><dd>{selectedUnit.FLOOR ?? selectedUnit.floor_number}</dd>
              <dt>Property</dt><dd>{getPropertyNameForSpace(selectedUnit)}</dd>
              <dt>Area</dt><dd>{(selectedUnit.AREA || selectedUnit.area) ? `${selectedUnit.AREA || selectedUnit.area} sqm` : '—'}</dd>
              <dt>Price</dt><dd>{(selectedUnit.LIST_PRICE ?? selectedUnit.list_price) != null ? Number(selectedUnit.LIST_PRICE ?? selectedUnit.list_price).toLocaleString() : '—'}</dd>
              <dt>Status</dt><dd><span className={`rw-badge rw-badge-${(selectedUnit.STATUS || selectedUnit.occupancy_status) === 'OCCUPIED' ? 'success' : 'warning'}`}>{selectedUnit.STATUS || selectedUnit.occupancy_status}</span></dd>
            </dl>
          </div>
        </section>
      )}

      {floorSpaces.length > 0 && (
        <div className="floors-page__kpi-row">
          <div className="floors-page__kpi">
            <div className="floors-page__kpi-label">Total Area</div>
            <div className="floors-page__kpi-value">{totalArea.toLocaleString()} sqm</div>
          </div>
          <div className="floors-page__kpi">
            <div className="floors-page__kpi-label">Occupied</div>
            <div className="floors-page__kpi-value">{occupiedArea.toLocaleString()} sqm</div>
            <div className="floors-page__kpi-sub">{totalArea ? ((occupiedArea / totalArea) * 100).toFixed(0) : 0}%</div>
          </div>
          <div className="floors-page__kpi">
            <div className="floors-page__kpi-label">Units</div>
            <div className="floors-page__kpi-value">{floorSpaces.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloorPlans;
