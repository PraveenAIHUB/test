import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import FloorLayout from '../space/FloorLayout';
import FloorPlanViewer, { SQFT_TO_SQM as SQFT_TO_SQM_VIEWER } from '../space/FloorPlanViewer';

const API = API_URL;
const SQFT_TO_SQM = 0.09290304;
const PLAN_UNITS = [
  { code: 'PLAN-A', label: '300 SQT', areaSqft: 300, left: 0, top: 0, width: 48, height: 40, color: '#f7efb5' },
  { code: 'PLAN-B', label: '400 SQT', areaSqft: 400, left: 52, top: 0, width: 48, height: 40, color: '#f8d9b9' },
  { code: 'PLAN-C', label: '400 SQT', areaSqft: 400, left: 0, top: 44, width: 48, height: 56, color: '#dbe9f8' },
  { code: 'PLAN-D', label: '500 SQT', areaSqft: 500, left: 52, top: 44, width: 48, height: 56, color: '#dbf2cf' }
];

export default function BrowseAndRequest() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedFloorNum, setSelectedFloorNum] = useState('');
  const [selectedSpaceIds, setSelectedSpaceIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Custom space (when floor has no units): area and optional dimensions
  const [customAreaSqft, setCustomAreaSqft] = useState('');
  const [customLengthFt, setCustomLengthFt] = useState('');
  const [customWidthFt, setCustomWidthFt] = useState('');
  const [unitTypePreference, setUnitTypePreference] = useState('');

  const [loadError, setLoadError] = useState('');

  const [requestMode, setRequestMode] = useState('SPACE'); // 'SPACE' | 'ROOMS'
  const [requestType, setRequestType] = useState('LEASE'); // LEASE | RENT
  const [leaseType, setLeaseType] = useState('COMMERCIAL');
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [preferredEndDate, setPreferredEndDate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [budgetOrRentNotes, setBudgetOrRentNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [roomRequestType, setRoomRequestType] = useState('MEETING_ROOM');
  const [roomDateFrom, setRoomDateFrom] = useState('');
  const [roomDateTo, setRoomDateTo] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [capacity, setCapacity] = useState('');
  const [amenitiesRequired, setAmenitiesRequired] = useState('');
  const [roomNotes, setRoomNotes] = useState('');
  const [selectedPlanUnitCodes, setSelectedPlanUnitCodes] = useState([]);
  const [snipRect, setSnipRect] = useState(null);
  const [snipAreaSqft, setSnipAreaSqft] = useState(0);
  const [snipping, setSnipping] = useState(false);
  const snipStartRef = useRef(null);
  const planRef = useRef(null);
  const [floorPlanLayout, setFloorPlanLayout] = useState(null);
  const [floorPlanLayoutLoading, setFloorPlanLayoutLoading] = useState(false);
  const [canvasSelectedUnitIds, setCanvasSelectedUnitIds] = useState([]);
  const [canvasSelectedSpaces, setCanvasSelectedSpaces] = useState([]);

  useEffect(() => {
    setLoadError('');
    Promise.all([
      axios.get(API + '/properties').catch((e) => e.response || e),
      axios.get(API + '/floors').catch((e) => e.response || e),
      axios.get(API + '/space?limit=500').catch((e) => e.response || e)
    ]).then(([p, f, s]) => {
      const toList = (res, key) => {
        if (!res || !res.data) return [];
        const raw = res.data?.data ?? res.data;
        return Array.isArray(raw) ? raw : [];
      };
      setProperties(toList(p, 'data'));
      setFloors(toList(f, 'data'));
      setSpaces(toList(s, 'data'));
      const failed = [p?.status === 200 ? null : 'properties', f?.status === 200 ? null : 'floors', s?.status === 200 ? null : 'space'].filter(Boolean);
      if (failed.length) setLoadError('Could not load ' + failed.join(', ') + '. Please refresh.');
      setLoading(false);
    }).catch(() => {
      setLoadError('Could not load data. Check your connection and try again.');
      setLoading(false);
    });
  }, []);

  const selPropId = selectedPropertyId != null ? String(selectedPropertyId).trim() : '';
  const selFloorNum = selectedFloorNum != null ? String(selectedFloorNum).trim() : '';

  const propertyFloors = floors.filter(f => String(f.PROPERTY_ID || f.property_id || '') === selPropId);
  const floorNumbersFromSpaces = selPropId
    ? [...new Set(spaces.filter(s => String(s.PROPERTY_ID || s.property_id || '') === selPropId).map(s => s.FLOOR ?? s.floor_number).filter((v) => v != null && v !== ''))]
    : [];
  const floorSpaces = spaces.filter(s => {
    const pid = String(s.PROPERTY_ID || s.property_id || '');
    const fn = s.FLOOR ?? s.floor_number;
    return pid === selPropId && (selFloorNum === '' || String(fn) === selFloorNum);
  });
  const floorHasUnits = floorSpaces.length > 0;
  const floorSelected = !!selPropId && !!selFloorNum;

  useEffect(() => {
    if (!selPropId || !selFloorNum) {
      setFloorPlanLayout(null);
      setCanvasSelectedUnitIds([]);
      setCanvasSelectedSpaces([]);
      return;
    }
    setFloorPlanLayoutLoading(true);
    axios.get(`${API}/floors/floor-plan`, { params: { property_id: selPropId, floor_number: selFloorNum } })
      .then((r) => setFloorPlanLayout(r.data?.data || null))
      .catch(() => setFloorPlanLayout(null))
      .finally(() => setFloorPlanLayoutLoading(false));
  }, [selPropId, selFloorNum]);

  const toggleSpace = (spaceId) => {
    setSelectedSpaceIds(prev => prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]);
  };

  // Suggested area from length × width (sq ft)
  const suggestedSqft = (customLengthFt && customWidthFt) ? (parseFloat(customLengthFt) * parseFloat(customWidthFt)).toFixed(1) : '';

  const hasCustomArea = !!(customAreaSqft.trim() || suggestedSqft) && parseFloat(customAreaSqft.trim() || suggestedSqft) > 0;
  const selectedPlanUnits = useMemo(
    () => PLAN_UNITS.filter((u) => selectedPlanUnitCodes.includes(u.code)),
    [selectedPlanUnitCodes]
  );
  const selectedPlanAreaSqft = selectedPlanUnits.reduce((sum, u) => sum + u.areaSqft, 0);
  const snipAreaSqm = Math.round(snipAreaSqft * SQFT_TO_SQM * 100) / 100;
  const effectiveCustomSqft = parseFloat(customAreaSqft.trim() || suggestedSqft || '0') || 0;
  const derivedAreaSqft = Math.max(0, effectiveCustomSqft, snipAreaSqft, selectedPlanAreaSqft);
  const hasSnipOrPlanArea = derivedAreaSqft > 0;
  const hasCanvasSelection = canvasSelectedUnitIds.length > 0 || canvasSelectedSpaces.length > 0;
  const canSubmitSpace = selectedSpaceIds.length > 0 || hasCustomArea || hasSnipOrPlanArea || hasCanvasSelection;
  const partialSelections = canvasSelectedSpaces.filter((s) => !s.full && s.area_sqft > 0);
  const totalCanvasAreaSqft = useMemo(() => {
    const layout = floorPlanLayout?.layout || [];
    const unitArea = layout.filter((b) => canvasSelectedUnitIds.includes(b.id)).reduce((s, b) => s + (b.size || 0), 0);
    const fullSpaceArea = canvasSelectedSpaces.filter((s) => s.full).reduce((s, x) => {
      const block = layout.find((b) => b.id === x.spaceId);
      return s + (block?.size || x.area_sqft || 0);
    }, 0);
    const partialArea = canvasSelectedSpaces.filter((s) => !s.full && s.area_sqft > 0).reduce((s, x) => s + (x.area_sqft || 0), 0);
    return unitArea + fullSpaceArea + partialArea;
  }, [floorPlanLayout, canvasSelectedUnitIds, canvasSelectedSpaces]);
  const suggestedLeaseSqft = totalCanvasAreaSqft || derivedAreaSqft || (hasCustomArea ? parseFloat(customAreaSqft.trim() || suggestedSqft) : 0);

  const clearPlanSelection = () => {
    setSelectedPlanUnitCodes([]);
    setSnipRect(null);
    setSnipAreaSqft(0);
    setSnipping(false);
    snipStartRef.current = null;
  };

  const calculateSnipAreaSqft = (rect, planBounds) => {
    if (!rect || !planBounds.width || !planBounds.height) return 0;
    let total = 0;
    for (const unit of PLAN_UNITS) {
      const unitPx = {
        left: (unit.left / 100) * planBounds.width,
        top: (unit.top / 100) * planBounds.height,
        width: (unit.width / 100) * planBounds.width,
        height: (unit.height / 100) * planBounds.height
      };
      const ix = Math.max(0, Math.min(rect.x + rect.width, unitPx.left + unitPx.width) - Math.max(rect.x, unitPx.left));
      const iy = Math.max(0, Math.min(rect.y + rect.height, unitPx.top + unitPx.height) - Math.max(rect.y, unitPx.top));
      const intersection = ix * iy;
      const unitTotal = unitPx.width * unitPx.height;
      if (intersection > 0 && unitTotal > 0) {
        total += unit.areaSqft * (intersection / unitTotal);
      }
    }
    return Math.round(total * 10) / 10;
  };

  const handlePlanMouseDown = (e) => {
    const bounds = planRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const y = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height));
    snipStartRef.current = { x, y };
    setSnipping(true);
    setSnipRect({ x, y, width: 0, height: 0 });
    setSnipAreaSqft(0);
  };

  const handlePlanMouseMove = (e) => {
    if (!snipping || !snipStartRef.current) return;
    const bounds = planRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x2 = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const y2 = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height));
    const x = Math.min(snipStartRef.current.x, x2);
    const y = Math.min(snipStartRef.current.y, y2);
    const width = Math.abs(x2 - snipStartRef.current.x);
    const height = Math.abs(y2 - snipStartRef.current.y);
    const rect = { x, y, width, height };
    setSnipRect(rect);
    setSnipAreaSqft(calculateSnipAreaSqft(rect, bounds));
  };

  const handlePlanMouseUp = () => {
    setSnipping(false);
    snipStartRef.current = null;
  };

  const togglePlanUnit = (code) => {
    setSelectedPlanUnitCodes((prev) => (
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    ));
  };

  const handleSubmitRequest = async () => {
    if (!selPropId) {
      alert('Please select a property.');
      return;
    }
    if (!canSubmitSpace) {
      alert('Select one or more units/spaces from the layout, or enter your required space size below.');
      return;
    }

    setSubmitting(true);
    try {
      const floorId = propertyFloors.find(f => (f.FLOOR_NUMBER ?? f.floor_number) == selectedFloorNum)?.FLOOR_ID || null;
      const allSpaceIds = [...new Set([
        ...selectedSpaceIds,
        ...canvasSelectedUnitIds,
        ...canvasSelectedSpaces.map((s) => s.spaceId)
      ])];
      const partialAreaSqm = canvasSelectedSpaces.filter((s) => !s.full && s.area_sqft > 0).reduce((sum, s) => sum + (s.area_sqft || 0) * SQFT_TO_SQM, 0);
      const customAreaSqmVal = hasCustomArea ? parseFloat(customAreaSqft.trim() || suggestedSqft) * SQFT_TO_SQM : null;
      const canvasTotalSqm = totalCanvasAreaSqft > 0 ? Math.round(totalCanvasAreaSqft * SQFT_TO_SQM * 100) / 100 : null;
      const requested_area_sqm = (canvasTotalSqm ?? (partialAreaSqm > 0 ? Math.round(partialAreaSqm * 100) / 100 : null) ?? (customAreaSqmVal != null && customAreaSqmVal > 0 ? Math.round(customAreaSqmVal * 100) / 100 : undefined)) ?? undefined;
      const selection_details = (floorId && (canvasSelectedUnitIds.length > 0 || canvasSelectedSpaces.length > 0)) ? {
        floorId,
        selections: [
          ...canvasSelectedUnitIds.map((id) => ({ type: 'unit', id, selectionMode: 'full' })),
          ...canvasSelectedSpaces.map((s) => ({
            type: 'space',
            id: s.spaceId,
            selectionMode: s.full ? 'full' : 'partial',
            coordinates: s.coordinates || undefined,
            calculatedArea: s.full ? undefined : s.area_sqft,
            dimensions: s.dimensions || undefined
          }))
        ]
      } : null;
      const detailNotes = [
        notes,
        customLengthFt && customWidthFt ? `Dimensions: ${customLengthFt} ft × ${customWidthFt} ft` : '',
        unitTypePreference ? `Type: ${unitTypePreference}` : '',
        partialSelections.length ? `Partial: ${partialSelections.map((s) => `~${s.area_sqft} sqft`).join(', ')}` : ''
      ].filter(Boolean).join('. ');
      await axios.post(API + '/lease-requests', {
        property_id: selPropId,
        floor_id: floorId,
        request_type: requestType,
        lease_type: leaseType || undefined,
        preferred_start_date: preferredStartDate || undefined,
        preferred_end_date: preferredEndDate || undefined,
        term_months: termMonths ? Number(termMonths) : undefined,
        budget_or_rent_notes: budgetOrRentNotes || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        notes: detailNotes || notes || undefined,
        space_ids: allSpaceIds,
        selection_type: allSpaceIds.length ? (requested_area_sqm ? 'UNITS_AND_AREA' : 'UNITS') : 'CUSTOM_AREA',
        requested_area_sqm: requested_area_sqm || undefined,
        unit_type_preference: unitTypePreference || undefined,
        selection_details
      });
      alert('Lease request submitted. Admin will review it.');
      setSelectedSpaceIds([]);
      setCanvasSelectedUnitIds([]);
      setCanvasSelectedSpaces([]);
      setNotes('');
      setCustomAreaSqft('');
      setCustomLengthFt('');
      setCustomWidthFt('');
      setUnitTypePreference('');
      clearPlanSelection();
      navigate('/my-lease-requests');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRoomRequest = async () => {
    if (!selPropId) {
      alert('Please select a property.');
      return;
    }
    if (!roomDateFrom || !roomDateTo) {
      alert('Please enter room booking date range.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(API + '/lease-requests', {
        property_id: selPropId,
        request_type: 'ROOMS',
        room_request_type: roomRequestType,
        room_date_from: roomDateFrom,
        room_date_to: roomDateTo,
        duration_hours: durationHours ? Number(durationHours) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        amenities_required: amenitiesRequired || undefined,
        room_notes: roomNotes || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        notes: roomNotes || undefined
      });
      alert('Room request submitted. Admin will review it.');
      setRoomDateFrom('');
      setRoomDateTo('');
      setDurationHours('');
      setCapacity('');
      setAmenitiesRequired('');
      setRoomNotes('');
      navigate('/my-lease-requests');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit room request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="rw-loading"><div className="rw-spinner" /> Loading...</div>;

  const floorOptions = propertyFloors.length > 0
    ? propertyFloors
    : floorNumbersFromSpaces.sort((a, b) => Number(a) - Number(b)).map((fn) => ({ FLOOR_NUMBER: fn, floor_number: fn, FLOOR_NAME: 'Floor ' + fn, floor_name: 'Floor ' + fn, FLOOR_ID: 'fn-' + fn, floor_id: 'fn-' + fn }));

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>Select Space / Request Room</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>
          Request commercial space (lease/rent) or book a meeting/conference room. Choose a property and complete the form.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button type="button" className={'rw-button ' + (requestMode === 'SPACE' ? 'rw-button-primary' : 'rw-button-secondary')} onClick={() => setRequestMode('SPACE')}>Space / Units</button>
        <button type="button" className={'rw-button ' + (requestMode === 'ROOMS' ? 'rw-button-primary' : 'rw-button-secondary')} onClick={() => setRequestMode('ROOMS')}>Request room</button>
      </div>
      {loadError && (
        <div className="rw-card" style={{ marginBottom: '16px', borderColor: 'var(--red-300)', background: 'var(--red-50)' }}>
          <div className="rw-card-body" style={{ color: 'var(--red-700)' }}>{loadError}</div>
        </div>
      )}
      {requestMode === 'ROOMS' ? (
        <div className="rw-card">
          <div className="rw-card-header"><h3 className="rw-chart-title">Request a room</h3></div>
          <div className="rw-card-body">
            <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
              <div className="rw-filter-group">
                <label>Property *</label>
                <select className="rw-select" value={selectedPropertyId ?? ''} onChange={(e) => setSelectedPropertyId(e.target.value)}>
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID ?? p.property_id ?? ''}>{p.PROPERTY_NAME || p.property_name || p.PROPERTY_ID || p.property_id}</option>
                  ))}
                </select>
              </div>
              <div className="rw-filter-group">
                <label>Room type</label>
                <select className="rw-select" value={roomRequestType} onChange={(e) => setRoomRequestType(e.target.value)}>
                  <option value="MEETING_ROOM">Meeting room</option>
                  <option value="CONFERENCE">Conference room</option>
                  <option value="TRAINING">Training room</option>
                  <option value="BOARD_ROOM">Board room</option>
                  <option value="EVENT_SPACE">Event space</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
              <div className="rw-form-group">
                <label className="rw-label">Date from *</label>
                <input type="date" className="rw-input" value={roomDateFrom} onChange={(e) => setRoomDateFrom(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Date to *</label>
                <input type="date" className="rw-input" value={roomDateTo} onChange={(e) => setRoomDateTo(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Duration (hours)</label>
                <input type="number" className="rw-input" min="0.5" step="0.5" placeholder="e.g. 2" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Capacity (persons)</label>
                <input type="number" className="rw-input" min="1" placeholder="e.g. 10" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>
            <div className="rw-form-group" style={{ marginBottom: '16px' }}>
              <label className="rw-label">Amenities required (e.g. projector, whiteboard, video)</label>
              <input type="text" className="rw-input" placeholder="Optional" value={amenitiesRequired} onChange={(e) => setAmenitiesRequired(e.target.value)} />
            </div>
            <div className="rw-form-group" style={{ marginBottom: '16px' }}>
              <label className="rw-label">Notes / purpose</label>
              <textarea className="rw-input" rows={2} value={roomNotes} onChange={(e) => setRoomNotes(e.target.value)} placeholder="e.g. Client meeting, weekly standup" />
            </div>
            <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
              <div className="rw-form-group">
                <label className="rw-label">Contact phone</label>
                <input type="text" className="rw-input" placeholder="Optional" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Contact email</label>
                <input type="email" className="rw-input" placeholder="Optional" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
            </div>
            <button type="button" className="rw-button rw-button-primary" onClick={handleSubmitRoomRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit room request'}
            </button>
          </div>
        </div>
      ) : (
      <>
      <div className="rw-filters-section" style={{ marginBottom: '24px' }}>
        <div className="rw-filters-grid">
          <div className="rw-filter-group">
            <label>Property</label>
            <select
              className="rw-select"
              value={selectedPropertyId ?? ''}
              onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedFloorNum(''); setSelectedSpaceIds([]); }}
            >
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.PROPERTY_ID || p.property_id} value={p.PROPERTY_ID ?? p.property_id ?? ''}>
                  {p.PROPERTY_NAME || p.property_name || p.PROPERTY_ID || p.property_id}
                </option>
              ))}
            </select>
          </div>
          <div className="rw-filter-group">
            <label>Floor</label>
            <select
              className="rw-select"
              value={selectedFloorNum ?? ''}
              onChange={(e) => { setSelectedFloorNum(e.target.value); setSelectedSpaceIds([]); }}
              disabled={!selPropId}
            >
              <option value="">Select floor</option>
              {floorOptions.map((f) => (
                <option key={f.FLOOR_ID || f.floor_id} value={f.FLOOR_NUMBER ?? f.floor_number ?? ''}>
                  {f.FLOOR_NAME || f.floor_name || 'Floor ' + (f.FLOOR_NUMBER ?? f.floor_number)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="rw-card">
        <div className="rw-card-header">
          <h3 className="rw-chart-title">Floor layout – units and spaces</h3>
          {(selectedSpaceIds.length > 0 || canvasSelectedUnitIds.length > 0 || canvasSelectedSpaces.length > 0) && (
            <span className="rw-badge rw-badge-primary">
              {selectedSpaceIds.length + canvasSelectedUnitIds.length + canvasSelectedSpaces.length} selected
            </span>
          )}
        </div>
        <div className="rw-card-body">
          {!floorSelected ? (
            <p style={{ color: 'var(--gray-500)' }}>Select a property and floor above.</p>
          ) : (
            <>
              {floorPlanLayoutLoading ? (
                <p style={{ color: 'var(--gray-500)' }}>Loading floor plan…</p>
              ) : floorPlanLayout?.layout?.length > 0 ? (
                <>
                  <FloorPlanViewer
                    layout={floorPlanLayout}
                    mode="user"
                    selectedUnitIds={canvasSelectedUnitIds}
                    selectedSpaces={canvasSelectedSpaces}
                    onSelectUnits={setCanvasSelectedUnitIds}
                    onSelectSpaces={setCanvasSelectedSpaces}
                    selectableStatuses={['VACANT']}
                    width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 80 : 800)}
                    height={500}
                  />
                  {hasCanvasSelection && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Selection summary</h4>
                      <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
                        <strong>Selected area:</strong> ~{totalCanvasAreaSqft.toFixed(0)} sq ft ({(totalCanvasAreaSqft * SQFT_TO_SQM).toFixed(1)} sq m)
                      </p>
                      {partialSelections.length > 0 && partialSelections.some((s) => s.dimensions) && (
                        <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
                          <strong>Dimensions:</strong>{' '}
                          {partialSelections.map((s) => s.dimensions && `${s.dimensions.length ?? '?'} ft × ${s.dimensions.width ?? '?'} ft`).filter(Boolean).join('; ') || '—'}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--primary-600)' }}>
                        <strong>Suggested lease size:</strong> {suggestedLeaseSqft.toFixed(0)} sq ft
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <FloorLayout
                  spaces={floorSpaces}
                  selectedSpaceIds={selectedSpaceIds}
                  onSelectSpace={(space) => toggleSpace(space.SPACE_ID || space.space_id)}
                  selectableStatuses={['VACANT']}
                  showLegend={true}
                  columns={4}
                  compact={false}
                  emptyMessage="No units or spaces on this floor. Draw your required space size below."
                />
              )}
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-200)' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>Draw your required space size</h4>
                <p style={{ marginBottom: '16px', color: 'var(--gray-600)', fontSize: '14px' }}>
                  Need a custom size? Enter length and width (or area) to define the space you need. You can select units/spaces above and add custom area in the same request.
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <div
                    ref={planRef}
                    onMouseDown={handlePlanMouseDown}
                    onMouseMove={handlePlanMouseMove}
                    onMouseUp={handlePlanMouseUp}
                    onMouseLeave={handlePlanMouseUp}
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '760px',
                      aspectRatio: '16 / 10',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      overflow: 'hidden',
                      userSelect: 'none',
                      cursor: 'crosshair'
                    }}
                  >
                    {PLAN_UNITS.map((unit) => {
                      const selected = selectedPlanUnitCodes.includes(unit.code);
                      return (
                        <button
                          key={unit.code}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlanUnit(unit.code);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${unit.left}%`,
                            top: `${unit.top}%`,
                            width: `${unit.width}%`,
                            height: `${unit.height}%`,
                            border: selected ? '2px solid #1f5fa5' : '1px solid #7f7f7f',
                            borderRadius: '6px',
                            background: unit.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#1f1f1f',
                            boxShadow: selected ? '0 0 0 2px rgba(31,95,165,0.2)' : 'none',
                            cursor: 'pointer'
                          }}
                          title={`Select ${unit.label} unit`}
                        >
                          {unit.label}
                        </button>
                      );
                    })}
                    {snipRect && (snipRect.width > 0 || snipRect.height > 0) && (
                      <div
                        style={{
                          position: 'absolute',
                          left: snipRect.x,
                          top: snipRect.y,
                          width: snipRect.width,
                          height: snipRect.height,
                          border: '2px dashed #C74634',
                          background: 'rgba(199, 70, 52, 0.15)',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    <span className="rw-badge rw-badge-primary">
                      Snip area: {snipAreaSqft.toFixed(1)} sq ft ({snipAreaSqm.toFixed(2)} sq m)
                    </span>
                    <span className="rw-badge rw-badge-secondary">
                      Plan units selected: {selectedPlanUnitCodes.length} ({selectedPlanAreaSqft.toFixed(1)} sq ft)
                    </span>
                    <button
                      type="button"
                      className="rw-button rw-button-secondary"
                      onClick={() => setCustomAreaSqft(String(Math.round(derivedAreaSqft * 10) / 10))}
                      disabled={derivedAreaSqft <= 0}
                    >
                      Use snip/plan area
                    </button>
                    <button
                      type="button"
                      className="rw-button rw-button-secondary"
                      onClick={clearPlanSelection}
                    >
                      Clear snip/plan
                    </button>
                  </div>
                  <p style={{ marginTop: '8px', marginBottom: 0, color: 'var(--gray-600)', fontSize: '13px' }}>
                    Drag freely over the diagram to snip any area and see sq m instantly. You can also click each unit block directly.
                  </p>
                </div>
                <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
                  <div className="rw-form-group">
                    <label className="rw-label">Length (ft)</label>
                    <input
                      type="number"
                      className="rw-input"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 50"
                      value={customLengthFt}
                      onChange={(e) => { setCustomLengthFt(e.target.value); }}
                    />
                  </div>
                  <div className="rw-form-group">
                    <label className="rw-label">Width (ft)</label>
                    <input
                      type="number"
                      className="rw-input"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 30"
                      value={customWidthFt}
                      onChange={(e) => setCustomWidthFt(e.target.value)}
                    />
                  </div>
                  <div className="rw-form-group">
                    <label className="rw-label">Required area (sq ft)</label>
                    <input
                      type="number"
                      className="rw-input"
                      min="1"
                      step="0.1"
                      placeholder={suggestedSqft ? `e.g. ${suggestedSqft} from dimensions` : 'e.g. 1500'}
                      value={customAreaSqft}
                      onChange={(e) => setCustomAreaSqft(e.target.value)}
                    />
                  </div>
                </div>
                {suggestedSqft && (
                  <p style={{ fontSize: '13px', color: 'var(--primary-600)', marginBottom: '12px' }}>
                    From dimensions: <strong>{suggestedSqft} sq ft</strong> (≈ {(parseFloat(suggestedSqft) * SQFT_TO_SQM).toFixed(1)} sq m). Copy to Required area if needed.
                  </p>
                )}
                <div className="rw-form-group" style={{ maxWidth: '280px' }}>
                  <label className="rw-label">Space type preference (optional)</label>
                  <select className="rw-select" value={unitTypePreference} onChange={(e) => setUnitTypePreference(e.target.value)}>
                    <option value="">Any</option>
                    <option value="OFFICE">Office</option>
                    <option value="RETAIL">Retail</option>
                    <option value="STORAGE">Storage</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {floorSelected && canSubmitSpace && (
        <div className="rw-card" style={{ marginTop: '24px' }}>
          <div className="rw-card-header"><h3 className="rw-chart-title">Submit lease / rent request</h3></div>
          <div className="rw-card-body">
            <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
              <div className="rw-form-group">
                <label className="rw-label">Request type</label>
                <select className="rw-select" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                  <option value="LEASE">Lease</option>
                  <option value="RENT">Rent</option>
                </select>
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Lease / space type</label>
                <select className="rw-select" value={leaseType} onChange={(e) => setLeaseType(e.target.value)}>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OFFICE">Office</option>
                  <option value="RETAIL">Retail</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Preferred start date</label>
                <input type="date" className="rw-input" value={preferredStartDate} onChange={(e) => setPreferredStartDate(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Preferred end date</label>
                <input type="date" className="rw-input" value={preferredEndDate} onChange={(e) => setPreferredEndDate(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Term (months)</label>
                <input type="number" className="rw-input" min="1" placeholder="e.g. 12" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
              </div>
            </div>
            <div className="rw-form-group" style={{ marginBottom: '16px' }}>
              <label className="rw-label">Budget / rent notes (optional)</label>
              <input type="text" className="rw-input" placeholder="e.g. budget range, preferred rent" value={budgetOrRentNotes} onChange={(e) => setBudgetOrRentNotes(e.target.value)} />
            </div>
            <div className="rw-filters-grid" style={{ marginBottom: '16px' }}>
              <div className="rw-form-group">
                <label className="rw-label">Contact phone</label>
                <input type="text" className="rw-input" placeholder="Optional" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
              <div className="rw-form-group">
                <label className="rw-label">Contact email</label>
                <input type="email" className="rw-input" placeholder="Optional" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
            </div>
            <div className="rw-form-group">
              <label className="rw-label">Notes (optional)</label>
              <textarea className="rw-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Message for admin (e.g. intended use, move-in date)" />
            </div>
            <button type="button" className="rw-button rw-button-primary" onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request to admin'}
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
