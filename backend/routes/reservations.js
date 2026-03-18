const express = require('express');
const router = express.Router();
const { RESERVATIONS, PROPERTIES, SPACES, TENANTS } = require('../data/kenyaProductionData');

// GET /api/reservations/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalReservations = RESERVATIONS.length;
    const confirmed = RESERVATIONS.filter(r => r.STATUS === 'CONFIRMED').length;
    const pending = RESERVATIONS.filter(r => r.STATUS === 'PENDING').length;

    // Reservations by facility type
    const typeGroups = RESERVATIONS.reduce((acc, r) => {
      const space = SPACES.find(s => s.SPACE_ID === r.SPACE_ID);
      const type = space ? space.SPACE_TYPE : 'Other';
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});

    const reservationsByType = Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalReservations) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalReservations, confirmed, pending },
        reservationsByType
      }
    });
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reservation stats' });
  }
});

// GET /api/reservations - Get all records
router.get('/', async (req, res) => {
  try {
    const { status, property_id, space_id, page = 1, limit = 20 } = req.query;

    let filteredReservations = [...RESERVATIONS];

    if (status) {
      filteredReservations = filteredReservations.filter(r => r.STATUS === status);
    }
    if (property_id) {
      filteredReservations = filteredReservations.filter(r => r.PROPERTY_ID === property_id);
    }
    if (space_id) {
      filteredReservations = filteredReservations.filter(r => r.SPACE_ID === space_id);
    }

    // Enrich with property, space, and tenant data
    const enrichedReservations = filteredReservations.map(res => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === res.PROPERTY_ID);
      const space = SPACES.find(s => s.SPACE_ID === res.SPACE_ID);
      const tenant = res.TENANT_ID ? TENANTS.find(t => t.TENANT_ID === res.TENANT_ID) : null;

      return {
        ...res,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        SPACE_NAME: space ? space.SPACE_NAME : null,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null
      };
    });

    // Pagination
    const total = enrichedReservations.length;
    const offset = (page - 1) * limit;
    const paginatedReservations = enrichedReservations.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedReservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reservation = RESERVATIONS.find(r => r.RESERVATION_ID === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const property = PROPERTIES.find(p => p.PROPERTY_ID === reservation.PROPERTY_ID);
    const space = SPACES.find(s => s.SPACE_ID === reservation.SPACE_ID);
    const tenant = reservation.TENANT_ID ? TENANTS.find(t => t.TENANT_ID === reservation.TENANT_ID) : null;

    res.json({
      success: true,
      data: {
        ...reservation,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        SPACE_NAME: space ? space.SPACE_NAME : null,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null
      }
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reservation' });
  }
});

module.exports = router;
