/**
 * Property Form Component
 * Create/Edit Property
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from './Modal';

// Fix default marker icon in bundlers (Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

/** Listens to map click and calls onMapClick(lat, lng) */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

/** Keeps map view in sync with center (e.g. after address search) */
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) map.flyTo(center, map.getZoom(), { duration: 0.5 });
  }, [map, center]);
  return null;
}

/** Google Maps for location picker - used when GOOGLE_MAPS_API_KEY is set */
function GoogleMapPicker({ center, markerPosition, onMapClick, style }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps || !divRef.current) return;
    const [lat, lng] = center && center[0] != null && center[1] != null ? center : [-1.2921, 36.8219];
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(divRef.current, {
        center: { lat, lng },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      });
      mapRef.current.addListener('click', (e) => {
        const latLng = e.latLng;
        if (latLng) onMapClick(latLng.lat(), latLng.lng());
      });
    }
    return () => {};
  }, [onMapClick]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    const [lat, lng] = center && center[0] != null && center[1] != null ? center : [-1.2921, 36.8219];
    mapRef.current.panTo({ lat, lng });
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (markerRef.current) markerRef.current.setMap(null);
    if (markerPosition && markerPosition[0] != null && markerPosition[1] != null) {
      const marker = new window.google.maps.Marker({
        position: { lat: markerPosition[0], lng: markerPosition[1] },
        map: mapRef.current
      });
      marker.addListener('click', () => {
        onMapClick(markerPosition[0], markerPosition[1]);
      });
      markerRef.current = marker;
    } else {
      markerRef.current = null;
    }
  }, [markerPosition, onMapClick]);

  return <div ref={divRef} style={{ width: '100%', height: '100%', ...style }} />;
}

