/**
 * Amenities API - Property/floor level shared spaces (gym, meeting room, parking, etc.)
 */
const express = require('express');
const router = express.Router();
const { AMENITIES, PROPERTIES, FLOORS } = require('../data/kenyaProductionData');

router.get('/', (req, res) => {
  try {
    const { property_id, floor_id } = req.query;
    let list = [...AMENITIES];
    if (property_id) list = list.filter(a => a.PROPERTY_ID === property_id || a.property_id === property_id);
    if (floor_id) list = list.filter(a => a.FLOOR_ID === floor_id || a.floor_id === floor_id);
    const enriched = list.map(a => {
      const prop = PROPERTIES.find(p => p.PROPERTY_ID === a.PROPERTY_ID);
      const floor = a.FLOOR_ID ? FLOORS.find(f => f.FLOOR_ID === a.FLOOR_ID) : null;
      return {
        ...a,
        PROPERTY_NAME: prop ? prop.PROPERTY_NAME : null,
        FLOOR_NAME: floor ? floor.FLOOR_NAME : null
      };
    });
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const amenity = AMENITIES.find(a => a.AMENITY_ID === req.params.id || a.amenity_id === req.params.id);
    if (!amenity) return res.status(404).json({ success: false, error: 'Amenity not found' });
    const prop = PROPERTIES.find(p => p.PROPERTY_ID === amenity.PROPERTY_ID);
    const floor = amenity.FLOOR_ID ? FLOORS.find(f => f.FLOOR_ID === amenity.FLOOR_ID) : null;
    res.json({
      success: true,
      data: {
        ...amenity,
        PROPERTY_NAME: prop ? prop.PROPERTY_NAME : null,
        FLOOR_NAME: floor ? floor.FLOOR_NAME : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const id = 'AMN-' + Date.now();
    const amenity = {
      AMENITY_ID: id,
      PROPERTY_ID: body.property_id || body.PROPERTY_ID,
      FLOOR_ID: body.floor_id || body.FLOOR_ID || null,
      AMENITY_NAME: body.amenity_name || body.AMENITY_NAME || 'Amenity',
      AMENITY_TYPE: body.amenity_type || body.AMENITY_TYPE || 'OTHER',
      AREA_SQM: body.area_sqm != null ? Number(body.area_sqm) : body.AREA_SQM,
      DESCRIPTION: body.description || body.DESCRIPTION || null,
      IMAGE_URL: body.image_url || body.IMAGE_URL || null
    };
    AMENITIES.push(amenity);
    res.status(201).json({ success: true, data: amenity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const idx = AMENITIES.findIndex(a => a.AMENITY_ID === req.params.id || a.amenity_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Amenity not found' });
    const body = req.body || {};
    const a = AMENITIES[idx];
    if (body.amenity_name != null) a.AMENITY_NAME = body.amenity_name;
    if (body.amenity_type != null) a.AMENITY_TYPE = body.amenity_type;
    if (body.floor_id !== undefined) a.FLOOR_ID = body.floor_id || null;
    if (body.area_sqm != null) a.AREA_SQM = Number(body.area_sqm);
    if (body.description !== undefined) a.DESCRIPTION = body.description;
    if (body.image_url !== undefined) a.IMAGE_URL = body.image_url;
    res.json({ success: true, data: a });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const idx = AMENITIES.findIndex(a => a.AMENITY_ID === req.params.id || a.amenity_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Amenity not found' });
    AMENITIES.splice(idx, 1);
    res.json({ success: true, message: 'Amenity deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
