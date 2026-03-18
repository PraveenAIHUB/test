import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/redwood-authentic.css';

function Incidents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/security');
      setData(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="rw-loading">Loading...</div>;

  return (
    <div className="rw-page-content">
      <div className="rw-section">
        <h2 className="rw-section-title">Incidents</h2>
        <div className="rw-table-container" style={{ marginTop: '20px' }}>
          <table className="rw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => {
                  const id = item.incident_id ?? item.INCIDENT_ID ?? item.id ?? index + 1;
                  const name = item.description ?? item.DESCRIPTION ?? item.incident_type ?? item.INCIDENT_TYPE ?? item.location ?? item.LOCATION ?? item.name ?? 'N/A';
                  const status = item.status ?? item.STATUS ?? 'Active';
                  return (
                    <tr key={id ?? index}>
                      <td>{id}</td>
                      <td>{name}</td>
                      <td><span className="rw-badge rw-status-active">{status}</span></td>
                      <td><button className="rw-btn rw-btn-sm rw-btn-secondary">View</button></td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Incidents;
