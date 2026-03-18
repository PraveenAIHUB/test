const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const { PROPERTIES } = require('../data/kenyaProductionData');
const { getFloors, getSpaces, saveFloors, saveSpaces } = require('../data/floorSpaceStorage');

const uploadDir = path.join(__dirname, '..', 'uploads', 'floor');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const uploadFloor = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(dxf|dwg|pdf|jpg|jpeg|png|gif|webp)$/i.test(file.originalname || '');
    if (ok) cb(null, true);
    else cb(new Error('Allowed: DXF, DWG, PDF, or images (JPG, PNG, GIF, WebP)'));
  }
});

router.get('/', (req, res) => {
  try {
    const { property_id } = req.query;
    const FLOORS = getFloors();
    let list = [...FLOORS];
    if (property_id) list = list.filter(f => f.PROPERTY_ID === property_id || f.property_id === property_id);
    const enriched = list.map(f => {
      const prop = PROPERTIES.find(p => p.PROPERTY_ID === f.PROPERTY_ID || p.property_id === f.PROPERTY_ID);
      return { ...f, PROPERTY_NAME: prop ? prop.PROPERTY_NAME : null };
    });
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const SQM_TO_SQFT = 10.7639;
const CANVAS_W = 800;
const CANVAS_H = 600;

function computeFloorPlanLayout(floorSpaces, floorId) {
  const units = floorSpaces.filter(s => (s.CATEGORY || s.category) === 'UNIT').map(s => ({
    id: s.SPACE_ID || s.space_id,
    code: s.SPACE_CODE || s.space_code,
    type: 'unit',
    size_sqm: Number(s.AREA || s.area) || 0,
    size: Math.round((Number(s.AREA || s.area) || 0) * SQM_TO_SQFT),
    status: s.STATUS || s.occupancy_status || 'VACANT'
  }));
  const spaces = floorSpaces.filter(s => (s.CATEGORY || s.category) !== 'UNIT').map(s => ({
    id: s.SPACE_ID || s.space_id,
    code: s.SPACE_CODE || s.space_code,
    type: 'space',
    size_sqm: Number(s.AREA || s.area) || 0,
    size: Math.round((Number(s.AREA || s.area) || 0) * SQM_TO_SQFT),
    status: s.STATUS || s.occupancy_status || 'VACANT'
  }));
  const all = [...units, ...spaces].filter(b => b.size > 0);
  const paletteUnit = ['#f6efbe', '#f8dbbd', '#dce9f9', '#d9f0cf', '#e8d4f0', '#d4e8e8'];
  const paletteSpace = ['#c8e6c9', '#fff9c4', '#ffccbc'];
  const sorted = [...all].sort((a, b) => b.size - a.size);
  const rowCount = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
  const colCount = Math.max(1, Math.ceil(sorted.length / rowCount));
  const margin = 12;
  const gap = 8;
  const cellW = (CANVAS_W - 2 * margin - (colCount - 1) * gap) / colCount;
  const cellH = (CANVAS_H - 2 * margin - (rowCount - 1) * gap) / rowCount;
  const layout = sorted.map((b, i) => {
    const row = Math.floor(i / colCount);
    const col = i % colCount;
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);
    const color = b.type === 'unit' ? paletteUnit[i % paletteUnit.length] : paletteSpace[i % paletteSpace.length];
    return {
      id: b.id,
      code: b.code,
      type: b.type,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(cellW),
      height: Math.round(cellH),
      size: b.size,
      color,
      status: b.status
    };
  });
  const core = { x: 280, y: 180, width: 240, height: 240, label: 'ELEV', subtitle: 'RESTROOMS' };
  return {
    floorId: floorId || null,
    layout,
    core,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H
  };
}

router.get('/floor-plan', (req, res) => {
  try {
    const property_id = String(req.query.property_id || '').trim();
    const floor_number = req.query.floor_number != null && req.query.floor_number !== '' ? String(req.query.floor_number) : null;
    const force_regenerate = req.query.force_regenerate === '1' || req.query.force_regenerate === 'true';
    if (!property_id) return res.status(400).json({ success: false, error: 'property_id required' });
    const FLOORS = getFloors();
    const SPACES = getSpaces();
    const floor = FLOORS.find(f => (f.PROPERTY_ID || f.property_id) === property_id && (floor_number == null || String(f.FLOOR_NUMBER ?? f.floor_number) === String(floor_number)));
    const floorId = floor ? (floor.FLOOR_ID || floor.floor_id) : null;
    const floorNum = floor ? (floor.FLOOR_NUMBER ?? floor.floor_number) : floor_number;
    const floorSpaces = SPACES.filter(s => {
      const pid = String(s.PROPERTY_ID || s.property_id || '').trim();
      const fn = s.FLOOR ?? s.floor_number;
      return pid === property_id && (floorNum != null && String(fn) === String(floorNum));
    });
    const stored = floor && floor.FLOOR_PLAN_LAYOUT_DATA && !force_regenerate;
    let data;
    if (stored && Array.isArray(floor.FLOOR_PLAN_LAYOUT_DATA.layout) && floor.FLOOR_PLAN_LAYOUT_DATA.layout.length > 0) {
      data = { ...floor.FLOOR_PLAN_LAYOUT_DATA, floorId, floorNumber: floorNum, propertyId: property_id };
    } else {
      const computed = computeFloorPlanLayout(floorSpaces, floorId);
      data = { ...computed, floorNumber: floorNum, propertyId: property_id };
      if (floor && computed.layout.length > 0) {
        const idx = FLOORS.findIndex(f => (f.FLOOR_ID || f.floor_id) === floorId);
        if (idx !== -1) {
          FLOORS[idx].FLOOR_PLAN_LAYOUT_DATA = { floorId: computed.floorId, layout: computed.layout, core: computed.core, canvasWidth: computed.canvasWidth, canvasHeight: computed.canvasHeight };
          saveFloors();
        }
      }
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Floor plan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id/layout', (req, res) => {
  try {
    const FLOORS = getFloors();
    const idx = FLOORS.findIndex(f => f.FLOOR_ID === req.params.id || f.floor_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Floor not found' });
    const body = req.body || {};
    const layoutData = body.layout != null ? body.layout : (body.FLOOR_PLAN_LAYOUT_DATA || body);
    FLOORS[idx].FLOOR_PLAN_LAYOUT_DATA = {
      floorId: FLOORS[idx].FLOOR_ID || FLOORS[idx].floor_id,
      layout: Array.isArray(layoutData.layout) ? layoutData.layout : (layoutData.layout || []),
      core: layoutData.core || { x: 280, y: 180, width: 240, height: 240, label: 'ELEV', subtitle: 'RESTROOMS' },
      canvasWidth: layoutData.canvasWidth || CANVAS_W,
      canvasHeight: layoutData.canvasHeight || CANVAS_H
    };
    saveFloors();
    res.json({ success: true, data: FLOORS[idx].FLOOR_PLAN_LAYOUT_DATA });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const FLOORS = getFloors();
    const floor = FLOORS.find(f => f.FLOOR_ID === req.params.id || f.floor_id === req.params.id);
    if (!floor) return res.status(404).json({ success: false, error: 'Floor not found' });
    const prop = PROPERTIES.find(p => p.PROPERTY_ID === floor.PROPERTY_ID);
    res.json({ success: true, data: { ...floor, PROPERTY_NAME: prop ? prop.PROPERTY_NAME : null } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const FLOORS = getFloors();
    const body = req.body || {};
    const id = 'FLR-' + Date.now();
    const floor = {
      FLOOR_ID: id,
      floor_id: id,
      PROPERTY_ID: body.property_id || body.PROPERTY_ID,
      FLOOR_NUMBER: body.floor_number ?? body.FLOOR_NUMBER ?? 1,
      FLOOR_NAME: body.floor_name || body.FLOOR_NAME || ('Floor ' + (body.floor_number || 1)),
      FLOOR_PLAN_IMAGE_URL: body.floor_plan_image_url || body.FLOOR_PLAN_IMAGE_URL || null,
      FLOOR_PLAN_LAYOUT: body.floor_plan_layout || body.FLOOR_PLAN_LAYOUT || null,
      FLOOR_PLAN_LAYOUT_DATA: null
    };
    FLOORS.push(floor);
    saveFloors();
    res.status(201).json({ success: true, data: floor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/floors/parse-layout
 * Upload floor layout (PDF/DXF/image), AI extracts spaces/units, returns diagram data + list to create spaces
 */
router.post('/parse-layout', uploadFloor.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const property_id = String(req.body.property_id || '').trim();
    const floor_id = String(req.body.floor_id || '').trim();
    const floor_number = req.body.floor_number != null && req.body.floor_number !== '' ? Number(req.body.floor_number) : null;
    const rawName = req.file.originalname || req.file.filename || '';
    const ext = (path.extname(rawName) || '').toLowerCase() || '.jpg';

    let content = '';
    if (ext === '.pdf') {
      try {
        const buf = fs.readFileSync(req.file.path);
        const pdfParse = await import('pdf-parse').catch(() => null);
        const PDFParse = pdfParse?.PDFParse ?? pdfParse?.default?.PDFParse ?? pdfParse?.default;
        if (PDFParse) {
          const parser = new PDFParse({ data: buf });
          const textResult = await parser.getText();
          content = (textResult && textResult.text) ? String(textResult.text) : '';
          await parser.destroy().catch(() => {});
        }
      } catch (e) {
        content = '';
      }
    } else if (ext === '.dxf') {
      try {
        const DxfParser = require('dxf-parser');
        const dxfString = fs.readFileSync(req.file.path, 'utf8');
        const parser = new DxfParser();
        const dxf = parser.parseSync(dxfString);
        const texts = (dxf.entities || []).map(e => (e.text || '').toString().trim()).filter(Boolean);
        content = texts.join('\n');
      } catch (e) {
        content = '';
      }
    }

    const moveAndGetUrl = () => {
      const newName = path.join(uploadDir, `floor-${Date.now()}${ext}`);
      try {
        fs.renameSync(req.file.path, newName);
        return `/uploads/floor/${path.basename(newName)}`;
      } catch (_) {
        return req.file.path ? `/uploads/floor/${path.basename(req.file.path)}` : null;
      }
    };
    const floor_plan_image_url = moveAndGetUrl();

    let spaces = [];
    const promptContent = content.slice(0, 4000) || 'Floor plan uploaded (image or no extractable text). Suggest 4–8 typical units for an office floor.';
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You extract a list of spaces/units from floor plan text or labels. Reply with ONLY a JSON object, no other text. Use key: spaces (array). Each element: { code: string (e.g. "101", "A"), area_sqm: number or null, type: string (e.g. OFFICE, RETAIL) }. If no clear units found, suggest 4–8 generic units (101, 102, …) with estimated areas.'
              },
              { role: 'user', content: `Extract spaces/units from this floor plan content:\n\n${promptContent}` }
            ],
            max_tokens: 800
          });
          const raw = (completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) ? completion.choices[0].message.content.trim() : '';
          const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
          let data;
          try {
            data = JSON.parse(jsonStr);
          } catch (_) {
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
          }
          if (data && Array.isArray(data.spaces)) {
            spaces = data.spaces.map(s => ({
              code: s.code || s.space_code || String(s),
              area_sqm: s.area_sqm != null ? Number(s.area_sqm) : (s.area != null ? Number(s.area) : null),
              type: (s.type || s.space_type || 'OFFICE').toUpperCase().replace(/\s+/g, '_')
            }));
          }
        }
      } catch (aiErr) {
        console.warn('Floor layout AI extraction failed:', aiErr.message);
      }
    }
    if (spaces.length === 0) {
      spaces = [
        { code: '101', area_sqm: 50, type: 'OFFICE' },
        { code: '102', area_sqm: 45, type: 'OFFICE' },
        { code: '103', area_sqm: 60, type: 'OFFICE' },
        { code: '104', area_sqm: 40, type: 'OFFICE' }
      ];
    }

    const cols = 4;
    const rows = Math.ceil(spaces.length / cols);
    const diagram = {
      cols,
      rows,
      cells: spaces.map((_, index) => ({ index, row: Math.floor(index / cols), col: index % cols }))
    };

    return res.json({
      success: true,
      data: {
        floor_plan_image_url,
        spaces,
        diagram,
        message: `Parsed ${spaces.length} unit(s). Review and use "Create spaces from layout" to add them to this floor.`
      }
    });
  } catch (err) {
    console.error('Parse floor layout error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to parse layout' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const idx = FLOORS.findIndex(f => f.FLOOR_ID === req.params.id || f.floor_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Floor not found' });
    const body = req.body || {};
    const f = FLOORS[idx];
    if (body.floor_number != null) f.FLOOR_NUMBER = body.floor_number;
    if (body.floor_name != null) f.FLOOR_NAME = body.floor_name;
    if (body.floor_plan_image_url != null) f.FLOOR_PLAN_IMAGE_URL = body.floor_plan_image_url;
    if (body.floor_plan_layout != null) f.FLOOR_PLAN_LAYOUT = body.floor_plan_layout;
    if (body.FLOOR_PLAN_LAYOUT_DATA !== undefined) f.FLOOR_PLAN_LAYOUT_DATA = body.FLOOR_PLAN_LAYOUT_DATA;
    res.json({ success: true, data: f });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const FLOORS = getFloors();
    const SPACES = getSpaces();
    const floor = FLOORS.find(f => f.FLOOR_ID === req.params.id || f.floor_id === req.params.id);
    if (!floor) return res.status(404).json({ success: false, error: 'Floor not found' });
    const propId = String(floor.PROPERTY_ID || floor.property_id || '').trim();
    const floorNum = floor.FLOOR_NUMBER ?? floor.floor_number;
    for (let i = SPACES.length - 1; i >= 0; i--) {
      const s = SPACES[i];
      const sProp = String(s.PROPERTY_ID || s.property_id || '').trim();
      const sFloor = s.FLOOR ?? s.floor_number;
      if (sProp === propId && String(sFloor) === String(floorNum)) {
        SPACES.splice(i, 1);
      }
    }
    const idx = FLOORS.findIndex(f => f.FLOOR_ID === req.params.id || f.floor_id === req.params.id);
    FLOORS.splice(idx, 1);
    saveSpaces();
    saveFloors();
    res.json({ success: true, message: 'Floor deleted and its spaces/units removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
