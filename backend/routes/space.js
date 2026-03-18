const express = require('express');
const router = express.Router();
const { PROPERTIES, LEASES, TENANTS } = require('../data/kenyaProductionData');
const { getSpaces, saveSpaces, getFloors } = require('../data/floorSpaceStorage');

// GET /api/space/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const SPACES = getSpaces();
    const totalSpaces = SPACES.length;
    const occupied = SPACES.filter(s => s.STATUS === 'OCCUPIED').length;
    const vacant = SPACES.filter(s => s.STATUS === 'VACANT').length;
    const reserved = SPACES.filter(s => s.STATUS === 'RESERVED').length;
    const totalArea = SPACES.reduce((sum, s) => sum + (s.AREA || 0), 0);
    const occupancyRate = totalSpaces ? (occupied / totalSpaces * 100).toFixed(1) : '0';

    // Spaces by type
    const typeGroups = SPACES.reduce((acc, s) => {
      if (!acc[s.SPACE_TYPE]) acc[s.SPACE_TYPE] = 0;
      acc[s.SPACE_TYPE]++;
      return acc;
    }, {});

    const spacesByType = Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalSpaces) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalSpaces, occupied, vacant, reserved, totalArea, occupancyRate },
        spacesByType
      }
    });
  } catch (error) {
    console.error('Error fetching space stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch space stats' });
  }
});

// GET /api/space - Get all spaces with filters
router.get('/', async (req, res) => {
  try {
    const SPACES = getSpaces();
    const { property_id, floor, type, status, search, page = 1, limit = 20 } = req.query;

    let filteredSpaces = [...SPACES];

    if (property_id != null && property_id !== '') {
      const pid = String(property_id).trim();
      filteredSpaces = filteredSpaces.filter(s => String(s.PROPERTY_ID || s.property_id || '').trim() === pid);
    }
    if (floor != null && floor !== '') {
      const f = String(floor).trim();
      filteredSpaces = filteredSpaces.filter(s => String(s.FLOOR ?? s.floor_number ?? '').trim() === f);
    }
    if (type) {
      filteredSpaces = filteredSpaces.filter(s => (s.SPACE_TYPE || s.space_type) === type);
    }
    if (status) {
      filteredSpaces = filteredSpaces.filter(s => (s.STATUS || s.occupancy_status) === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSpaces = filteredSpaces.filter(s =>
        (s.SPACE_NAME && s.SPACE_NAME.toLowerCase().includes(searchLower)) ||
        (s.SPACE_CODE && s.SPACE_CODE.toLowerCase().includes(searchLower))
      );
    }

    // Enrich with property and lease data (match property by ID with string comparison so 84 and '84' match)
    const enrichedSpaces = filteredSpaces.map(space => {
      const spacePropId = String(space.PROPERTY_ID ?? space.property_id ?? '').trim();
      const property = PROPERTIES.find(p => String(p.PROPERTY_ID ?? p.property_id ?? '').trim() === spacePropId);
      const lease = LEASES.find(l => l.SPACE_ID === space.SPACE_ID && l.STATUS === 'ACTIVE');
      const tenant = lease ? TENANTS.find(t => t.TENANT_ID === lease.TENANT_ID) : null;

      const propName = property ? (property.PROPERTY_NAME || property.property_name) : null;
      return {
        ...space,
        PROPERTY_ID: space.PROPERTY_ID || space.property_id,
        property_id: space.PROPERTY_ID || space.property_id,
        PROPERTY_NAME: propName,
        property_name: propName,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null,
        LEASE_ID: lease ? lease.LEASE_ID : null
      };
    });

    // Pagination
    const total = enrichedSpaces.length;
    const offset = (page - 1) * limit;
    const paginatedSpaces = enrichedSpaces.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedSpaces,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spaces',
      error: error.message
    });
  }
});

