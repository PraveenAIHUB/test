import { useState, useEffect } from 'react';
import axios from 'axios';
import { exportToExcel, exportToPDF } from '../../utils/dashboardUtils.jsx';
import '../../styles/redwood-authentic.css';

import { API_URL } from '../../config/api';
const API_BASE_URL = API_URL;

function PropertiesAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('year'); // 'month', 'quarter', 'year'

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/properties/analytics?range=${dateRange}`);
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock analytics data
      setAnalyticsData({
        trends: {
          revenueGrowth: '+15.3%',
          occupancyTrend: '+2.4%',
          newProperties: 3,
          avgPropertyValue: 'KES 425M'
        },
        comparativeAnalysis: [
          { metric: 'Total Revenue', current: 'KES 125M', previous: 'KES 108M', change: '+15.7%', trend: 'up' },
          { metric: 'Occupancy Rate', current: '87.5%', previous: '85.1%', change: '+2.4%', trend: 'up' },
          { metric: 'Avg Rent/Unit', current: 'KES 85K', previous: 'KES 82K', change: '+3.7%', trend: 'up' },
          { metric: 'Maintenance Cost', current: 'KES 12M', previous: 'KES 15M', change: '-20%', trend: 'down' }
        ],
        topPerformers: [
          { property: 'Westlands Office Complex', revenue: 'KES 45M', occupancy: '95%', roi: '12.5%' },
          { property: 'Kilimani Residential Tower', revenue: 'KES 38M', occupancy: '92%', roi: '11.2%' },
          { property: 'Karen Shopping Mall', revenue: 'KES 28M', occupancy: '88%', roi: '10.8%' }
        ],
        underperformers: [
          { property: 'Industrial Park Mombasa', revenue: 'KES 8M', occupancy: '65%', roi: '5.2%' },
          { property: 'Nakuru Retail Center', revenue: 'KES 6M', occupancy: '58%', roi: '4.8%' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!analyticsData) return;
    
    const exportData = {
      title: 'Properties Analytics Report',
      dateRange: dateRange,
      ...analyticsData
    };

    if (format === 'excel') {
      exportToExcel(exportData, 'Properties Analytics', 'properties_analytics');
    } else {
      exportToPDF(exportData, 'Properties Analytics', 'properties_analytics');
    }
  };

  return (
    <div className="rw-analytics-content">
      {/* Header with Date Range Selector */}
      <div className="rw-section-header" style={{ marginBottom: '24px' }}>
        <h2>Analytics & Insights</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="rw-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="rw-button rw-button-secondary" onClick={() => handleExport('excel')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rw-loading">
          <div className="rw-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : analyticsData && (
        <>
          {/* Key Trends */}
          <div className="rw-analytics-section">
            <h3 className="rw-section-title">Key Trends</h3>
            <div className="rw-kpi-grid">
              <div className="rw-kpi-card">
                <div className="rw-kpi-icon" style={{ backgroundColor: '#D4E9F0' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2C5F6F" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="rw-kpi-content">
                  <div className="rw-kpi-label">Revenue Growth</div>
                  <div className="rw-kpi-value">{analyticsData.trends.revenueGrowth}</div>
                  <div className="rw-kpi-change positive">Year over Year</div>
                </div>
              </div>

              <div className="rw-kpi-card">
                <div className="rw-kpi-icon" style={{ backgroundColor: '#FFE5DC' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className="rw-kpi-content">
                  <div className="rw-kpi-label">Occupancy Trend</div>
                  <div className="rw-kpi-value">{analyticsData.trends.occupancyTrend}</div>
                  <div className="rw-kpi-change positive">vs Last Period</div>
                </div>
              </div>

              <div className="rw-kpi-card">
                <div className="rw-kpi-icon" style={{ backgroundColor: '#E8F5E9' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                <div className="rw-kpi-content">
                  <div className="rw-kpi-label">New Properties</div>
                  <div className="rw-kpi-value">{analyticsData.trends.newProperties}</div>
                  <div className="rw-kpi-change neutral">This Period</div>
                </div>
              </div>

              <div className="rw-kpi-card">
                <div className="rw-kpi-icon" style={{ backgroundColor: '#E8E0F5' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B4C9A" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <div className="rw-kpi-content">
                  <div className="rw-kpi-label">Avg Property Value</div>
                  <div className="rw-kpi-value">{analyticsData.trends.avgPropertyValue}</div>
                  <div className="rw-kpi-change neutral">Portfolio Average</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Analysis */}
          <div className="rw-analytics-section">
            <h3 className="rw-section-title">Comparative Analysis</h3>
            <div className="rw-table-container">
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current Period</th>
                    <th>Previous Period</th>
                    <th>Change</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.comparativeAnalysis.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.metric}</strong></td>
                      <td>{item.current}</td>
                      <td>{item.previous}</td>
                      <td>
                        <span className={`rw-badge ${item.trend === 'up' ? 'rw-badge-success' : 'rw-badge-warning'}`}>
                          {item.change}
                        </span>
                      </td>
                      <td>
                        {item.trend === 'up' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers */}
          <div className="rw-analytics-section">
            <h3 className="rw-section-title">Top Performing Properties</h3>
            <div className="rw-table-container">
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Revenue</th>
                    <th>Occupancy</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topPerformers.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.property}</strong></td>
                      <td>{item.revenue}</td>
                      <td>
                        <span className="rw-badge rw-badge-success">{item.occupancy}</span>
                      </td>
                      <td>
                        <span className="rw-badge rw-badge-success">{item.roi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Underperformers */}
          <div className="rw-analytics-section">
            <h3 className="rw-section-title">Properties Needing Attention</h3>
            <div className="rw-table-container">
              <table className="rw-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Revenue</th>
                    <th>Occupancy</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.underperformers.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.property}</strong></td>
                      <td>{item.revenue}</td>
                      <td>
                        <span className="rw-badge rw-badge-warning">{item.occupancy}</span>
                      </td>
                      <td>
                        <span className="rw-badge rw-badge-warning">{item.roi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PropertiesAnalytics;

