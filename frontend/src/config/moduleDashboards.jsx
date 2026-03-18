/**
 * Module Dashboard Configurations
 * Kenya-specific data for all module dashboards
 */

export const getPropertyDashboardConfig = () => ({
  kpis: [
    {
      label: 'Total Properties',
      value: '28',
      change: '+3 this month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Active Properties',
      value: '26',
      change: '92.9% of total',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Total Value',
      value: 'KES 4.1B',
      change: '+5.2% YoY',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    },
    {
      label: 'Avg Occupancy',
      value: '90.4%',
      change: '+2.1% vs last month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    }
  ],
  charts: [
    {
      title: 'Properties by Type',
      period: 'Current Portfolio',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { type: 'Commercial', count: 18, percentage: 64.3, color: '#0572CE' },
            { type: 'Industrial', count: 6, percentage: 21.4, color: '#1E88E5' },
            { type: 'Mixed Use', count: 3, percentage: 10.7, color: '#42A5F5' },
            { type: 'Residential', count: 1, percentage: 3.6, color: '#90CAF9' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</div>
              <div style={{ height: '32px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '28 Total Properties'
    },
    {
      title: 'Properties by Location',
      period: 'Nairobi County',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { location: 'Westlands', count: 8, color: '#0572CE' },
            { location: 'Upper Hill', count: 6, color: '#1E88E5' },
            { location: 'Kilimani', count: 5, color: '#42A5F5' },
            { location: 'Karen', count: 4, color: '#90CAF9' },
            { location: 'CBD', count: 3, color: '#BBDEFB' },
            { location: 'Industrial Area', count: 2, color: '#E3F2FD' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.location}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>{item.count} properties</span>
            </div>
          ))}
        </div>
      ),
      footer: '6 Locations'
    },
    {
      title: 'Property Status Overview',
      period: 'Current Status',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { status: 'Fully Occupied', count: 18, percentage: 64.3, color: '#2E7D32' },
            { status: 'Partially Occupied', count: 8, percentage: 28.6, color: '#F57C00' },
            { status: 'Under Renovation', count: 2, percentage: 7.1, color: '#1976D2' }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.status}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>{item.count} ({item.percentage}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ),
      footer: '28 Total Properties'
    }
  ]
});

export const getLeaseDashboardConfig = () => ({
  kpis: [
    {
      label: 'Active Leases',
      value: '156',
      change: '+12 this month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Monthly Revenue',
      value: 'KES 45.8M',
      change: '+8.5% vs last month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Expiring Soon',
      value: '12',
      change: 'Next 6 months',
      changeType: 'warning',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Avg Lease Value',
      value: 'KES 293K',
      change: 'Per month',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Lease Expiry Timeline',
      period: 'Next 12 Months',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { month: 'Mar 2026', count: 4, urgent: true },
            { month: 'Apr 2026', count: 3, urgent: true },
            { month: 'May 2026', count: 5, urgent: false },
            { month: 'Jun 2026', count: 8, urgent: false },
            { month: 'Jul 2026', count: 6, urgent: false },
            { month: 'Aug 2026', count: 4, urgent: false }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: '8px', background: item.urgent ? '#FFEBEE' : '#F5F5F5', borderRadius: '6px', borderLeft: `4px solid ${item.urgent ? '#D32F2F' : '#0572CE'}` }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.month}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: item.urgent ? '#D32F2F' : '#0572CE' }}>{item.count} leases</span>
            </div>
          ))}
        </div>
      ),
      footer: '30 Leases Expiring'
    },
    {
      title: 'Revenue by Lease Type',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { type: 'Commercial', revenue: 38500000, percentage: 84.1 },
            { type: 'Industrial', revenue: 5800000, percentage: 12.7 },
            { type: 'Residential', revenue: 1500000, percentage: 3.2 }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>KES {(item.revenue / 1000000).toFixed(1)}M ({item.percentage}%)</span>
              </div>
              <div style={{ height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: i === 0 ? '#0572CE' : i === 1 ? '#1E88E5' : '#42A5F5', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ),
      footer: 'KES 45.8M Total'
    },
    {
      title: 'Lease Duration Distribution',
      period: 'Active Leases',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { duration: '1-2 Years', count: 45, percentage: 28.8, color: '#42A5F5' },
            { duration: '3-5 Years', count: 78, percentage: 50.0, color: '#0572CE' },
            { duration: '6-10 Years', count: 28, percentage: 17.9, color: '#1565C0' },
            { duration: '10+ Years', count: 5, percentage: 3.3, color: '#0D47A1' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.duration}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '156 Active Leases'
    }
  ]
});

