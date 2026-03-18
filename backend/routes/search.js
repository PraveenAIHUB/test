const express = require('express');
const router = express.Router();

/**
 * Global Search Endpoint
 * Searches across all modules: Properties, Tenants, Leases, Assets, Work Orders, Financials, Maintenance, Vendors, Energy
 * 
 * Query Parameters:
 * - q: Search query string
 * 
 * Returns categorized results
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = q.toLowerCase().trim();

    // Mock search results - In production, this would query the database
    const results = {
      properties: [
        {
          title: 'Westlands Office Complex',
          subtitle: 'Commercial • Nairobi • KES 450M',
          url: '/properties?id=1'
        },
        {
          title: 'Kilimani Residential Apartments',
          subtitle: 'Residential • Nairobi • 120 Units',
          url: '/properties?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      tenants: [
        {
          title: 'Safaricom Ltd',
          subtitle: 'Corporate Tenant • Active • 5 Leases',
          url: '/tenants?id=1'
        },
        {
          title: 'Equity Bank Kenya',
          subtitle: 'Corporate Tenant • Active • 3 Leases',
          url: '/tenants?id=2'
        },
        {
          title: 'KCB Group',
          subtitle: 'Corporate Tenant • Active • 4 Leases',
          url: '/tenants?id=3'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      leases: [
        {
          title: 'Lease #L-2024-001',
          subtitle: 'Safaricom Ltd • Westlands Office • KES 2.5M/month',
          url: '/leases?id=1'
        },
        {
          title: 'Lease #L-2024-002',
          subtitle: 'Equity Bank • Kilimani Tower • KES 1.8M/month',
          url: '/leases?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      assets: [
        {
          title: 'HVAC System - Unit A',
          subtitle: 'Westlands Office • Operational • Last Service: 2024-01-15',
          url: '/assets?id=1'
        },
        {
          title: 'Elevator #1',
          subtitle: 'Kilimani Tower • Operational • Last Service: 2024-01-20',
          url: '/assets?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      workorders: [
        {
          title: 'WO-2024-001: HVAC Maintenance',
          subtitle: 'Westlands Office • In Progress • Due: 2024-02-15',
          url: '/workorders?id=1'
        },
        {
          title: 'WO-2024-002: Plumbing Repair',
          subtitle: 'Kilimani Apartments • Pending • Due: 2024-02-10',
          url: '/workorders?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      financials: [
        {
          title: 'Invoice #INV-2024-001',
          subtitle: 'Safaricom Ltd • KES 2,500,000 • Paid',
          url: '/financials?id=1'
        },
        {
          title: 'Payment #PAY-2024-001',
          subtitle: 'Equity Bank • KES 1,800,000 • Received',
          url: '/financials?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      maintenance: [
        {
          title: 'Preventive Maintenance - HVAC',
          subtitle: 'Westlands Office • Scheduled • 2024-02-15',
          url: '/maintenance?id=1'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      vendors: [
        {
          title: 'Kenya Power & Lighting',
          subtitle: 'Utility Provider • Active • 15 Properties',
          url: '/vendors?id=1'
        },
        {
          title: 'Nairobi Water Company',
          subtitle: 'Utility Provider • Active • 12 Properties',
          url: '/vendors?id=2'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      ),
      
      energy: [
        {
          title: 'Westlands Office - Jan 2024',
          subtitle: 'Electricity • 45,000 kWh • KES 450,000',
          url: '/energy?id=1'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.subtitle.toLowerCase().includes(searchQuery)
      )
    };

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;

