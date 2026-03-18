const express = require('express');
const router = express.Router();
const { SUSTAINABILITY, PROPERTIES } = require('../data/kenyaProductionData');

// GET /api/sustainability/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRecords = SUSTAINABILITY.length;
    const totalWasteRecycled = SUSTAINABILITY.reduce((sum, s) => sum + (s.WASTE_RECYCLED || 0), 0);
    const totalCarbonEmissions = SUSTAINABILITY.reduce((sum, s) => sum + (s.CARBON_EMISSIONS || 0), 0);

    // Sustainability by initiative type
    const typeGroups = SUSTAINABILITY.reduce((acc, s) => {
      if (!acc[s.INITIATIVE_TYPE]) acc[s.INITIATIVE_TYPE] = 0;
      acc[s.INITIATIVE_TYPE]++;
      return acc;
    }, {});

    const sustainabilityByType = Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalRecords) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalRecords, totalWasteRecycled, totalCarbonEmissions },
        sustainabilityByType
      }
    });
  } catch (error) {
    console.error('Error fetching sustainability stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sustainability stats' });
  }
});

// GET /api/sustainability - Get all records
router.get('/', async (req, res) => {
  try {
    const { initiative_type, property_id, page = 1, limit = 20 } = req.query;

    let filteredSustainability = [...SUSTAINABILITY];

    if (initiative_type) {
      filteredSustainability = filteredSustainability.filter(s => s.INITIATIVE_TYPE === initiative_type);
    }
    if (property_id) {
      filteredSustainability = filteredSustainability.filter(s => s.PROPERTY_ID === property_id);
    }

    // Enrich with property data
    const enrichedSustainability = filteredSustainability.map(sus => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === sus.PROPERTY_ID);
      return {
        ...sus,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null
      };
    });

    // Pagination
    const total = enrichedSustainability.length;
    const offset = (page - 1) * limit;
    const paginatedSustainability = enrichedSustainability.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedSustainability,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sustainability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sustainability',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sustainability = SUSTAINABILITY.find(s => s.SUSTAINABILITY_ID === req.params.id);
    if (!sustainability) {
      return res.status(404).json({ success: false, error: 'Sustainability record not found' });
    }

    const property = PROPERTIES.find(p => p.PROPERTY_ID === sustainability.PROPERTY_ID);

    res.json({
      success: true,
      data: {
        ...sustainability,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        PROPERTY_ADDRESS: property ? property.ADDRESS : null
      }
    });
  } catch (error) {
    console.error('Error fetching sustainability record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sustainability record' });
  }
});

module.exports = router;

