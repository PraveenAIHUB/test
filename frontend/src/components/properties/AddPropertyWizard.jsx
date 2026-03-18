import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AddPropertyWizard.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.flyTo(center, map.getZoom(), { duration: 0.5 });
    }
  }, [map, center]);
  return null;
}

function AddPropertyWizard({ onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const [mapQuery, setMapQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [cadLoading, setCadLoading] = useState(false);
  const [cadMessage, setCadMessage] = useState('');
  const lastSelectedQueryRef = useRef(null);

  const steps = [
    { id: 1, title: 'Basic Info', icon: '🏢' },
    { id: 2, title: 'Location', icon: '📍' },
    { id: 3, title: 'Details', icon: '📊' },
    { id: 4, title: 'Review', icon: '✓' }
  ];

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
          address: d.address_line1 ?? prev.address,
          city: d.city ?? prev.city,
          state: d.state ?? prev.state,
          county: d.county ?? prev.county,
          country: d.country ?? prev.country,
          zip_code: d.postal_code ?? prev.zip_code,
          latitude: d.latitude ?? lat,
          longitude: d.longitude ?? lng
        }));
        setMarkerPosition([d.latitude ?? lat, d.longitude ?? lng]);
        setMapCenter([d.latitude ?? lat, d.longitude ?? lng]);
        setMapQuery(fullAddress);
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
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectSuggestion = (item) => {
    const selectedText = item.place_name || item.address_line1 || [item.address_line1, item.city, item.country].filter(Boolean).join(', ');
    lastSelectedQueryRef.current = selectedText.replace(/\s*[•·]\s*/g, ', ').replace(/,+\s*/g, ', ').trim();
    setFormData(prev => ({
      ...prev,
      property_name: (item.suggested_property_name && item.suggested_property_name.trim()) ? item.suggested_property_name.trim() : prev.property_name,
      project_name: (item.suggested_tower && item.suggested_tower.trim()) ? item.suggested_tower.trim() : prev.project_name,
      address: item.address_line1 ?? prev.address,
      city: item.city ?? prev.city,
      state: item.state ?? prev.state,
      county: item.county ?? prev.county,
      country: item.country ?? prev.country,
      zip_code: item.postal_code ?? prev.zip_code,
      latitude: item.latitude != null ? String(item.latitude) : prev.latitude,
      longitude: item.longitude != null ? String(item.longitude) : prev.longitude
    }));
    setMapQuery(selectedText);
    setSuggestions([]);
    setShowSuggestions(false);
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
      if (data.success && data.data?.description) {
        setFormData(prev => ({ ...prev, description: data.data.description }));
      }
    } catch (err) {
      console.error('AI description error:', err);
    } finally {
      setAiLoading(false);
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
        setCadMessage(d.message || (hasDetails ? 'Area, units, and floors applied from CAD' : 'No data detected'));
      } else {
        setCadMessage(data.error || 'Upload could not be processed');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      setCadMessage(msg);
    } finally {
      setCadLoading(false);
      e.target.value = '';
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/properties', formData);
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
    <div className="wizard-overlay" onClick={(e) => e.target.className === 'wizard-overlay' && onClose()}>
      <div className="wizard-container">
        <div className="wizard-header">
          <h2>Add New Property</h2>
          <button className="wizard-close" onClick={onClose}>&times;</button>
        </div>

        <div className="wizard-progress">
          {steps.map((step, index) => (
            <div key={step.id} className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
              <div className="wizard-step-icon">{step.icon}</div>
              <div className="wizard-step-title">{step.title}</div>
              {index < steps.length - 1 && <div className="wizard-step-line"></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="wizard-error">{error}</div>
        )}

        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="wizard-step-content">
              <h3>Basic Information</h3>
              <div className="wizard-form-grid">
                <div className="wizard-form-group">
                  <label>Property Name *</label>
                  <input
                    type="text"
                    name="property_name"
                    className="wizard-input"
                    value={formData.property_name}
                    onChange={handleChange}
                    placeholder="e.g. Westlands Office Complex"
                    required
                  />
                </div>

                <div className="wizard-form-group">
                  <label>Property Type *</label>
                  <select
                    name="property_type"
                    className="wizard-input"
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

                <div className="wizard-form-group full-width">
                  <label>Tower / Building Name</label>
                  <input
                    type="text"
                    name="project_name"
                    className="wizard-input"
                    value={formData.project_name}
                    onChange={handleChange}
                    placeholder="e.g. Tower A, Phase 1"
                  />
                </div>

                <div className="wizard-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    className="wizard-input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  </select>
                </div>

                <div className="wizard-form-group">
                  <label>Year Built</label>
                  <input
                    type="number"
                    name="year_built"
                    className="wizard-input"
                    value={formData.year_built}
                    onChange={handleChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="wizard-step-content">
              <h3>Location Details</h3>
              <div className="wizard-form-group">
                <label>Search Address</label>
                <p className="wizard-hint">Type an address and select from suggestions, or click on the map</p>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="wizard-input"
                    value={mapQuery}
                    onChange={(e) => { lastSelectedQueryRef.current = null; setMapQuery(e.target.value); }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="e.g. Westlands Road, Nairobi"
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="wizard-suggestions">
                      {suggestions.map((item, i) => (
                        <li key={i} onMouseDown={() => handleSelectSuggestion(item)}>
                          {item.place_name || [item.address_line1, item.city, item.country].filter(Boolean).join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="wizard-map-container">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterUpdater center={mapCenter} />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {markerPosition && <Marker position={markerPosition} />}
                </MapContainer>
              </div>

              <div className="wizard-form-grid">
                <div className="wizard-form-group">
                  <label>Address *</label>
                  <input type="text" name="address" className="wizard-input" value={formData.address} onChange={handleChange} required />
                </div>

                <div className="wizard-form-group">
                  <label>City *</label>
                  <input type="text" name="city" className="wizard-input" value={formData.city} onChange={handleChange} required />
                </div>

                <div className="wizard-form-group">
                  <label>State *</label>
                  <input type="text" name="state" className="wizard-input" value={formData.state} onChange={handleChange} required />
                </div>

                <div className="wizard-form-group">
                  <label>County</label>
                  <input type="text" name="county" className="wizard-input" value={formData.county} onChange={handleChange} />
                </div>

                <div className="wizard-form-group">
                  <label>ZIP Code *</label>
                  <input type="text" name="zip_code" className="wizard-input" value={formData.zip_code} onChange={handleChange} required />
                </div>

                <div className="wizard-form-group">
                  <label>Country *</label>
                  <input type="text" name="country" className="wizard-input" value={formData.country} onChange={handleChange} required />
                </div>

                <div className="wizard-form-group">
                  <label>Latitude</label>
                  <input type="text" name="latitude" className="wizard-input" value={formData.latitude} onChange={handleChange} placeholder="-1.2921" />
                </div>

                <div className="wizard-form-group">
                  <label>Longitude</label>
                  <input type="text" name="longitude" className="wizard-input" value={formData.longitude} onChange={handleChange} placeholder="36.8219" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="wizard-step-content">
              <h3>Property Details</h3>

              <div className="wizard-upload-section">
                <label>Upload CAD / Floor Plan</label>
                <p className="wizard-hint">Upload DXF, DWG, or PDF to auto-fill area, units, and floors</p>
                <label className="wizard-upload-button">
                  <input type="file" accept=".dxf,.dwg,.pdf" onChange={handleCadUpload} disabled={cadLoading} style={{ display: 'none' }} />
                  {cadLoading ? 'Parsing...' : 'Choose File'}
                </label>
                {cadMessage && <div className="wizard-cad-message">{cadMessage}</div>}
              </div>

              <div className="wizard-form-grid">
                <div className="wizard-form-group">
                  <label>Total Area (sq m)</label>
                  <input type="number" name="total_area" className="wizard-input" value={formData.total_area} onChange={handleChange} placeholder="50000" />
                </div>

                <div className="wizard-form-group">
                  <label>Number of Units</label>
                  <input type="number" name="number_of_units" className="wizard-input" value={formData.number_of_units} onChange={handleChange} placeholder="120" />
                </div>

                <div className="wizard-form-group">
                  <label>Total Floors</label>
                  <input type="number" name="total_floors" className="wizard-input" value={formData.total_floors} onChange={handleChange} min="1" placeholder="15" />
                </div>
              </div>

              <div className="wizard-form-group full-width">
                <label>Description</label>
                <button type="button" className="wizard-ai-button" onClick={handleAiDescription} disabled={aiLoading}>
                  {aiLoading ? 'Generating...' : '✨ AI Generate Description'}
                </button>
                <textarea
                  className="wizard-textarea"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional property description"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="wizard-step-content">
              <h3>Review Your Property</h3>
              <div className="wizard-review">
                <div className="wizard-review-section">
                  <h4>Basic Information</h4>
                  <div className="wizard-review-item">
                    <span>Property Name:</span>
                    <strong>{formData.property_name || 'Not provided'}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>Type:</span>
                    <strong>{formData.property_type}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>Status:</span>
                    <strong>{formData.status}</strong>
                  </div>
                </div>

                <div className="wizard-review-section">
                  <h4>Location</h4>
                  <div className="wizard-review-item">
                    <span>Address:</span>
                    <strong>{formData.address || 'Not provided'}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>City:</span>
                    <strong>{formData.city || 'Not provided'}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>Country:</span>
                    <strong>{formData.country}</strong>
                  </div>
                </div>

                <div className="wizard-review-section">
                  <h4>Details</h4>
                  <div className="wizard-review-item">
                    <span>Total Area:</span>
                    <strong>{formData.total_area ? `${formData.total_area} sq m` : 'Not provided'}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>Units:</span>
                    <strong>{formData.number_of_units || 'Not provided'}</strong>
                  </div>
                  <div className="wizard-review-item">
                    <span>Floors:</span>
                    <strong>{formData.total_floors || 'Not provided'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-actions">
          {currentStep > 1 && (
            <button className="wizard-button wizard-button-secondary" onClick={prevStep}>
              Previous
            </button>
          )}
          {currentStep < steps.length && (
            <button className="wizard-button wizard-button-primary" onClick={nextStep}>
              Next
            </button>
          )}
          {currentStep === steps.length && (
            <button className="wizard-button wizard-button-success" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddPropertyWizard;
