import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/redwood-authentic.css';

function WasteManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/sustainability');
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
        <h2 className="rw-section-title">Waste Management</h2>
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
                  const id = item.sustainability_id ?? item.SUSTAINABILITY_ID ?? item.id ?? index + 1;
                  const name = item.metric ?? item.METRIC ?? item.record_type ?? item.RECORD_TYPE ?? item.name ?? 'N/A';
                  return (
                    <tr key={id ?? index}>
                      <td>{id}</td>
                      <td>{name}</td>
                      <td><span className="rw-badge rw-status-active">Active</span></td>
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

export default WasteManagement;