// Export more dashboard configs...
export const getTenantDashboardConfig = () => ({
  kpis: [
    {
      label: 'Total Tenants',
      value: '142',
      change: '+8 this month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Corporate Tenants',
      value: '98',
      change: '69% of total',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Avg Tenure',
      value: '3.2 years',
      change: 'Industry leading',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Payment Rate',
      value: '96.8%',
      change: 'On-time payments',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Tenants by Type',
      period: 'Current Distribution',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { type: 'Corporate', count: 98, percentage: 69.0, color: '#0572CE' },
            { type: 'Individual', count: 32, percentage: 22.5, color: '#42A5F5' },
            { type: 'Government', count: 12, percentage: 8.5, color: '#90CAF9' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '142 Total Tenants'
    },
    {
      title: 'Tenants by Location',
      period: 'Nairobi County',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { location: 'Westlands', count: 38 },
            { location: 'Upper Hill', count: 28 },
            { location: 'Kilimani', count: 24 },
            { location: 'Karen', count: 18 },
            { location: 'CBD', count: 22 },
            { location: 'Industrial Area', count: 12 }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid #E0E0E0' : 'none' }}>
              <span style={{ fontSize: '14px' }}>{item.location}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0572CE' }}>{item.count}</span>
            </div>
          ))}
        </div>
      ),
      footer: '6 Locations'
    },
    {
      title: 'Top Tenants by Revenue',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { name: 'Safaricom Ltd', revenue: 8.5, leases: 5 },
            { name: 'Equity Bank', revenue: 6.2, leases: 3 },
            { name: 'KCB Group', revenue: 5.8, leases: 4 },
            { name: 'Deloitte Kenya', revenue: 4.9, leases: 2 },
            { name: 'Standard Chartered', revenue: 4.2, leases: 2 }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid #E0E0E0' : 'none' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.leases} leases</div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32' }}>KES {item.revenue}M</span>
            </div>
          ))}
        </div>
      ),
      footer: 'Top 5 Tenants'
    }
  ]
});