function PropertyForm({ isOpen, onClose, property, onSuccess }) {
  const [formData, setFormData] = useState({
    property_name: '',
    project_name: '',
    property_type: 'COMMERCIAL',
    address: '',
    city: '',
    state: '',
    county: '',
    zip_code: '',
    country: 'Kenya',
    total_area: '',
    number_of_units: '',
    total_floors: '',
    latitude: '',
    longitude: '',
    year_built: '',
    status: 'ACTIVE',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapQuery, setMapQuery] = useState('');
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // Nairobi default
  const [markerPosition, setMarkerPosition] = useState(null); // [lat, lng] or null
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cadLoading, setCadLoading] = useState(false);
  const [cadMessage, setCadMessage] = useState('');
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const lastSelectedQueryRef = useRef(null);
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);

  // Fetch config and load Google Maps script when form opens (use Google instead of Mapbox/Leaflet when key set)
  useEffect(() => {
    if (!isOpen) return;
    const base = API_URL || '/api';
    axios.get(`${base}/config`).then((r) => {
      const key = r.data?.googleMapsKey || '';
      if (!key) return;
      setGoogleMapsKey(key);
      if (window.google?.maps) {
        setGoogleMapsReady(true);
        return;
      }
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const check = setInterval(() => {
          if (window.google?.maps) {
            setGoogleMapsReady(true);
            clearInterval(check);
          }
        }, 100);
        return () => clearInterval(check);
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      script.async = true;
      script.onload = () => setGoogleMapsReady(true);
      document.head.appendChild(script);
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (property) {
      setFormData({
        property_name: property.PROPERTY_NAME || property.property_name || '',
        project_name: property.PROJECT_NAME || property.project_name || '',
        property_type: property.PROPERTY_TYPE || property.property_type || 'COMMERCIAL',
        address: property.ADDRESS || property.address || '',
        city: property.CITY || property.city || '',
        state: property.STATE || property.state || '',
        county: property.COUNTY || property.county || '',
        zip_code: property.ZIP_CODE || property.zip_code || '',
        country: property.COUNTRY || property.country || 'Kenya',
        total_area: property.TOTAL_AREA != null ? property.TOTAL_AREA : (property.total_area ?? ''),
        number_of_units: property.NUMBER_OF_UNITS != null ? property.NUMBER_OF_UNITS : (property.number_of_units ?? ''),
        total_floors: property.TOTAL_FLOORS != null ? property.TOTAL_FLOORS : (property.total_floors ?? property.FLOORS ?? ''),
        latitude: property.LATITUDE != null ? property.LATITUDE : (property.latitude ?? ''),
        longitude: property.LONGITUDE != null ? property.LONGITUDE : (property.longitude ?? ''),
        year_built: property.YEAR_BUILT != null ? property.YEAR_BUILT : (property.year_built ?? ''),
        status: property.STATUS || property.status || 'ACTIVE',
        description: property.DESCRIPTION || property.description || ''
      });
    } else {
      setFormData({
        property_name: '',
        project_name: '',
        property_type: 'COMMERCIAL',
        address: '',
        city: '',
        state: '',
        county: '',
        zip_code: '',
        country: 'Kenya',
        total_area: '',
        number_of_units: '',
        total_floors: '',
        latitude: '',
        longitude: '',
        year_built: '',
        status: 'ACTIVE',
        description: ''
      });
    }
  }, [property, isOpen]);

  // Address suggestions (debounced). After selecting an address, don't re-show dropdown for the same query.
  useEffect(() => {
    const raw = mapQuery.trim();
    const q = raw.replace(/\s*[•·]\s*/g, ', ').replace(/,+\s*/g, ', ').trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const base = API_URL || '/api';
        const { data } = await axios.get(`${base}/properties/geocode/suggest`, { params: { q, limit: 8 } });
        if (cancelled) return;
        const list = data?.data && Array.isArray(data.data) ? data.data : [];
        setSuggestions(list);
        const justSelected = lastSelectedQueryRef.current != null && lastSelectedQueryRef.current === q;
        if (justSelected) lastSelectedQueryRef.current = null;
        setShowSuggestions(list.length > 0 && !justSelected);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mapQuery]);

  // Sync map marker from form lat/long
  useEffect(() => {
    const lat = formData.latitude != null && formData.latitude !== '' ? Number(formData.latitude) : NaN;
    const lng = formData.longitude != null && formData.longitude !== '' ? Number(formData.longitude) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarkerPosition([lat, lng]);
      setMapCenter([lat, lng]);
    } else {
      setMarkerPosition(null);
    }
  }, [formData.latitude, formData.longitude]);

  const handleMapClick = useCallback(async (lat, lng) => {
    setGeocodeLoading(true);
    setAddressAutoFilled(false);
    try {
      const base = API_URL || '/api';
      const { data } = await axios.post(`${base}/properties/geocode`, { latitude: lat, longitude: lng });
      if (data.success && data.data) {
        const d = data.data;
        const fullAddress = [d.address_line1, d.city, d.state, d.country].filter(Boolean).join(', ');
        setFormData(prev => ({
          ...prev,
          property_name: (d.suggested_property_name && String(d.suggested_property_name).trim()) ? String(d.suggested_property_name).trim() : prev.property_name,
          project_name: (d.suggested_tower && String(d.suggested_tower).trim()) ? String(d.suggested_tower).trim() : prev.project_name,
          address: d.address_line1 || prev.address,
          city: d.city || prev.city,
          state: d.state || prev.state,
          county: d.county || prev.county,
          country: d.country || prev.country,
          zip_code: d.postal_code || prev.zip_code,
          latitude: d.latitude ?? lat,
          longitude: d.longitude ?? lng
        }));
        setMarkerPosition([d.latitude ?? lat, d.longitude ?? lng]);
        setMapCenter([d.latitude ?? lat, d.longitude ?? lng]);
        setMapQuery(fullAddress);
        setAddressAutoFilled(true);
        setTimeout(() => setAddressAutoFilled(false), 3000);
      } else {
        setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
      setMarkerPosition([lat, lng]);
      setMapCenter([lat, lng]);
    } finally {
      setGeocodeLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAiDescription = async () => {
    setAiLoading(true);
    try {
      const { data } = await axios.post('/api/ai/property-description', {
        property_name: formData.property_name,
        property_type: formData.property_type,
        city: formData.city,
        total_area: formData.total_area,
        total_floors: formData.total_floors
      });
      if (data.success && data.data?.description) setFormData(prev => ({ ...prev, description: data.data.description }));
    } catch (err) {
      console.error('AI description error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    const selectedText = item.place_name || item.address_line1 || [item.address_line1, item.city, item.country].filter(Boolean).join(', ');
    lastSelectedQueryRef.current = selectedText.replace(/\s*[•·]\s*/g, ', ').replace(/,+\s*/g, ', ').trim();
    setFormData(prev => ({
      ...prev,
      property_name: (item.suggested_property_name && item.suggested_property_name.trim()) ? item.suggested_property_name.trim() : prev.property_name,
      project_name: (item.suggested_tower && item.suggested_tower.trim()) ? item.suggested_tower.trim() : prev.project_name,
      address: item.address_line1 || prev.address,
      city: item.city || prev.city,
      state: item.state || prev.state,
      county: item.county || prev.county,
      country: item.country || prev.country,
      zip_code: item.postal_code || prev.zip_code,
      latitude: item.latitude != null ? String(item.latitude) : prev.latitude,
      longitude: item.longitude != null ? String(item.longitude) : prev.longitude
    }));
    setMapQuery(selectedText);
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressAutoFilled(true);
    setTimeout(() => setAddressAutoFilled(false), 3000);

    if (item.latitude != null && item.longitude != null) {
      setMarkerPosition([item.latitude, item.longitude]);
      setMapCenter([item.latitude, item.longitude]);
    }
  };

  const handleGeocode = async () => {
    const q = mapQuery || [formData.address, formData.city, formData.state, formData.country].filter(Boolean).join(', ');
    if (!q.trim()) return;
    setGeocodeLoading(true);
    try {
      const { data } = await axios.post('/api/properties/geocode', { address: q });
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          address: data.data.address_line1 ?? prev.address,
          city: data.data.city ?? prev.city,
          state: data.data.state ?? prev.state,
          county: data.data.county ?? prev.county,
          country: data.data.country ?? prev.country,
          zip_code: data.data.postal_code ?? prev.zip_code,
          latitude: data.data.latitude ?? prev.latitude,
          longitude: data.data.longitude ?? prev.longitude
        }));
        setMapQuery(q);
      }
    } catch (err) {
      console.error('Geocode error:', err);
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleCadUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setCadLoading(true);
    setCadMessage('');
    try {
      const base = API_URL || '/api';
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${base}/properties/parse-cad`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: 60 * 1024 * 1024,
        maxBodyLength: 60 * 1024 * 1024,
        timeout: 120000
      });
      if (data.success && data.data) {
        const d = data.data;
        const hasDetails = d.total_floors != null || d.number_of_units != null || d.total_area != null;
        setFormData(prev => ({
          ...prev,
          ...(d.total_floors != null && { total_floors: String(d.total_floors) }),
          ...(d.number_of_units != null && { number_of_units: String(d.number_of_units) }),
          ...(d.total_area != null && { total_area: String(d.total_area) })
        }));
        setCadMessage(d.message || (hasDetails ? 'Total area, units, and floors applied from CAD. Review and save.' : 'No floors/units/area detected; enter them manually if needed.'));
      } else {
        setCadMessage(data.error || 'Upload could not be processed.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      const isTooBig = err.response?.status === 413 || /max.*size|too large/i.test(String(msg));
      const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(String(msg));
      setCadMessage(
        isTooBig ? 'File too large (max 50 MB). Try a smaller file or export as DXF.'
          : isTimeout ? 'Upload took too long (e.g. large PDF). Try a smaller file or try again.'
            : msg
      );
    } finally {
      setCadLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData };
      if (property) {
        const propertyId = property.PROPERTY_ID || property.property_id;
        await axios.put(`/api/properties/${propertyId}`, payload);
      } else {
        await axios.post('/api/properties', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.response?.data?.error || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={property ? 'Edit Property' : 'Create New Property'}
      size="xlarge"
    >
      <form onSubmit={handleSubmit} style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', padding: '0 2px' }}>
        {error && (
          <div className="rw-alert rw-alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="rw-form-group" style={{ marginBottom: '20px' }}>
          <label className="rw-label">📍 Location Search & Map</label>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px', lineHeight: '1.5' }}>
            <strong>Search:</strong> Type an address and select from suggestions<br/>
            <strong>Or click on the map:</strong> Click anywhere to auto-fill address fields
          </p>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type="text"
              className="rw-input"
              value={mapQuery}
              onChange={(e) => { lastSelectedQueryRef.current = null; setMapQuery(e.target.value); }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g. Featherlite The Address, Chennai or Nairobi, Westlands"
              style={{ width: '100%' }}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  margin: 0,
                  marginTop: '2px',
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 9999,
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: 'var(--white, #fff)'
                }}
              >
                {suggestions.map((item, i) => (
                  <li
                    key={i}
                    onMouseDown={() => handleSelectSuggestion(item)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--gray-200)' : 'none',
                      fontSize: '13px'
                    }}
                    className="rw-hover"
                  >
                    {item.place_name || [item.address_line1, item.city, item.country].filter(Boolean).join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {geocodeLoading && (
            <div style={{
              padding: '8px 12px',
              background: '#EFF6FF',
              color: '#1E40AF',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              Getting address details...
            </div>
          )}
          <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--gray-300)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {googleMapsReady && googleMapsKey ? (
              <GoogleMapPicker
                center={mapCenter}
                markerPosition={markerPosition}
                onMapClick={handleMapClick}
                style={{ height: '260px' }}
              />
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} />
                {markerPosition && <Marker position={markerPosition} />}
              </MapContainer>
            )}
          </div>
          <div className="rw-form-row" style={{ marginTop: '10px' }}>
            <div className="rw-form-group">
              <label htmlFor="latitude" className="rw-label">Latitude</label>
              <input type="text" id="latitude" name="latitude" className="rw-input" value={formData.latitude} onChange={handleChange} placeholder="e.g. -1.2921" />
            </div>
            <div className="rw-form-group">
              <label htmlFor="longitude" className="rw-label">Longitude</label>
              <input type="text" id="longitude" name="longitude" className="rw-input" value={formData.longitude} onChange={handleChange} placeholder="e.g. 36.8219" />
            </div>
          </div>
          {formData.latitude && formData.longitude && (
            <p style={{ marginTop: '6px', fontSize: '12px' }}>
              <a href={`https://www.google.com/maps?q=${encodeURIComponent(formData.latitude + ',' + formData.longitude)}`} target="_blank" rel="noopener noreferrer" className="rw-link">Open in Google Maps</a>
            </p>
          )}

          <div className="rw-form-group" style={{ marginTop: '16px' }}>
            <label className="rw-label">Upload CAD / floor plan (DXF)</label>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '8px' }}>
              Upload DXF, DWG, or PDF to auto-fill total area, units, and floors from text in the file.
            </p>
            <label className="rw-button rw-button-secondary" style={{ marginBottom: 0, cursor: cadLoading ? 'not-allowed' : 'pointer' }}>
              <input type="file" accept=".dxf,.dwg,.pdf" onChange={handleCadUpload} disabled={cadLoading} style={{ display: 'none' }} />
              {cadLoading ? 'Parsing...' : 'Choose DXF / DWG / PDF'}
            </label>
            {cadMessage && (
              <div
                role="alert"
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: cadMessage.startsWith('Upload failed') || cadMessage.includes('error') ? 'var(--red-50, #fef2f2)' : 'var(--gray-100, #f3f4f6)',
                  color: cadMessage.startsWith('Upload failed') || cadMessage.includes('error') ? 'var(--red-700, #b91c1c)' : 'var(--gray-700, #374151)',
                  border: '1px solid ' + (cadMessage.startsWith('Upload failed') || cadMessage.includes('error') ? 'var(--red-200, #fecaca)' : 'var(--gray-200, #e5e7eb)')
                }}
              >
                {cadMessage}
              </div>
            )}
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="property_name" className="rw-label">Property Name *</label>
            <input
              type="text"
              id="property_name"
              name="property_name"
              className="rw-input"
              value={formData.property_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="property_type" className="rw-label">Property Type *</label>
            <select
              id="property_type"
              name="property_type"
              className="rw-input"
              value={formData.property_type}
              onChange={handleChange}
              required
            >
              <option value="COMMERCIAL">Commercial</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="MIXED_USE">Mixed Use</option>
            </select>
          </div>
        </div>

        <div className="rw-form-group">
          <label htmlFor="project_name" className="rw-label">Tower name</label>
          <input
            type="text"
            id="project_name"
            name="project_name"
            className="rw-input"
            value={formData.project_name}
            onChange={handleChange}
            placeholder="e.g. Phase 1, Tower A"
          />
        </div>

        <div className="rw-form-group">
          <label className="rw-label">Description</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button type="button" className="rw-button rw-button-secondary" onClick={handleAiDescription} disabled={aiLoading}>
              {aiLoading ? 'Generating...' : 'AI suggest description'}
            </button>
          </div>
          <textarea
            className="rw-input"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional property description (use AI to generate)"
          />
        </div>

        {addressAutoFilled && (
          <div style={{
            padding: '12px 16px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #34D399'
          }}>
            <span style={{ fontSize: '18px' }}>✓</span>
            <strong>Address auto-filled!</strong> Review and edit the fields below if needed.
          </div>
        )}

        <div className="rw-form-group">
          <label htmlFor="address" className="rw-label">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            className="rw-input"
            value={formData.address}
            onChange={handleChange}
            required
            style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
          />
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="city" className="rw-label">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              className="rw-input"
              value={formData.city}
              onChange={handleChange}
              required
              style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="state" className="rw-label">State *</label>
            <input
              type="text"
              id="state"
              name="state"
              className="rw-input"
              value={formData.state}
              onChange={handleChange}
              required
              style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="county" className="rw-label">County</label>
            <input
              type="text"
              id="county"
              name="county"
              className="rw-input"
              value={formData.county}
              onChange={handleChange}
              placeholder="e.g. Nairobi"
              style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
            />
          </div>
          <div className="rw-form-group">
            <label htmlFor="zip_code" className="rw-label">ZIP / Postal Code *</label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              className="rw-input"
              value={formData.zip_code}
              onChange={handleChange}
              required
              style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
            />
          </div>

          <div className="rw-form-group">
            <label htmlFor="country" className="rw-label">Country *</label>
            <input
              type="text"
              id="country"
              name="country"
              className="rw-input"
              value={formData.country}
              onChange={handleChange}
              required
              style={addressAutoFilled ? { background: '#F0FDF4', border: '2px solid #34D399' } : {}}
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="total_area" className="rw-label">Total Area (sq m)</label>
            <input
              type="number"
              id="total_area"
              name="total_area"
              className="rw-input"
              value={formData.total_area}
              onChange={handleChange}
            />
          </div>
          <div className="rw-form-group">
            <label htmlFor="number_of_units" className="rw-label">Number of Units</label>
            <input
              type="number"
              id="number_of_units"
              name="number_of_units"
              className="rw-input"
              value={formData.number_of_units}
              onChange={handleChange}
            />
          </div>
          <div className="rw-form-group">
            <label htmlFor="total_floors" className="rw-label">Total Floors</label>
            <input
              type="number"
              id="total_floors"
              name="total_floors"
              className="rw-input"
              value={formData.total_floors}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>

        <div className="rw-form-row">
          <div className="rw-form-group">
            <label htmlFor="year_built" className="rw-label">Year Built</label>
            <input
              type="number"
              id="year_built"
              name="year_built"
              className="rw-input"
              value={formData.year_built}
              onChange={handleChange}
              min="1800"
              max={new Date().getFullYear()}
            />
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
              <option value="INACTIVE">Inactive</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
            </select>
          </div>
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
            {loading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PropertyForm;

