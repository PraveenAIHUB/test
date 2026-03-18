import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DrillDownModal from '../DrillDownModal';
import { getPropertyDashboardConfig } from '../../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../../utils/dashboardUtils.jsx';
import { API_URL } from '../../config/api';
import '../../styles/PropertiesDashboard.css';

const API_BASE_URL = API_URL;

const KPI_ICONS = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  active: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  value: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  occupancy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
};

function PropertiesDashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCards, setVisibleCards] = useState(1);
  const carouselRef = useRef(null);
  const containerRef = useRef(null);
  const dashboardConfig = getPropertyDashboardConfig();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentProperties();
  }, []);

  useEffect(() => {
    const updateVisibleCards = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width >= 1400) setVisibleCards(3);
        else if (width >= 900) setVisibleCards(2);
        else setVisibleCards(1);
      }
    };
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const totalCards = 3;
  const totalSlides = Math.max(1, totalCards - visibleCards + 1);

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));
  const goToSlide = (index) => setCurrentSlide(index);

  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = 380;
      const gap = 24;
      carouselRef.current.scrollTo({ left: currentSlide * (cardWidth + gap), behavior: 'smooth' });
    }
  }, [currentSlide]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/properties/stats`);
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching property stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentProperties = async () => {
    try {
      setRecentLoading(true);
      const response = await axios.get(`${API_BASE_URL}/properties?limit=10`);
      setRecentProperties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recent properties:', error);
      setRecentProperties([
        { PROPERTY_ID: 1, PROPERTY_CODE: 'PROP-001', PROPERTY_NAME: 'Westlands Office Complex', PROPERTY_TYPE: 'COMMERCIAL', STATUS: 'ACTIVE', CITY: 'Nairobi', TOTAL_AREA: 50000, TOTAL_UNITS: 25 },
        { PROPERTY_ID: 2, PROPERTY_CODE: 'PROP-002', PROPERTY_NAME: 'Kilimani Residential Tower', PROPERTY_TYPE: 'RESIDENTIAL', STATUS: 'ACTIVE', CITY: 'Nairobi', TOTAL_AREA: 75000, TOTAL_UNITS: 120 }
      ]);
    } finally {
      setRecentLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!dashboardStats) return;
    exportToExcel(dashboardStats, 'Properties Dashboard', 'properties_dashboard');
  };

  const handleExportPDF = () => {
    if (!dashboardStats) return;
    exportToPDF(dashboardStats, 'Properties Dashboard', 'properties_dashboard');
  };

  const handleChartClick = (chartType, data) => {
    const columns = {
      revenue: [
        { key: 'property', label: 'Property' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'percentage', label: 'Percentage' }
      ],
      occupancy: [
        { key: 'property', label: 'Property' },
        { key: 'occupancy', label: 'Occupancy Rate' },
        { key: 'occupied', label: 'Occupied Units' },
        { key: 'total', label: 'Total Units' }
      ],
      type: [
        { key: 'type', label: 'Property Type' },
        { key: 'count', label: 'Count' },
        { key: 'percentage', label: 'Percentage' }
      ]
    };
    setDrillDownModal({
      isOpen: true,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Details`,
      data: data || [],
      columns: columns[chartType] || []
    });
  };

  const closeDrillDown = () => setDrillDownModal({ isOpen: false, title: '', data: [], columns: [] });

  const kpiData = dashboardStats
    ? [
        { label: 'Total Properties', value: dashboardStats.kpis.totalProperties.toString(), change: '+3 this month', changeType: 'positive', accent: 'primary', icon: 'total' },
        { label: 'Active Properties', value: dashboardStats.kpis.activeProperties.toString(), change: '92.9% of total', changeType: 'positive', accent: 'teal', icon: 'active' },
        { label: 'Total Value', value: `KES ${(dashboardStats.kpis.totalValue / 1000000000).toFixed(1)}B`, change: '+12% YoY', changeType: 'positive', accent: 'purple', icon: 'value' },
        { label: 'Avg Occupancy', value: `${dashboardStats.kpis.avgOccupancy}%`, change: '+2.4% from last month', changeType: 'positive', accent: 'amber', icon: 'occupancy' }
      ]
    : (dashboardConfig.kpis || []).map((k, i) => ({
        label: k.label,
        value: k.value,
        change: k.change,
        changeType: k.changeType || 'positive',
        accent: ['primary', 'teal', 'purple', 'amber'][i],
        icon: ['total', 'active', 'value', 'occupancy'][i]
      }));

  return (
    <div className="prop-dash">
      <header className="prop-dash__header">
        <h1 className="prop-dash__title">Properties overview</h1>
        <div className="prop-dash__actions">
          <button type="button" className="prop-dash__btn" onClick={handleExportExcel} disabled={!dashboardStats}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Excel
          </button>
          <button type="button" className="prop-dash__btn" onClick={handleExportPDF} disabled={!dashboardStats}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Export PDF
          </button>
        </div>
      </header>

      {statsLoading ? (
        <div className="prop-dash__loading">
          <div className="prop-dash__spinner"/>
          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          <section className="prop-dash__kpis" aria-label="Key metrics">
            {kpiData.map((kpi, index) => (
              <div key={index} className={`prop-dash__kpi prop-dash__kpi--${kpi.accent || 'primary'}`}>
                <div className="prop-dash__kpi-icon">{KPI_ICONS[kpi.icon] || KPI_ICONS.total}</div>
                <div className="prop-dash__kpi-label">{kpi.label}</div>
                <div className="prop-dash__kpi-value">{kpi.value}</div>
                <div className={`prop-dash__kpi-change ${kpi.changeType}`}>{kpi.change}</div>
              </div>
            ))}
          </section>

          {dashboardStats && (
            <section className="prop-dash__section">
              <div className="prop-dash__section-head">
                <h2 className="prop-dash__section-title">Key reports</h2>
                {totalSlides > 1 && (
                  <div className="prop-dash__carousel-nav">
                    <button type="button" className="prop-dash__carousel-btn" onClick={prevSlide} disabled={currentSlide === 0} aria-label="Previous">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button type="button" className="prop-dash__carousel-btn" onClick={nextSlide} disabled={currentSlide === totalSlides - 1} aria-label="Next">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="prop-dash__carousel-wrap" ref={containerRef}>
                <div className="prop-dash__carousel" ref={carouselRef}>
                  <div className="prop-dash__chart-card" onClick={() => handleChartClick('revenue', dashboardStats.charts.revenueByProperty)}>
                    <div className="prop-dash__chart-head">
                      <h3 className="prop-dash__chart-title">Revenue by property</h3>
                      <p className="prop-dash__chart-sub">Top performing properties</p>
                    </div>
                    <div>
                      {(dashboardStats.charts.revenueByProperty || []).map((item, index) => (
                        <div key={index} className="prop-dash__bar-row">
                          <span className="prop-dash__bar-label">{item.property}</span>
                          <div className="prop-dash__bar-track">
                            <div className="prop-dash__bar-fill" style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}/>
                          </div>
                          <span className="prop-dash__bar-pct">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="prop-dash__chart-card" onClick={() => handleChartClick('occupancy', dashboardStats.charts.occupancyRate)}>
                    <div className="prop-dash__chart-head">
                      <h3 className="prop-dash__chart-title">Occupancy rate</h3>
                      <p className="prop-dash__chart-sub">Current occupancy status</p>
                    </div>
                    <div>
                      {(dashboardStats.charts.occupancyRate || []).map((item, index) => (
                        <div key={index} className="prop-dash__occupancy-row">
                          <div className="prop-dash__occupancy-info">
                            <div className="prop-dash__occupancy-name">{item.property}</div>
                            <div className="prop-dash__occupancy-units">{item.occupied}/{item.total} units</div>
                          </div>
                          <div className="prop-dash__occupancy-track">
                            <div className="prop-dash__occupancy-fill" style={{ width: `${item.percentage}%` }}/>
                          </div>
                          <span className="prop-dash__occupancy-pct">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="prop-dash__chart-card" onClick={() => handleChartClick('type', dashboardStats.charts.typeDistribution)}>
                    <div className="prop-dash__chart-head">
                      <h3 className="prop-dash__chart-title">Property type distribution</h3>
                      <p className="prop-dash__chart-sub">Portfolio breakdown</p>
                    </div>
                    <div className="prop-dash__donut-legend">
                      {(dashboardStats.charts.typeDistribution || []).map((item, index) => (
                        <div key={index} className="prop-dash__legend-item">
                          <span className="prop-dash__legend-dot" style={{ backgroundColor: item.color || 'var(--gray-400)' }}/>
                          <span className="prop-dash__legend-label">{item.type}</span>
                          <span className="prop-dash__legend-value">{item.count} ({item.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {totalSlides > 1 && (
                <div className="prop-dash__carousel-dots">
                  {[...Array(totalSlides)].map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`prop-dash__dot ${currentSlide === index ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="prop-dash__section">
            <div className="prop-dash__section-head">
              <h2 className="prop-dash__section-title">Recent properties</h2>
              <Link to="/properties/all" className="prop-dash__section-link">View all →</Link>
            </div>
            {recentLoading ? (
              <div className="prop-dash__loading-small">
                <div className="prop-dash__spinner-small"/>
                <span>Loading properties…</span>
              </div>
            ) : (
              <div className="prop-dash__table-wrap">
                <table className="prop-dash__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Property name</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>Area (sq ft)</th>
                      <th>Units</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProperties.map((property) => (
                      <tr key={property.PROPERTY_ID}>
                        <td><span className="prop-dash__code">{property.PROPERTY_CODE}</span></td>
                        <td><strong>{property.PROPERTY_NAME}</strong></td>
                        <td><span className="prop-dash__badge prop-dash__badge--neutral">{property.PROPERTY_TYPE}</span></td>
                        <td>{property.CITY}</td>
                        <td>{property.TOTAL_AREA != null ? property.TOTAL_AREA.toLocaleString() : '—'}</td>
                        <td>{property.TOTAL_UNITS ?? '—'}</td>
                        <td>
                          <span className={`prop-dash__status prop-dash__status--${(property.STATUS || '').toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                            {property.STATUS}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {drillDownModal.isOpen && (
        <DrillDownModal
          isOpen={drillDownModal.isOpen}
          onClose={closeDrillDown}
          title={drillDownModal.title}
          data={drillDownModal.data}
          columns={drillDownModal.columns}
        />
      )}
    </div>
  );
}

export default PropertiesDashboard;