export const getAssetDashboardConfig = () => ({
  kpis: [
    {
      label: 'Total Assets',
      value: '486',
      change: '+15 this quarter',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Operational',
      value: '428',
      change: '88% uptime',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Under Maintenance',
      value: '42',
      change: '8.6% of total',
      changeType: 'warning',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Total Value',
      value: 'KES 285M',
      change: 'Asset portfolio',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Assets by Category',
      period: 'Current Portfolio',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { category: 'HVAC Systems', count: 124, percentage: 25.5, color: '#0572CE' },
            { category: 'Security Systems', count: 92, percentage: 18.9, color: '#1E88E5' },
            { category: 'Elevators', count: 86, percentage: 17.7, color: '#42A5F5' },
            { category: 'Generators', count: 68, percentage: 14.0, color: '#64B5F6' },
            { category: 'Fire Safety', count: 58, percentage: 11.9, color: '#90CAF9' },
            { category: 'Other', count: 58, percentage: 11.9, color: '#BBDEFB' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.category}</div>
              <div style={{ height: '24px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 4}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                  <span style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '486 Total Assets'
    },
    {
      title: 'Asset Status Overview',
      period: 'Current Status',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { status: 'Operational', count: 428, percentage: 88.1, color: '#2E7D32' },
            { status: 'Under Maintenance', count: 42, percentage: 8.6, color: '#F57C00' },
            { status: 'Out of Service', count: 16, percentage: 3.3, color: '#D32F2F' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.status}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '486 Total Assets'
    },
    {
      title: 'Maintenance Due Soon',
      period: 'Next 30 Days',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { assetName: 'HVAC - Westlands BP Floor 5', dueDate: 'Feb 15', category: 'HVAC Systems' },
            { assetName: 'Elevator A - Kilimani Towers', dueDate: 'Feb 18', category: 'Elevators' },
            { assetName: 'Generator - Upper Hill Plaza', dueDate: 'Feb 22', category: 'Generators' },
            { assetName: 'Fire Alarm - Karen Complex', dueDate: 'Feb 25', category: 'Fire Safety' }
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 3 ? '1px solid #E0E0E0' : 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{item.assetName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                <span>{item.category}</span>
                <span style={{ color: '#D32F2F', fontWeight: '600' }}>Due: {item.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      ),
      footer: '4 Assets Due'
    }
  ]
});

export const getWorkOrderDashboardConfig = () => ({
  kpis: [
    {
      label: 'Open Work Orders',
      value: '12',
      change: '-5 from last week',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'In Progress',
      value: '8',
      change: 'Avg 2.3 days',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#FFF9C4',
      color: '#F57F17'
    },
    {
      label: 'Completed (MTD)',
      value: '45',
      change: '+12% vs last month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Avg Resolution',
      value: '1.8 days',
      change: 'Target: 2 days',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Work Orders by Type',
      period: 'Current Month',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { type: 'Preventive', count: 28, percentage: 43.1, color: '#2E7D32' },
            { type: 'Corrective', count: 22, percentage: 33.8, color: '#F57C00' },
            { type: 'Emergency', count: 10, percentage: 15.4, color: '#D32F2F' },
            { type: 'Inspection', count: 5, percentage: 7.7, color: '#0572CE' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 2}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '65 Total Work Orders'
    },
    {
      title: 'Work Orders by Priority',
      period: 'Open & In Progress',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { priority: 'Critical', count: 3, percentage: 15.0, color: '#D32F2F' },
            { priority: 'High', count: 7, percentage: 35.0, color: '#F57C00' },
            { priority: 'Medium', count: 8, percentage: 40.0, color: '#FDD835' },
            { priority: 'Low', count: 2, percentage: 10.0, color: '#66BB6A' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.priority}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 2}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: item.priority === 'Medium' ? '#333' : 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '20 Active Work Orders'
    },
    {
      title: 'Recent Work Orders',
      period: 'Last 7 Days',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { woNumber: 'WO-2026-045', property: 'Westlands BP', type: 'HVAC', priority: 'High', status: 'In Progress' },
            { woNumber: 'WO-2026-046', property: 'Kilimani Towers', type: 'Elevator', priority: 'Medium', status: 'Open' },
            { woNumber: 'WO-2026-047', property: 'Upper Hill Plaza', type: 'Plumbing', priority: 'High', status: 'In Progress' },
            { woNumber: 'WO-2026-048', property: 'Karen Complex', type: 'Security', priority: 'Low', status: 'Completed' }
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 3 ? '1px solid #E0E0E0' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.woNumber}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: item.status === 'Completed' ? '#E8F5E9' : item.status === 'In Progress' ? '#FFF3E0' : '#E3F2FD', color: item.status === 'Completed' ? '#2E7D32' : item.status === 'In Progress' ? '#E65100' : '#0572CE' }}>{item.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>{item.property} - {item.type}</div>
            </div>
          ))}
        </div>
      ),
      footer: '4 Recent Work Orders'
    }
  ]
});

export const getFinancialDashboardConfig = () => ({
  kpis: [
    {
      label: 'Monthly Revenue',
      value: 'KES 45.8M',
      change: '+8.5% vs last month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Collections',
      value: 'KES 42.1M',
      change: '91.9% collection rate',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Outstanding',
      value: 'KES 3.7M',
      change: '8.1% of revenue',
      changeType: 'warning',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Net Operating Income',
      value: 'KES 38.2M',
      change: '83.4% margin',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Revenue Trend',
      period: 'Last 7 Months',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { month: 'Aug', revenue: 43.2 },
            { month: 'Sep', revenue: 44.1 },
            { month: 'Oct', revenue: 44.8 },
            { month: 'Nov', revenue: 45.2 },
            { month: 'Dec', revenue: 45.5 },
            { month: 'Jan', revenue: 45.6 },
            { month: 'Feb', revenue: 45.8 }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 6 ? '1px solid #E0E0E0' : 'none' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.month} 2025/26</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32' }}>KES {item.revenue}M</span>
            </div>
          ))}
        </div>
      ),
      footer: 'Avg: KES 44.9M/month'
    },
    {
      title: 'Expenses by Category',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { category: 'Utilities', amount: 6.8, percentage: 32.2, color: '#0572CE' },
            { category: 'Staff', amount: 5.2, percentage: 24.6, color: '#1E88E5' },
            { category: 'Maintenance', amount: 3.9, percentage: 18.5, color: '#42A5F5' },
            { category: 'Insurance', amount: 2.8, percentage: 13.3, color: '#64B5F6' },
            { category: 'Other', amount: 2.4, percentage: 11.4, color: '#90CAF9' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.category}</div>
              <div style={{ height: '24px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 3}%`, background: item.color }}></div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>KES {item.amount}M</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Total: KES 21.1M'
    },
    {
      title: 'Collection Rate',
      period: 'Last 7 Months',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { month: 'Aug', rate: 94.2 },
            { month: 'Sep', rate: 95.1 },
            { month: 'Oct', rate: 96.3 },
            { month: 'Nov', rate: 95.8 },
            { month: 'Dec', rate: 96.5 },
            { month: 'Jan', rate: 97.1 },
            { month: 'Feb', rate: 91.9 }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.month}</div>
              <div style={{ height: '24px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.rate}%`, background: item.rate >= 95 ? '#2E7D32' : item.rate >= 90 ? '#F57C00' : '#D32F2F' }}></div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right', color: item.rate >= 95 ? '#2E7D32' : item.rate >= 90 ? '#F57C00' : '#D32F2F' }}>{item.rate}%</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Avg: 95.3%'
    }
  ]
});

