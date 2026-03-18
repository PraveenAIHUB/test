/**
 * Rooms API - Property hierarchy: Unit/Space -> Rooms (with dimensions)
 */
const express = require('express');
const router = express.Router();
const { ROOMS, SPACES } = require('../data/kenyaProductionData');

function calcArea(len, wid) {
  if (len != null && wid != null && !isNaN(len) && !isNaN(wid)) return Number((len * wid).toFixed(2));
  return null;
}

router.get('/', (req, res) => {
  try {
    const { space_id } = req.query;
    let list = [...ROOMS];
    if (space_id) list = list.filter(r => r.SPACE_ID === space_id || r.space_id === space_id);
    const enriched = list.map(r => {
      const space = SPACES.find(s => s.SPACE_ID === r.SPACE_ID);
      return { ...r, SPACE_CODE: space ? space.SPACE_CODE : null, SPACE_NAME: space ? space.SPACE_NAME : null };
    });
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const room = ROOMS.find(r => r.ROOM_ID === req.params.id || r.room_id === req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    const space = SPACES.find(s => s.SPACE_ID === room.SPACE_ID);
    res.json({ success: true, data: { ...room, SPACE_CODE: space ? space.SPACE_CODE : null } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const length_m = body.length_m != null ? Number(body.length_m) : body.LENGTH_M;
    const width_m = body.width_m != null ? Number(body.width_m) : body.WIDTH_M;
    const area_sqm = body.area_sqm != null ? Number(body.area_sqm) : (calcArea(length_m, width_m) || body.AREA_SQM);
    const id = 'ROM-' + Date.now();
    const room = {
      ROOM_ID: id,
      SPACE_ID: body.space_id || body.SPACE_ID,
      ROOM_TYPE: body.room_type || body.ROOM_TYPE || 'OTHER',
      ROOM_NAME: body.room_name || body.ROOM_NAME || '',
      LENGTH_M: length_m,
      WIDTH_M: width_m,
      AREA_SQM: area_sqm
    };
    ROOMS.push(room);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const idx = ROOMS.findIndex(r => r.ROOM_ID === req.params.id || r.room_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Room not found' });
    const body = req.body || {};
    const r = ROOMS[idx];
    if (body.room_type != null) r.ROOM_TYPE = body.room_type;
    if (body.room_name != null) r.ROOM_NAME = body.room_name;
    if (body.length_m != null) r.LENGTH_M = Number(body.length_m);
    if (body.width_m != null) r.WIDTH_M = Number(body.width_m);
    if (body.area_sqm != null) r.AREA_SQM = Number(body.area_sqm);
    else if (r.LENGTH_M != null && r.WIDTH_M != null) r.AREA_SQM = calcArea(r.LENGTH_M, r.WIDTH_M);
    res.json({ success: true, data: r });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const idx = ROOMS.findIndex(r => r.ROOM_ID === req.params.id || r.room_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Room not found' });
    ROOMS.splice(idx, 1);
    res.json({ success: true, message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
