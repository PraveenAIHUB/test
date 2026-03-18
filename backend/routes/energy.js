const express = require('express');
const router = express.Router();
const { ENERGY_RECORDS, PROPERTIES } = require('../data/kenyaProductionData');

// GET energy dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalConsumption = ENERGY_RECORDS.reduce((sum, e) => sum + e.CONSUMPTION, 0);
    const totalCost = ENERGY_RECORDS.reduce((sum, e) => sum + e.COST, 0);

    // Energy by type
    const typeGroups = ENERGY_RECORDS.reduce((acc, e) => {
      if (!acc[e.ENERGY_TYPE]) {
        acc[e.ENERGY_TYPE] = { consumption: 0, cost: 0 };
      }
      acc[e.ENERGY_TYPE].consumption += e.CONSUMPTION;
      acc[e.ENERGY_TYPE].cost += e.COST;
      return acc;
    }, {});

    const energyByType = Object.entries(typeGroups).map(([type, data]) => ({
      type,
      consumption: data.consumption,
      cost: data.cost,
      percentage: ((data.consumption / totalConsumption) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalConsumption, totalCost },
        energyByType
      }
    });
  } catch (error) {
    console.error('Error fetching energy stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch energy stats' });
  }
});

// GET energy consumption data (alias: /consumption and /)
const getConsumptionList = async (req, res) => {
  try {
    const { property_id, energy_type, page = 1, limit = 20 } = req.query;

    let filteredEnergy = [...ENERGY_RECORDS];

    if (property_id) {
      filteredEnergy = filteredEnergy.filter(e => e.PROPERTY_ID === property_id);
    }
    if (energy_type) {
      filteredEnergy = filteredEnergy.filter(e => e.ENERGY_TYPE === energy_type);
    }

    // Enrich with property data
    const enrichedEnergy = filteredEnergy.map(energy => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === energy.PROPERTY_ID);
      return {
        ...energy,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null
      };
    });

    // Pagination
    const total = enrichedEnergy.length;
    const offset = (page - 1) * limit;
    const paginatedEnergy = enrichedEnergy.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedEnergy,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch energy data' });
  }
};

router.get('/consumption', getConsumptionList);
router.get('/', getConsumptionList);

router.get('/:id', async (req, res) => {
  try {
    const energy = ENERGY_RECORDS.find(e => e.ENERGY_RECORD_ID === req.params.id);
    if (!energy) {
      return res.status(404).json({ success: false, error: 'Energy record not found' });
    }

    const property = PROPERTIES.find(p => p.PROPERTY_ID === energy.PROPERTY_ID);

    res.json({
      success: true,
      data: {
        ...energy,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        PROPERTY_ADDRESS: property ? property.ADDRESS : null
      }
    });
  } catch (error) {
    console.error('Error fetching energy record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch energy record' });
  }
});

module.exports = router;