// POST /api/space - Create a space/unit
router.post('/', async (req, res) => {
  try {
    const SPACES = getSpaces();
    const body = req.body || {};
    const property_id = body.property_id ?? body.PROPERTY_ID ?? null;
    const floor_id = body.floor_id ?? body.FLOOR_ID ?? null;
    const floor_number = body.floor_number ?? body.FLOOR ?? null;
    const category = body.category ?? body.CATEGORY ?? 'SPACE';
    if (property_id == null || String(property_id).trim() === '') {
      return res.status(400).json({ success: false, error: 'property_id is required' });
    }
    const propId = String(property_id).trim();
    const floorNum = floor_number != null ? Number(floor_number) : null;
    const fid = floor_id != null && String(floor_id).trim() !== '' ? String(floor_id).trim() : null;
    const FLOORS = getFloors();
    const floorRecord = fid ? FLOORS.find(f => (f.FLOOR_ID || f.floor_id) === fid) : FLOORS.find(f => (f.PROPERTY_ID || f.property_id) === propId && (f.FLOOR_NUMBER ?? f.floor_number) == floorNum);
    const floorKey = (floorRecord ? (floorRecord.FLOOR_ID || floorRecord.floor_id) : fid) || ('F' + (floorNum ?? '0'));
    const safeFloorKey = String(floorKey).replace(/-/g, '');
    const isUnit = String(category).toUpperCase() === 'UNIT';
    const prefix = isUnit ? 'UNIT' : 'SPACE';
    const sameFloor = (s) => String(s.PROPERTY_ID || s.property_id) === propId && (String(s.FLOOR ?? s.floor_number) === String(floorNum) || (s.FLOOR_ID || s.floor_id) === (floorRecord && (floorRecord.FLOOR_ID || floorRecord.floor_id)));
    const existingSameType = SPACES.filter(s => sameFloor(s) && (String(s.CATEGORY || s.category) === (isUnit ? 'UNIT' : 'SPACE')));
    const parseNum = (id) => { const parts = String(id).split('-'); const n = parseInt(parts[parts.length - 1], 10); return isNaN(n) ? 0 : n; };
    const nums = existingSameType.map(s => parseNum(s.SPACE_ID || s.space_id));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const spaceId = `${prefix}-${safeFloorKey}-${String(nextNum).padStart(3, '0')}`;
    const space = {
      SPACE_ID: spaceId,
      space_id: spaceId,
      SPACE_CODE: body.space_code ?? body.SPACE_CODE ?? spaceId,
      space_code: body.space_code ?? body.SPACE_CODE ?? spaceId,
      PROPERTY_ID: propId,
      property_id: propId,
      FLOOR_ID: floorRecord ? (floorRecord.FLOOR_ID || floorRecord.floor_id) : floor_id,
      floor_id: floorRecord ? (floorRecord.FLOOR_ID || floorRecord.floor_id) : floor_id,
      FLOOR: floorNum,
      floor_number: floorNum,
      SPACE_TYPE: body.space_type ?? body.SPACE_TYPE ?? 'OFFICE',
      space_type: body.space_type ?? body.SPACE_TYPE ?? 'OFFICE',
      CATEGORY: String(category).toUpperCase() === 'UNIT' ? 'UNIT' : 'SPACE',
      category: String(category).toUpperCase() === 'UNIT' ? 'UNIT' : 'SPACE',
      AREA: body.area != null ? Number(body.area) : (body.AREA != null ? Number(body.AREA) : null),
      area: body.area != null ? Number(body.area) : (body.AREA != null ? Number(body.AREA) : null),
      LIST_PRICE: body.list_price != null ? Number(body.list_price) : (body.LIST_PRICE != null ? Number(body.LIST_PRICE) : null),
      list_price: body.list_price != null ? Number(body.list_price) : (body.LIST_PRICE != null ? Number(body.LIST_PRICE) : null),
      AVAILABILITY_STATUS: body.status ?? body.STATUS ?? 'VACANT',
      STATUS: body.status ?? body.STATUS ?? 'VACANT',
      status: body.status ?? body.STATUS ?? 'VACANT',
      UNIT_ICON: 'office',
      LEASE_ID: null,
      TENANT_ID: null
    };
    SPACES.push(space);
    saveSpaces();
    res.status(201).json({ success: true, data: space });
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const SPACES = getSpaces();
    const space = SPACES.find(s => s.SPACE_ID === req.params.id || s.space_id === req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }

    const property = PROPERTIES.find(p => p.PROPERTY_ID === space.PROPERTY_ID);
    const lease = LEASES.find(l => l.SPACE_ID === space.SPACE_ID && l.STATUS === 'ACTIVE');
    const tenant = lease ? TENANTS.find(t => t.TENANT_ID === lease.TENANT_ID) : null;

    res.json({
      success: true,
      data: {
        ...space,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null,
        LEASE: lease
      }
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch space' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const SPACES = getSpaces();
    const id = String(req.params.id || '').trim();
    const idx = SPACES.findIndex(s => String(s.SPACE_ID ?? s.space_id ?? '') === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }
    SPACES.splice(idx, 1);
    saveSpaces();
    res.json({ success: true, message: 'Space/unit deleted' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;