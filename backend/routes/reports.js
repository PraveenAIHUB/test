const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET available reports
router.get('/available', async (req, res) => {
  try {
    const reports = [
      {
        REPORT_ID: 1, REPORT_NAME: 'Property Portfolio Summary',
        CATEGORY: 'FINANCIAL', DESCRIPTION: 'Overview of all properties with financial metrics',
        FREQUENCY: 'MONTHLY'
      },
      {
        REPORT_ID: 2, REPORT_NAME: 'Lease Expiration Report',
        CATEGORY: 'LEASING', DESCRIPTION: 'Upcoming lease expirations and renewals',
        FREQUENCY: 'WEEKLY'
      },
      {
        REPORT_ID: 3, REPORT_NAME: 'Maintenance Cost Analysis',
        CATEGORY: 'OPERATIONS', DESCRIPTION: 'Breakdown of maintenance costs by property and category',
        FREQUENCY: 'MONTHLY'
      },
      {
        REPORT_ID: 4, REPORT_NAME: 'Occupancy Rate Report',
        CATEGORY: 'LEASING', DESCRIPTION: 'Current occupancy rates across all properties',
        FREQUENCY: 'MONTHLY'
      },
      {
        REPORT_ID: 5, REPORT_NAME: 'Energy Consumption Report',
        CATEGORY: 'SUSTAINABILITY', DESCRIPTION: 'Energy usage and costs by property',
        FREQUENCY: 'MONTHLY'
      },
      {
        REPORT_ID: 6, REPORT_NAME: 'Work Order Status Report',
        CATEGORY: 'OPERATIONS', DESCRIPTION: 'Status of all work orders by priority and property',
        FREQUENCY: 'WEEKLY'
      }
    ];
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// GET report data
router.get('/:reportId/data', async (req, res) => {
  try {
    const { reportId } = req.params;

    // Mock report data based on report ID
    const mockData = {
      report_name: 'Property Portfolio Summary',
      generated_date: new Date(),
      data: [
        {
          PROPERTY_NAME: 'Downtown Plaza',
          TOTAL_UNITS: 50, OCCUPIED_UNITS: 48, OCCUPANCY_RATE: 96,
          MONTHLY_REVENUE: 125000, MONTHLY_EXPENSES: 45000, NET_INCOME: 80000
        },
        {
          PROPERTY_NAME: 'Riverside Tower',
          TOTAL_UNITS: 75, OCCUPIED_UNITS: 70, OCCUPANCY_RATE: 93.3,
          MONTHLY_REVENUE: 187500, MONTHLY_EXPENSES: 62000, NET_INCOME: 125500
        },
        {
          PROPERTY_NAME: 'Tech Park Building A',
          TOTAL_UNITS: 30, OCCUPIED_UNITS: 28, OCCUPANCY_RATE: 93.3,
          MONTHLY_REVENUE: 95000, MONTHLY_EXPENSES: 35000, NET_INCOME: 60000
        }
      ]
    };

    res.json({ success: true, data: mockData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// GET report history
router.get('/history', async (req, res) => {
  try {
    const mockHistory = [
      {
        HISTORY_ID: 1, REPORT_NAME: 'Property Portfolio Summary',
        GENERATED_DATE: new Date('2024-02-01'), GENERATED_BY: 'Admin User',
        STATUS: 'COMPLETED', FILE_URL: '/reports/portfolio-2024-02.pdf'
      },
      {
        HISTORY_ID: 2, REPORT_NAME: 'Lease Expiration Report',
        GENERATED_DATE: new Date('2024-02-05'), GENERATED_BY: 'Admin User',
        STATUS: 'COMPLETED', FILE_URL: '/reports/lease-expiration-2024-02.pdf'
      }
    ];
    res.json({ success: true, data: mockHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch report history' });
  }
});

module.exports = router;
