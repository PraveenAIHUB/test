/**
 * AI API - property description, price recommendation, floor layout suggestions
 * Set OPENAI_API_KEY in .env for real OpenAI calls; otherwise returns stub suggestions
 */
const express = require('express');
const router = express.Router();

function buildFallbackFloorPlanDiagram(spaces = []) {
  const palette = ['#f6efbe', '#f8dbbd', '#dce9f9', '#d9f0cf'];
  const slots = [
    { left: 2, top: 2, width: 44, height: 39 },
    { left: 54, top: 2, width: 44, height: 39 },
    { left: 2, top: 45, width: 44, height: 53 },
    { left: 54, top: 45, width: 44, height: 53 }
  ];
  return {
    rooms: spaces.slice(0, 4).map((s, i) => ({
      code: s.code || `UNIT-${i + 1}`,
      area_label: s.area_label || '0 SQT',
      left: slots[i].left,
      top: slots[i].top,
      width: slots[i].width,
      height: slots[i].height,
      color: palette[i]
    })),
    center: { title: 'ELEV', subtitle: 'RESTROOMS' }
  };
}

router.post('/property-description', async (req, res) => {
  try {
    const { property_name, property_type, city, total_area, total_floors } = req.body || {};
    const name = property_name || 'Property';
    const type = (property_type || 'COMMERCIAL').replace('_', ' ');
    const location = city || '';
    const area = total_area ? `${total_area} sqm` : '';
    const floors = total_floors ? `${total_floors} floors` : '';
    const stub = `${name} is a ${type} property${location ? ` in ${location}` : ''}.${area ? ` Total area: ${area}.` : ''} ${floors ? floors + '.' : ''} Prime location with excellent connectivity and modern amenities.`;
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Write a short professional property description in one paragraph for: ${name}, ${type}, ${location}. Area: ${area}. Floors: ${floors}.` }],
            max_tokens: 150
          });
          const text = completion.choices?.[0]?.message?.content?.trim();
          if (text) return res.json({ success: true, data: { description: text } });
        }
      } catch (e) {
        console.warn('OpenAI property-description fallback:', e.message);
      }
    }
    res.json({ success: true, data: { description: stub } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/price-recommendation', async (req, res) => {
  try {
    const { property_type, area_sqm, city, currency = 'KES' } = req.body || {};
    const area = Number(area_sqm) || 100;
    const rates = { COMMERCIAL: 1200, RESIDENTIAL: 800, INDUSTRIAL: 450, MIXED_USE: 900 };
    const rate = rates[property_type] || rates.COMMERCIAL;
    const suggested = Math.round(area * rate * (city ? 1.1 : 1));
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Suggest monthly rent in ${currency} for ${property_type} space, ${area} sqm, ${city || 'general'} location. Reply with one number only.` }],
            max_tokens: 20
          });
          const text = completion.choices?.[0]?.message?.content?.trim();
          const num = parseInt(String(text).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num) && num > 0) return res.json({ success: true, data: { suggested_price: num, currency } });
        }
      } catch (e) {
        console.warn('OpenAI price-recommendation fallback:', e.message);
      }
    }
    res.json({ success: true, data: { suggested_price: suggested, currency } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/search-units
 * Natural language search for commercial units (e.g. "2000 sq ft office on second floor")
 */
router.post('/search-units', async (req, res) => {
  try {
    const { query } = req.body || {};
    const q = String(query || '').toLowerCase();
    // Stub: in production call space API and filter by parsed criteria; optional OpenAI to parse query
    const areaMatch = q.match(/(\d+)\s*(sq\s*ft|sqft|sq\.?\s*ft|sqm|m²|square\s*feet)/);
    const floorMatch = q.match(/(\d+)(st|nd|rd|th)?\s*floor|floor\s*(\d+)/);
    const typeMatch = q.match(/office|retail|shop|meeting\s*space|workspace|commercial/);
    const areaSqm = areaMatch ? (areaMatch[2].includes('sqm') || areaMatch[2].includes('m²') ? parseInt(areaMatch[1], 10) : Math.round(parseInt(areaMatch[1], 10) / 10.764)) : null;
    const floorNum = floorMatch ? (parseInt(floorMatch[1], 10) || parseInt(floorMatch[3], 10)) : null;
    const unitType = typeMatch ? typeMatch[0].replace(/\s+/, '_').toUpperCase() : null;
    res.json({
      success: true,
      data: {
        parsed: { area_sqm: areaSqm, floor_number: floorNum, unit_type: unitType },
        hint: 'Use GET /api/space with filters (area, floor_number, space_type) to fetch matching units. This endpoint returns parsed criteria from natural language.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/property-from-text', async (req, res) => {
  try {
    const { text } = req.body || {};
    const t = String(text || '').trim();
    const stub = {
      property_name: t.slice(0, 100) || 'New Property',
      property_type: 'COMMERCIAL',
      address: '',
      city: '',
      total_area: null,
      total_floors: null,
      description: t
    };
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `From this rough property description, extract JSON with: property_name, property_type (COMMERCIAL/RESIDENTIAL/INDUSTRIAL/MIXED_USE), address, city, total_area (number), total_floors (number), description. Only valid JSON. Text: ${t.slice(0, 500)}` }],
            max_tokens: 300
          });
          const content = completion.choices?.[0]?.message?.content?.trim();
          const jsonMatch = content && content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({ success: true, data: { ...stub, ...parsed } });
          }
        }
      } catch (e) {
        console.warn('OpenAI property-from-text fallback:', e.message);
      }
    }
    res.json({ success: true, data: stub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/floor-layout-suggestion', async (req, res) => {
  try {
    const { floor_number, total_units, property_type } = req.body || {};
    const units = Number(total_units) || 4;
    const grid = Math.ceil(Math.sqrt(units));
    const layout = {
      rows: grid,
      cols: grid,
      units: Array.from({ length: units }, (_, i) => ({
        id: i + 1,
        row: Math.floor(i / grid),
        col: i % grid,
        label: `Unit ${i + 1}`
      }))
    };
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Suggest a simple floor layout for ${property_type} building, floor ${floor_number || 1}, ${units} units. Reply with JSON only: { "rows": number, "cols": number, "units": [ {"id":1,"row":0,"col":0} ] }` }],
            max_tokens: 200
          });
          const text = completion.choices?.[0]?.message?.content?.trim();
          const parsed = JSON.parse(text || '{}');
          if (parsed.rows && parsed.units) return res.json({ success: true, data: parsed });
        }
      } catch (e) {
        console.warn('OpenAI floor-layout fallback:', e.message);
      }
    }
    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/floor-plan-diagram', async (req, res) => {
  try {
    const { spaces = [], user_prompt = '', style_reference = '' } = req.body || {};
    const normalized = (Array.isArray(spaces) ? spaces : []).map((s, idx) => {
      const areaRaw = Number(s.area_sqm ?? s.area ?? 0) || 0;
      const sqft = areaRaw <= 120 ? Math.round(areaRaw * 10.7639) : Math.round(areaRaw);
      return {
        code: s.code || s.space_code || `UNIT-${idx + 1}`,
        area_label: `${sqft} SQT`,
        area_value: sqft
      };
    }).sort((a, b) => b.area_value - a.area_value);

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ success: true, data: buildFallbackFloorPlanDiagram(normalized) });
    }

    try {
      const openai = await import('openai').then(m => m.default).catch(() => null);
      if (!openai) {
        return res.json({ success: true, data: buildFallbackFloorPlanDiagram(normalized) });
      }
      const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Return ONLY valid JSON with key "rooms" (max 4 items) and optional key "center". Each room requires: code, area_label, left, top, width, height, color. left/top/width/height are percentages (0-100) and must keep rooms in a 2x2 around center. No markdown.'
          },
          {
            role: 'user',
            content: `Create a floor plan layout style matching this instruction: "${user_prompt || 'my floor 300sqt and 400 sqt space and 400 sqt unit and 500 sqt unit create one floor plan diagram'}".\nSpaces: ${JSON.stringify(normalized.slice(0, 8))}\nStyle reference: ${style_reference || 'light gray central core with ELEV/RESTROOMS and 4 color blocks around it'}`
          }
        ],
        max_tokens: 500
      });
      const raw = completion.choices?.[0]?.message?.content?.trim() || '';
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      let parsed = null;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (_) {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      if (!parsed || !Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
        return res.json({ success: true, data: buildFallbackFloorPlanDiagram(normalized) });
      }
      return res.json({
        success: true,
        data: {
          rooms: parsed.rooms.slice(0, 4),
          center: parsed.center && typeof parsed.center === 'object'
            ? parsed.center
            : { title: 'ELEV', subtitle: 'RESTROOMS' }
        }
      });
    } catch (aiErr) {
      console.warn('OpenAI floor-plan-diagram fallback:', aiErr.message);
      return res.json({ success: true, data: buildFallbackFloorPlanDiagram(normalized) });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
