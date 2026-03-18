import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';

const API = API_URL;

export default function FindSpace() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await axios.post(API + '/ai/search-units', { query: query.trim() });
      if (r.data?.success && r.data?.data) setResult(r.data.data);
    } catch (e) {
      setResult({ parsed: null, hint: 'Search failed. Try browsing directly.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>Find Space (AI)</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>
          e.g. &quot;I need a 2000 sq ft office on the second floor&quot;
        </p>
      </div>
      <div className="rw-card">
        <div className="rw-card-body">
          <div className="rw-form-group">
            <label className="rw-label">Describe what you need</label>
            <input
              type="text"
              className="rw-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. 2000 sq ft office on second floor"
            />
          </div>
          <button type="button" className="rw-button rw-button-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Find space'}
          </button>
        </div>
      </div>
      {result && (
        <div className="rw-card" style={{ marginTop: '24px' }}>
          <div className="rw-card-header"><h3 className="rw-chart-title">Search result</h3></div>
          <div className="rw-card-body">
            {result.parsed && (
              <p style={{ marginBottom: '12px' }}>
                We looked for: area {result.parsed.area_sqm ? result.parsed.area_sqm + ' sqm' : 'any'}, floor {result.parsed.floor_number || 'any'}, type {result.parsed.unit_type || 'any'}.
              </p>
            )}
            <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>{result.hint}</p>
            <button type="button" className="rw-button rw-button-primary" style={{ marginTop: '12px' }} onClick={() => navigate('/browse')}>
              Browse available units
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