export const getMaintenanceDashboardConfig = () => ({
  kpis: [
    {
      label: 'Monthly Spend',
      value: 'KES 3.9M',
      change: '-5.2% vs budget',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Preventive',
      value: '68%',
      change: 'vs 32% reactive',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Scheduled Tasks',
      value: '24',
      change: 'This week',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Compliance Rate',
      value: '97.2%',
      change: 'Safety standards',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Maintenance by Type',
      period: 'Current Month',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { type: 'Preventive', count: 42, percentage: 68.0, color: '#2E7D32' },
            { type: 'Corrective', count: 18, percentage: 29.0, color: '#F57C00' },
            { type: 'Emergency', count: 2, percentage: 3.0, color: '#D32F2F' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</div>
              <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '62 Total Tasks'
    },
    {
      title: 'Cost by Category',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { category: 'HVAC Systems', cost: 1.25, percentage: 32.1, color: '#0572CE' },
            { category: 'Plumbing', cost: 0.98, percentage: 25.1, color: '#1E88E5' },
            { category: 'Electrical', cost: 0.75, percentage: 19.2, color: '#42A5F5' },
            { category: 'Elevators', cost: 0.62, percentage: 15.9, color: '#64B5F6' },
            { category: 'Security', cost: 0.30, percentage: 7.7, color: '#90CAF9' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.category}</div>
              <div style={{ height: '24px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 3}%`, background: item.color }}></div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>KES {item.cost}M</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Total: KES 3.9M'
    },
    {
      title: 'Upcoming Schedules',
      period: 'Next 30 Days',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { task: 'HVAC Quarterly Inspection', property: 'Westlands BP', dueDate: 'Feb 15' },
            { task: 'Elevator Annual Service', property: 'Kilimani Towers', dueDate: 'Feb 18' },
            { task: 'Fire Safety Inspection', property: 'Upper Hill Plaza', dueDate: 'Feb 22' },
            { task: 'Generator Maintenance', property: 'Karen Complex', dueDate: 'Feb 25' }
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 3 ? '1px solid #E0E0E0' : 'none' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{item.task}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                <span>{item.property}</span>
                <span style={{ color: '#0572CE', fontWeight: '600' }}>{item.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      ),
      footer: '4 Scheduled Tasks'
    }
  ]
});

export const getVendorDashboardConfig = () => ({
  kpis: [
    {
      label: 'Active Vendors',
      value: '48',
      change: '+3 this quarter',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Avg Rating',
      value: '4.6/5.0',
      change: 'Quality score',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Monthly Spend',
      value: 'KES 5.2M',
      change: 'Vendor payments',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'On-Time Delivery',
      value: '94.5%',
      change: 'Performance metric',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Vendors by Category',
      period: 'Active Vendors',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { category: 'Maintenance', count: 18, percentage: 37.5, color: '#0572CE' },
            { category: 'Cleaning', count: 12, percentage: 25.0, color: '#1E88E5' },
            { category: 'Security', count: 8, percentage: 16.7, color: '#42A5F5' },
            { category: 'Landscaping', count: 6, percentage: 12.5, color: '#64B5F6' },
            { category: 'Other', count: 4, percentage: 8.3, color: '#90CAF9' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.category}</div>
              <div style={{ height: '26px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 2.5}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: '48 Active Vendors'
    },
    {
      title: 'Top Vendors by Spend',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { name: 'Kenya Power & Lighting', spend: 6.8, category: 'Utilities' },
            { name: 'G4S Security Services', spend: 2.4, category: 'Security' },
            { name: 'Nairobi Water', spend: 1.8, category: 'Utilities' },
            { name: 'Elite Cleaning Services', spend: 0.98, category: 'Cleaning' },
            { name: 'Green Landscaping Ltd', spend: 0.65, category: 'Landscaping' }
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #E0E0E0' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32' }}>KES {item.spend}M</span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>{item.category}</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Top 5 Vendors'
    },
    {
      title: 'Performance Ratings',
      period: 'Vendor Quality',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { rating: '5 Stars', count: 22, percentage: 45.8, color: '#2E7D32' },
            { rating: '4 Stars', count: 18, percentage: 37.5, color: '#66BB6A' },
            { rating: '3 Stars', count: 6, percentage: 12.5, color: '#FDD835' },
            { rating: '2 Stars', count: 2, percentage: 4.2, color: '#F57C00' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.rating}</div>
              <div style={{ height: '26px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage * 2}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: '12px', color: item.rating === '3 Stars' ? '#333' : 'white', fontWeight: '600' }}>{item.count}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Avg: 4.6/5.0'
    }
  ]
});

export const getEnergyDashboardConfig = () => ({
  kpis: [
    {
      label: 'Monthly Consumption',
      value: '485K kWh',
      change: '-3.2% vs last month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Energy Cost',
      value: 'KES 6.8M',
      change: '14.8% of revenue',
      changeType: 'neutral',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Solar Generation',
      value: '42K kWh',
      change: '8.7% of total',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Carbon Savings',
      value: '28.5 tons',
      change: 'CO₂ reduction',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ],
  charts: [
    {
      title: 'Consumption by Property',
      period: 'February 2026',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { property: 'Westlands BP', consumption: 125, cost: 1.75 },
            { property: 'CBD Commercial', consumption: 103, cost: 1.44 },
            { property: 'Kilimani Towers', consumption: 98, cost: 1.37 },
            { property: 'Upper Hill Plaza', consumption: 87, cost: 1.22 },
            { property: 'Karen Complex', consumption: 72, cost: 1.01 }
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #E0E0E0' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.property}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0572CE' }}>{item.consumption}K kWh</span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Cost: KES {item.cost}M</div>
            </div>
          ))}
        </div>
      ),
      footer: 'Top 5 Properties'
    },
    {
      title: 'Consumption Trend',
      period: 'Last 7 Months',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { month: 'Aug', consumption: 478, cost: 6.69 },
            { month: 'Sep', consumption: 482, cost: 6.75 },
            { month: 'Oct', consumption: 489, cost: 6.85 },
            { month: 'Nov', consumption: 475, cost: 6.65 },
            { month: 'Dec', consumption: 492, cost: 6.89 },
            { month: 'Jan', consumption: 487, cost: 6.82 },
            { month: 'Feb', consumption: 485, cost: 6.79 }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 6 ? '1px solid #E0E0E0' : 'none' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.month}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0572CE' }}>{item.consumption}K kWh</div>
                <div style={{ fontSize: '12px', color: '#666' }}>KES {item.cost}M</div>
              </div>
            </div>
          ))}
        </div>
      ),
      footer: 'Avg: 484K kWh/month'
    },
    {
      title: 'Energy Source Mix',
      period: 'Current Distribution',
      content: (
        <div style={{ padding: '20px 0' }}>
          {[
            { source: 'Grid Power', percentage: 91.3, amount: 443, color: '#0572CE' },
            { source: 'Solar', percentage: 8.7, amount: 42, color: '#FDD835' }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.source}</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.percentage}%</span>
              </div>
              <div style={{ height: '32px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <span style={{ fontSize: '13px', color: item.source === 'Solar' ? '#333' : 'white', fontWeight: '600' }}>{item.amount}K kWh</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '12px', background: '#E8F5E9', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: '600' }}>🌱 28.5 tons CO₂ saved this month</div>
          </div>
        </div>
      ),
      footer: '485K kWh Total'
    }
  ]
});

