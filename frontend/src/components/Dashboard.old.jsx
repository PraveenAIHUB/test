import { useState, useEffect, useRef } from 'react';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeLeases: 0,
    openWorkOrders: 0,
    monthlyRevenue: 0
  });

  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCards, setVisibleCards] = useState(1);
  const carouselRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Kenya-specific mock data
    setStats({
      totalProperties: 28,
      activeLeases: 156,
      openWorkOrders: 12,
      monthlyRevenue: 45800000 // KES 45.8M
    });

    // Revenue by Property (Top 5 in Nairobi)
    setRevenueData([
      { property: 'Westlands Business Park', revenue: 8500000, percentage: 18.5 },
      { property: 'Kilimani Towers', revenue: 7200000, percentage: 15.7 },
      { property: 'Upper Hill Plaza', revenue: 6800000, percentage: 14.8 },
      { property: 'Karen Office Complex', revenue: 5900000, percentage: 12.9 },
      { property: 'Mombasa Road Industrial', revenue: 4600000, percentage: 10.0 }
    ]);

    // Occupancy Rate by Property
    setOccupancyData([
      { property: 'Westlands Business Park', occupied: 45, total: 48, rate: 93.8 },
      { property: 'Kilimani Towers', occupied: 38, total: 42, rate: 90.5 },
      { property: 'Upper Hill Plaza', occupied: 32, total: 36, rate: 88.9 },
      { property: 'Karen Office Complex', occupied: 28, total: 30, rate: 93.3 },
      { property: 'CBD Commercial Center', occupied: 24, total: 28, rate: 85.7 }
    ]);

    // Maintenance Cost Analysis
    setMaintenanceData([
      { category: 'HVAC Systems', cost: 1250000, percentage: 32 },
      { category: 'Plumbing', cost: 980000, percentage: 25 },
      { category: 'Electrical', cost: 750000, percentage: 19 },
      { category: 'Elevators', cost: 620000, percentage: 16 },
      { category: 'Security Systems', cost: 320000, percentage: 8 }
    ]);
  }, []);

  // Calculate visible cards based on container width
  useEffect(() => {
    const calculateVisibleCards = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const cardWidth = 420;
        const gap = 20;
        const visible = Math.floor((containerWidth + gap) / (cardWidth + gap));
        setVisibleCards(Math.max(1, visible));
      }
    };

    calculateVisibleCards();
    window.addEventListener('resize', calculateVisibleCards);
    return () => window.removeEventListener('resize', calculateVisibleCards);
  }, []);

  // Total number of cards in Key Reports section
  const totalCards = 4;

  // Calculate number of slides needed based on visible cards
  const totalSlides = Math.max(1, totalCards - visibleCards + 1);

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Scroll to the current slide
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = 420;
      const gap = 20;
      const scrollPosition = currentSlide * (cardWidth + gap);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentSlide]);

  const getDashboardExportData = () => ({
    kpis: {
      totalProperties: stats.totalProperties,
      activeLeases: stats.activeLeases,
      openWorkOrders: stats.openWorkOrders,
      monthlyRevenueKES: stats.monthlyRevenue
    },
    revenueByProperty: revenueData,
    occupancyByProperty: occupancyData,
    maintenanceByCategory: maintenanceData
  });

  const handleExportExcel = () => {
    exportToExcel(getDashboardExportData(), 'property-pro-dashboard.csv');
  };

  const handleExportPDF = () => {
    exportToPDF(getDashboardExportData(), 'property-pro-dashboard.pdf');
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <button className="rw-button rw-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Last 30 Days</span>
          </button>
          <button className="rw-button rw-button-secondary" onClick={handleExportExcel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Excel</span>
          </button>
          <button className="rw-button rw-button-primary" onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="rw-card kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: '#E8F3FC', color: '#0572CE' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Properties</div>
            <div className="kpi-value">{stats.totalProperties}</div>
            <div className="kpi-change positive">+3 this month</div>
          </div>
        </div>

        <div className="rw-card kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Active Leases</div>
            <div className="kpi-value">{stats.activeLeases}</div>
            <div className="kpi-change positive">+12 this month</div>
          </div>
        </div>

        <div className="rw-card kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Open Work Orders</div>
            <div className="kpi-value">{stats.openWorkOrders}</div>
            <div className="kpi-change negative">-5 from last week</div>
          </div>
        </div>

        <div className="rw-card kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: '#F3E5F5', color: '#6A1B9A' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Monthly Revenue</div>
            <div className="kpi-value">KES {(stats.monthlyRevenue / 1000000).toFixed(1)}M</div>
            <div className="kpi-change positive">+8.5% vs last month</div>
          </div>
        </div>
      </div>

      {/* Report Snapshots - Carousel with Navigation */}
      <div className="rw-section">
        <div className="rw-carousel-header">
          <h2 className="rw-section-title">Key Reports</h2>
          {totalSlides > 1 && (
            <div className="rw-carousel-nav">
              <button
                className="rw-carousel-arrow"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                aria-label="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                className="rw-carousel-arrow"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                aria-label="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="rw-carousel-container" ref={containerRef}>
          <div className="rw-horizontal-scroll" ref={carouselRef}>
        {/* Revenue by Property Report */}
        <div className="rw-card">
          <div className="report-header">
            <h3 className="card-title">Revenue by Property (Top 5)</h3>
            <span className="report-period">February 2026</span>
          </div>
          <div className="chart-container">
            {revenueData.map((item, index) => (
              <div key={index} className="bar-chart-row">
                <div className="bar-label">{item.property}</div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${item.percentage * 5}%`,
                      backgroundColor: index === 0 ? '#0572CE' : index === 1 ? '#1E88E5' : '#42A5F5'
                    }}
                  >
                    <span className="bar-value">KES {(item.revenue / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
                <div className="bar-percentage">{item.percentage}%</div>
              </div>
            ))}
          </div>
          <div className="report-footer">
            <span className="report-total">Total: KES 33.0M</span>
            <button className="rw-button rw-button-secondary rw-button-sm">View Full Report</button>
          </div>
        </div>

        {/* Occupancy Rate Report */}
        <div className="rw-card">
          <div className="report-header">
            <h3 className="card-title">Occupancy Rate Analysis</h3>
            <span className="report-period">As of Feb 9, 2026</span>
          </div>
          <div className="occupancy-container">
            {occupancyData.map((item, index) => (
              <div key={index} className="occupancy-row">
                <div className="occupancy-info">
                  <div className="occupancy-property">{item.property}</div>
                  <div className="occupancy-units">{item.occupied} / {item.total} units</div>
                </div>
                <div className="occupancy-bar-wrapper">
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-bar-fill"
                      style={{
                        width: `${item.rate}%`,
                        backgroundColor: item.rate >= 90 ? '#2E7D32' : item.rate >= 80 ? '#F57C00' : '#D32F2F'
                      }}
                    ></div>
                  </div>
                  <span className="occupancy-rate">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="report-footer">
            <span className="report-total">Average Occupancy: 90.4%</span>
            <button className="rw-button rw-button-secondary rw-button-sm">View Details</button>
          </div>
        </div>

        {/* Maintenance Cost Analysis */}
        <div className="rw-card">
          <div className="report-header">
            <h3 className="card-title">Maintenance Cost Breakdown</h3>
            <span className="report-period">Q1 2026</span>
          </div>
          <div className="maintenance-container">
            <div className="donut-chart-wrapper">
              <svg viewBox="0 0 200 200" className="donut-chart">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#E0E0E0" strokeWidth="40"></circle>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#0572CE" strokeWidth="40"
                  strokeDasharray="160 502" strokeDashoffset="0" transform="rotate(-90 100 100)"></circle>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#1E88E5" strokeWidth="40"
                  strokeDasharray="125 502" strokeDashoffset="-160" transform="rotate(-90 100 100)"></circle>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#42A5F5" strokeWidth="40"
                  strokeDasharray="95 502" strokeDashoffset="-285" transform="rotate(-90 100 100)"></circle>
                <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="600" fill="#333">KES 3.9M</text>
                <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#666">Total Cost</text>
              </svg>
            </div>
            <div className="maintenance-legend">
              {maintenanceData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: index === 0 ? '#0572CE' : index === 1 ? '#1E88E5' : index === 2 ? '#42A5F5' : index === 3 ? '#90CAF9' : '#BBDEFB' }}
                  ></div>
                  <div className="legend-label">{item.category}</div>
                  <div className="legend-value">KES {(item.cost / 1000).toFixed(0)}K ({item.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>
          <div className="report-footer">
            <span className="report-total">5 Categories</span>
            <button className="rw-button rw-button-secondary rw-button-sm" onClick={() => exportToExcel({ maintenanceByCategory: maintenanceData }, 'maintenance-cost-analysis.csv')}>
              Export Report
            </button>
          </div>
        </div>

        {/* Lease Expiry Timeline - Moved to Key Reports */}
        <div className="rw-card">
          <div className="report-header">
            <h3 className="card-title">Lease Expiry Timeline</h3>
            <span className="report-period">Next 6 Months</span>
          </div>
          <div className="timeline-container">
            <div className="timeline-item urgent">
              <div className="timeline-date">
                <div className="timeline-month">Mar</div>
                <div className="timeline-day">15</div>
              </div>
              <div className="timeline-content">
                <div className="timeline-tenant">Safaricom Ltd</div>
                <div className="timeline-property">Westlands Business Park - Unit 4A</div>
                <div className="timeline-value">KES 2.8M/month</div>
              </div>
              <button className="rw-button rw-button-primary rw-button-sm">Renew</button>
            </div>
            <div className="timeline-item warning">
              <div className="timeline-date">
                <div className="timeline-month">Apr</div>
                <div className="timeline-day">20</div>
              </div>
              <div className="timeline-content">
                <div className="timeline-tenant">Equity Bank</div>
                <div className="timeline-property">Upper Hill Plaza - Floor 3</div>
                <div className="timeline-value">KES 1.9M/month</div>
              </div>
              <button className="rw-button rw-button-primary rw-button-sm">Renew</button>
            </div>
            <div className="timeline-item normal">
              <div className="timeline-date">
                <div className="timeline-month">May</div>
                <div className="timeline-day">10</div>
              </div>
              <div className="timeline-content">
                <div className="timeline-tenant">KCB Group</div>
                <div className="timeline-property">Kilimani Towers - Unit 2B</div>
                <div className="timeline-value">KES 1.5M/month</div>
              </div>
              <button className="rw-button rw-button-secondary rw-button-sm">Contact</button>
            </div>
          </div>
          <div className="report-footer">
            <span className="report-total">12 Leases Expiring</span>
            <button className="rw-button rw-button-secondary rw-button-sm">View All</button>
          </div>
        </div>
      </div>

        {/* Carousel Dots Navigation - Only show if there are multiple slides */}
        {totalSlides > 1 && (
          <div className="rw-carousel-dots">
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                className={`rw-carousel-dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Tables */}
      <div className="dashboard-grid">
        <div className="rw-card">
          <h3 className="card-title">Recent Work Orders</h3>
          <table className="rw-table">
            <thead>
              <tr>
                <th>WO Number</th>
                <th>Property</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WO-2026-045</td>
                <td>Westlands Business Park</td>
                <td>HVAC Maintenance</td>
                <td><span className="badge badge-high">High</span></td>
                <td><span className="badge badge-in-progress">In Progress</span></td>
              </tr>
              <tr>
                <td>WO-2026-046</td>
                <td>Kilimani Towers</td>
                <td>Elevator Service</td>
                <td><span className="badge badge-medium">Medium</span></td>
                <td><span className="badge badge-open">Open</span></td>
              </tr>
              <tr>
                <td>WO-2026-047</td>
                <td>Upper Hill Plaza</td>
                <td>Plumbing Repair</td>
                <td><span className="badge badge-high">High</span></td>
                <td><span className="badge badge-in-progress">In Progress</span></td>
              </tr>
              <tr>
                <td>WO-2026-048</td>
                <td>Karen Office Complex</td>
                <td>Security System</td>
                <td><span className="badge badge-low">Low</span></td>
                <td><span className="badge badge-completed">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rw-card">
          <h3 className="card-title">Top Tenants by Revenue</h3>
          <table className="rw-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Monthly Rent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Safaricom Ltd</strong></td>
                <td>Westlands Business Park</td>
                <td>KES 2,800,000</td>
                <td><span className="badge badge-completed">Active</span></td>
              </tr>
              <tr>
                <td><strong>Equity Bank</strong></td>
                <td>Upper Hill Plaza</td>
                <td>KES 1,900,000</td>
                <td><span className="badge badge-completed">Active</span></td>
              </tr>
              <tr>
                <td><strong>KCB Group</strong></td>
                <td>Kilimani Towers</td>
                <td>KES 1,500,000</td>
                <td><span className="badge badge-completed">Active</span></td>
              </tr>
              <tr>
                <td><strong>Deloitte Kenya</strong></td>
                <td>Karen Office Complex</td>
                <td>KES 1,200,000</td>
                <td><span className="badge badge-completed">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <style jsx>{`
        .dashboard {
          width: 100%;
          max-width: 100%;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          display: flex;
          gap: var(--spacing-md);
        }

        .kpi-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-label {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          margin-bottom: var(--spacing-xs);
        }

        .kpi-value {
          font-size: var(--font-size-3xl);
          font-weight: 600;
          color: var(--redwood-gray-900);
          margin-bottom: var(--spacing-xs);
        }

        .kpi-change {
          font-size: var(--font-size-xs);
          font-weight: 500;
        }

        .kpi-change.positive {
          color: var(--redwood-success);
        }

        .kpi-change.negative {
          color: var(--redwood-error);
        }

        /* Section Styling */
        .rw-section {
          margin-bottom: 40px;
        }

        .rw-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #2C5F6F;
          margin-bottom: 0;
        }

        /* Carousel Header with Navigation */
        .rw-carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .rw-carousel-nav {
          display: flex;
          gap: 8px;
        }

        .rw-carousel-arrow {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #E0E0E0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rw-carousel-arrow:hover:not(:disabled) {
          background: #F5F5F5;
          border-color: #2C5F6F;
        }

        .rw-carousel-arrow:hover:not(:disabled) svg {
          stroke: #2C5F6F;
        }

        .rw-carousel-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .rw-carousel-arrow svg {
          stroke: #757575;
        }

        /* Carousel Container */
        .rw-carousel-container {
          position: relative;
          margin-bottom: 20px;
        }

        /* Horizontal Scroll Container - Hide Scrollbar */
        .rw-horizontal-scroll {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          flex-wrap: nowrap;
          /* Hide scrollbar */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .rw-horizontal-scroll::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .rw-horizontal-scroll > .rw-card {
          min-width: 420px;
          width: 420px;
          max-width: 420px;
          flex-shrink: 0;
          flex-grow: 0;
        }

        /* Responsive Design */
        @media (max-width: 1400px) {
          .rw-horizontal-scroll > .rw-card {
            min-width: 380px;
            width: 380px;
            max-width: 380px;
          }
        }

        @media (max-width: 1024px) {
          .rw-horizontal-scroll > .rw-card {
            min-width: 360px;
            width: 360px;
            max-width: 360px;
          }
        }

        @media (max-width: 768px) {
          .rw-horizontal-scroll > .rw-card {
            min-width: 340px;
            width: 340px;
            max-width: 340px;
          }

          .rw-carousel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .rw-carousel-nav {
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .rw-horizontal-scroll > .rw-card {
            min-width: 300px;
            width: 300px;
            max-width: 300px;
          }
        }

        /* Carousel Dots Navigation */
        .rw-carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .rw-carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #E0E0E0;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .rw-carousel-dot:hover {
          background: #BDBDBD;
        }

        .rw-carousel-dot.active {
          width: 24px;
          border-radius: 4px;
          background: #2C5F6F;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid var(--redwood-gray-200);
        }

        .report-period {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          font-weight: 500;
        }

        .report-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--redwood-gray-200);
        }

        .report-total {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-700);
          font-weight: 600;
        }

        /* Revenue Bar Chart */
        .chart-container {
          padding: var(--spacing-sm) 0;
          overflow: visible;
        }

        .bar-chart-row {
          display: grid;
          grid-template-columns: minmax(140px, 180px) 1fr minmax(50px, 60px);
          gap: 8px;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .bar-label {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-700);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bar-wrapper {
          position: relative;
          height: 32px;
          background: var(--redwood-gray-100);
          border-radius: var(--radius-sm);
          overflow: hidden;
          min-width: 0;
        }

        .bar-fill {
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 var(--spacing-sm);
          border-radius: var(--radius-sm);
          transition: width 0.3s ease;
          min-width: fit-content;
        }

        .bar-value {
          font-size: var(--font-size-xs);
          color: white;
          font-weight: 600;
          white-space: nowrap;
        }

        .bar-percentage {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          font-weight: 600;
          text-align: right;
          white-space: nowrap;
        }

        /* Responsive adjustments for smaller cards */
        @media (max-width: 768px) {
          .bar-chart-row {
            grid-template-columns: minmax(100px, 140px) 1fr minmax(45px, 55px);
            gap: 6px;
          }

          .bar-label {
            font-size: 12px;
          }

          .bar-percentage {
            font-size: 12px;
          }

          .bar-value {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .bar-chart-row {
            grid-template-columns: minmax(80px, 120px) 1fr minmax(40px, 50px);
            gap: 4px;
          }

          .bar-label {
            font-size: 11px;
          }

          .bar-wrapper {
            height: 28px;
          }
        }

        /* Occupancy Rate */
        .occupancy-container {
          padding: var(--spacing-sm) 0;
          overflow: visible;
        }

        .occupancy-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          gap: 12px;
        }

        .occupancy-info {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 180px;
        }

        .occupancy-property {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-700);
          font-weight: 500;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .occupancy-units {
          font-size: var(--font-size-xs);
          color: var(--redwood-gray-600);
          white-space: nowrap;
        }

        .occupancy-bar-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .occupancy-bar {
          flex: 1;
          height: 24px;
          background: var(--redwood-gray-100);
          border-radius: var(--radius-sm);
          overflow: hidden;
          min-width: 60px;
        }

        .occupancy-bar-fill {
          height: 100%;
          border-radius: var(--radius-sm);
          transition: width 0.3s ease;
        }

        .occupancy-rate {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-700);
          font-weight: 600;
          min-width: 45px;
          text-align: right;
          white-space: nowrap;
        }

        /* Responsive adjustments for occupancy */
        @media (max-width: 768px) {
          .occupancy-row {
            gap: 8px;
          }

          .occupancy-info {
            max-width: 140px;
          }

          .occupancy-property {
            font-size: 12px;
          }

          .occupancy-units {
            font-size: 10px;
          }

          .occupancy-rate {
            font-size: 12px;
            min-width: 40px;
          }

          .occupancy-bar {
            height: 20px;
          }
        }

        @media (max-width: 480px) {
          .occupancy-row {
            gap: 6px;
          }

          .occupancy-info {
            max-width: 100px;
          }

          .occupancy-property {
            font-size: 11px;
          }

          .occupancy-bar {
            min-width: 40px;
          }
        }

        /* Maintenance Donut Chart */
        .maintenance-container {
          display: grid;
          grid-template-columns: minmax(140px, 180px) 1fr;
          gap: 16px;
          padding: var(--spacing-md) 0;
        }

        .donut-chart-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-chart {
          width: 160px;
          height: 160px;
        }

        .maintenance-legend {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-label {
          flex: 1;
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-700);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .legend-value {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          font-weight: 600;
          white-space: nowrap;
        }

        /* Responsive adjustments for maintenance chart */
        @media (max-width: 768px) {
          .maintenance-container {
            grid-template-columns: minmax(120px, 140px) 1fr;
            gap: 12px;
          }

          .donut-chart {
            width: 120px;
            height: 120px;
          }

          .legend-item {
            gap: 6px;
          }

          .legend-color {
            width: 12px;
            height: 12px;
          }

          .legend-label,
          .legend-value {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .maintenance-container {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .donut-chart {
            width: 140px;
            height: 140px;
          }
        }

        /* Lease Expiry Timeline */
        .timeline-container {
          padding: var(--spacing-sm) 0;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: var(--spacing-sm);
          border-radius: var(--radius-md);
          border-left: 4px solid;
        }

        .timeline-item.urgent {
          background: #FFEBEE;
          border-left-color: #D32F2F;
        }

        .timeline-item.warning {
          background: #FFF3E0;
          border-left-color: #F57C00;
        }

        .timeline-item.normal {
          background: #E8F5E9;
          border-left-color: #2E7D32;
        }

        .timeline-date {
          flex: 0 0 auto;
          min-width: 50px;
          text-align: center;
        }

        .timeline-month {
          font-size: var(--font-size-xs);
          color: var(--redwood-gray-600);
          font-weight: 600;
          text-transform: uppercase;
        }

        .timeline-day {
          font-size: var(--font-size-xl);
          color: var(--redwood-gray-900);
          font-weight: 700;
        }

        .timeline-content {
          flex: 1;
          min-width: 0;
        }

        .timeline-tenant {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-900);
          font-weight: 600;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timeline-property {
          font-size: var(--font-size-xs);
          color: var(--redwood-gray-600);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timeline-value {
          font-size: var(--font-size-sm);
          color: #0572CE;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Responsive adjustments for timeline */
        @media (max-width: 768px) {
          .timeline-item {
            gap: 8px;
            padding: 10px;
          }

          .timeline-date {
            min-width: 45px;
          }

          .timeline-month {
            font-size: 9px;
          }

          .timeline-day {
            font-size: 18px;
          }

          .timeline-tenant,
          .timeline-value {
            font-size: 12px;
          }

          .timeline-property {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .timeline-item {
            gap: 6px;
            padding: 8px;
          }

          .timeline-date {
            min-width: 40px;
          }

          .timeline-day {
            font-size: 16px;
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--redwood-gray-900);
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-high { background: #FFEBEE; color: #C62828; }
        .badge-medium { background: #FFF3E0; color: #E65100; }
        .badge-low { background: #E8F5E9; color: #2E7D32; }
        .badge-open { background: #E3F2FD; color: #1565C0; }
        .badge-in-progress { background: #FFF9C4; color: #F57F17; }
        .badge-completed { background: #E8F5E9; color: #2E7D32; }

        .rw-button-sm {
          font-size: 12px;
          padding: 6px 12px;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

