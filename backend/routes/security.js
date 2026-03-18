const express = require('express');
const router = express.Router();
const { SECURITY_INCIDENTS, PROPERTIES } = require('../data/kenyaProductionData');

// GET /api/security/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalIncidents = SECURITY_INCIDENTS.length;
    const open = SECURITY_INCIDENTS.filter(s => s.STATUS === 'OPEN').length;
    const resolved = SECURITY_INCIDENTS.filter(s => s.STATUS === 'RESOLVED').length;

    // Incidents by severity
    const severityGroups = SECURITY_INCIDENTS.reduce((acc, s) => {
      if (!acc[s.SEVERITY]) acc[s.SEVERITY] = 0;
      acc[s.SEVERITY]++;
      return acc;
    }, {});

    const incidentsBySeverity = Object.entries(severityGroups).map(([severity, count]) => ({
      severity,
      count,
      percentage: ((count / totalIncidents) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalIncidents, open, resolved },
        incidentsBySeverity
      }
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch security stats' });
  }
});

// GET /api/security - Get all records
router.get('/', async (req, res) => {
  try {
    const { severity, status, property_id, page = 1, limit = 20 } = req.query;

    let filteredIncidents = [...SECURITY_INCIDENTS];

    if (severity) {
      filteredIncidents = filteredIncidents.filter(s => s.SEVERITY === severity);
    }
    if (status) {
      filteredIncidents = filteredIncidents.filter(s => s.STATUS === status);
    }
    if (property_id) {
      filteredIncidents = filteredIncidents.filter(s => s.PROPERTY_ID === property_id);
    }

    // Enrich with property data
    const enrichedIncidents = filteredIncidents.map(incident => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === incident.PROPERTY_ID);
      return {
        ...incident,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null
      };
    });

    // Pagination
    const total = enrichedIncidents.length;
    const offset = (page - 1) * limit;
    const paginatedIncidents = enrichedIncidents.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedIncidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const incident = SECURITY_INCIDENTS.find(s => s.INCIDENT_ID === req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Security incident not found' });
    }

    const property = PROPERTIES.find(p => p.PROPERTY_ID === incident.PROPERTY_ID);

    res.json({
      success: true,
      data: {
        ...incident,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        PROPERTY_ADDRESS: property ? property.ADDRESS : null
      }
    });
  } catch (error) {
    console.error('Error fetching security incident:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch security incident' });
  }
});

module.exports = router;

