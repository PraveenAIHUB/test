import { useState, useEffect } from 'react';
import axios from 'axios';
import { exportToExcel } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-theme.css';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports/available');
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category) => {
    const styles = {
      FINANCIAL: { backgroundColor: '#E8F3FC', color: '#0572CE' },
      LEASING: { backgroundColor: '#F3E5F5', color: '#7B1FA2' },
      OPERATIONS: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
      SUSTAINABILITY: { backgroundColor: '#FFF3E0', color: '#F57C00' }
    };
    return styles[category] || styles.OPERATIONS;
  };

  const handleExportReport = async (report) => {
    const id = report.REPORT_ID ?? report.report_id;
    setExportingId(id);
    try {
      const response = await axios.get(`/api/reports/${id}/data`);
      const payload = response.data?.data;
      const name = (report.REPORT_NAME ?? report.report_name ?? 'report').replace(/\s+/g, '-');
      if (payload && Array.isArray(payload)) {
        exportToExcel({ reportData: payload }, `${name}.csv`);
      } else if (payload && typeof payload === 'object') {
        exportToExcel(payload, `${name}.csv`);
      } else {
        exportToExcel({ report: payload }, `${name}.csv`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Generate and view property management reports</p>
        </div>
        <div className="page-actions">
          <button className="rw-button rw-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Custom Report</span>
          </button>
        </div>
      </div>

      <div className="rw-card">
        <div className="rw-card-header">
          <h2 className="rw-card-title">Available Reports ({reports.length})</h2>
        </div>
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>Loading...</p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Frequency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.REPORT_ID ?? report.report_id}>
                    <td><strong>{report.REPORT_NAME ?? report.report_name}</strong></td>
                    <td>
                      <span className="rw-badge" style={getCategoryBadge(report.CATEGORY ?? report.category)}>
                        {report.CATEGORY ?? report.category}
                      </span>
                    </td>
                    <td>{report.DESCRIPTION ?? report.description}</td>
                    <td>{report.FREQUENCY ?? report.frequency}</td>
                    <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="rw-button rw-button-sm rw-button-primary">Generate</button>
                      <button
                        className="rw-button rw-button-sm rw-button-secondary"
                        onClick={() => handleExportReport(report)}
                        disabled={exportingId !== null}
                      >
                        {exportingId === (report.REPORT_ID ?? report.report_id) ? 'Exporting...' : 'Export'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
