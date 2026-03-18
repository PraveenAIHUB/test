/**
 * Property Management Routes
 * Handles property portfolio, property master data, and property operations
 * Uses database when configured; falls back to mock data.
 */

const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const DxfParser = require('dxf-parser');
const { body, param, query, validationResult } = require('express-validator');
const PropertyService = require('../services/PropertyService');
const db = require('../config/database');
const { PROPERTIES, EMPLOYEES, SPACES, LEASES } = require('../data/kenyaProductionData');

const cadUploadDir = path.join(__dirname, '..', 'uploads', 'cad');
if (!fs.existsSync(cadUploadDir)) fs.mkdirSync(cadUploadDir, { recursive: true });
const uploadCad = multer({
  dest: cadUploadDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(dxf|dwg|pdf)$/i.test(file.originalname || '');
    if (ok) cb(null, true);
    else cb(new Error('Only DXF, DWG, or PDF allowed for CAD upload'));
  }
});

// Initialize PropertyService with production data (fallback)
const propertyService = new PropertyService(PROPERTIES, LEASES, SPACES);

function rowToProperty(r) {
  const id = r.PROPERTY_ID ?? r.property_id;
  return {
    PROPERTY_ID: id,
    property_id: id,
    PROPERTY_CODE: r.PROPERTY_CODE ?? r.property_code,
    property_code: r.PROPERTY_CODE ?? r.property_code,
    PROPERTY_NAME: r.PROPERTY_NAME ?? r.property_name,
    property_name: r.PROPERTY_NAME ?? r.property_name,
    PROJECT_NAME: r.PROJECT_NAME ?? r.project_name,
    project_name: r.PROJECT_NAME ?? r.project_name,
    PROPERTY_TYPE: r.PROPERTY_TYPE ?? r.property_type,
    property_type: r.PROPERTY_TYPE ?? r.property_type,
    STATUS: r.STATUS ?? r.status,
    status: r.STATUS ?? r.status,
    ADDRESS: r.ADDRESS_LINE1 ?? r.address_line1 ?? '',
    address: r.ADDRESS_LINE1 ?? r.address_line1 ?? '',
    ADDRESS_LINE1: r.ADDRESS_LINE1 ?? r.address_line1,
    CITY: r.CITY ?? r.city,
    city: r.CITY ?? r.city,
    STATE: r.STATE ?? r.state,
    state: r.STATE ?? r.state,
    COUNTY: r.COUNTY ?? r.county,
    county: r.COUNTY ?? r.county,
    COUNTRY: r.COUNTRY ?? r.country,
    country: r.COUNTRY ?? r.country,
    ZIP_CODE: r.POSTAL_CODE ?? r.postal_code,
    zip_code: r.POSTAL_CODE ?? r.postal_code,
    POSTAL_CODE: r.POSTAL_CODE ?? r.postal_code,
    TOTAL_AREA: r.TOTAL_AREA ?? r.total_area,
    total_area: r.TOTAL_AREA ?? r.total_area,
    NUMBER_OF_UNITS: r.TOTAL_UNITS ?? r.total_units,
    number_of_units: r.TOTAL_UNITS ?? r.total_units,
    TOTAL_UNITS: r.TOTAL_UNITS ?? r.total_units,
    TOTAL_FLOORS: r.TOTAL_FLOORS ?? r.total_floors ?? r.FLOORS ?? r.floors,
    total_floors: r.TOTAL_FLOORS ?? r.total_floors ?? r.FLOORS ?? r.floors,
    LATITUDE: r.LATITUDE ?? r.latitude,
    latitude: r.LATITUDE ?? r.latitude,
    LONGITUDE: r.LONGITUDE ?? r.longitude,
    longitude: r.LONGITUDE ?? r.longitude,
    IMAGE_URL: r.IMAGE_URL ?? r.image_url,
    image_url: r.IMAGE_URL ?? r.image_url,
    DESCRIPTION: r.DESCRIPTION ?? r.description,
    description: r.DESCRIPTION ?? r.description,
    YEAR_BUILT: r.YEAR_BUILT ?? r.year_built,
    year_built: r.YEAR_BUILT ?? r.year_built
  };
}

function bodyToPropertyInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  return {
    property_code: b.property_code || b.PROPERTY_CODE || `PROP-${Date.now()}`,
    property_name: String(b.property_name ?? b.PROPERTY_NAME ?? '').trim(),
    project_name: b.project_name ?? b.PROJECT_NAME ?? null,
    property_type: b.property_type || b.PROPERTY_TYPE || 'COMMERCIAL',
    status: b.status || b.STATUS || 'ACTIVE',
    address_line1: String(b.address ?? b.ADDRESS ?? b.address_line1 ?? '').trim(),
    address_line2: b.address_line2 || b.ADDRESS_LINE2 || null,
    city: String(b.city ?? b.CITY ?? '').trim(),
    state: String(b.state ?? b.STATE ?? '').trim(),
    county: b.county ?? b.COUNTY ?? null,
    country: String(b.country ?? b.COUNTRY ?? 'USA').trim(),
    postal_code: String(b.zip_code ?? b.postal_code ?? b.ZIP_CODE ?? '').trim(),
    total_area: b.total_area != null && b.total_area !== '' ? Number(b.total_area) : null,
    total_units: b.number_of_units != null && b.number_of_units !== '' ? Number(b.number_of_units) : (b.total_units != null ? Number(b.total_units) : null),
    total_floors: b.total_floors != null && b.total_floors !== '' ? Number(b.total_floors) : (b.FLOORS ?? null),
    latitude: b.latitude != null && b.latitude !== '' ? Number(b.latitude) : (b.LATITUDE ?? null),
    longitude: b.longitude != null && b.longitude !== '' ? Number(b.longitude) : (b.LONGITUDE ?? null),
    image_url: b.image_url ?? b.IMAGE_URL ?? null,
    description: b.description ?? b.DESCRIPTION ?? null,
    year_built: b.year_built != null && b.year_built !== '' ? Number(b.year_built) : null
  };
}

/**
 * GET /api/properties/stats
 * Get dashboard statistics for properties
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await propertyService.getStatistics();
    const enrichedProperties = await propertyService.enrichMany(PROPERTIES);

    // Calculate occupancy by property
    const propertyOccupancy = enrichedProperties.map(prop => ({
      property: prop.PROPERTY_NAME,
      occupied: prop.OCCUPIED_SPACE_COUNT || 0,
      total: prop.SPACE_COUNT || 0,
      percentage: prop.OCCUPANCY_RATE || 0
    }));

    // Revenue by property
    const revenueByProperty = enrichedProperties
      .sort((a, b) => (b.MONTHLY_REVENUE || 0) - (a.MONTHLY_REVENUE || 0))
      .slice(0, 5)
      .map(p => ({
        property: p.PROPERTY_NAME,
        revenue: p.MONTHLY_REVENUE || 0,
        percentage: stats.totalMonthlyRevenue > 0
          ? (((p.MONTHLY_REVENUE || 0) / stats.totalMonthlyRevenue) * 100).toFixed(1) + '%'
          : '0%'
      }));

    // Type distribution
    const colors = { COMMERCIAL: '#2C5F6F', INDUSTRIAL: '#6B4C9A', MIXED_USE: '#00758F', RESIDENTIAL: '#FF6B35' };
    const typeDistribution = Object.entries(stats.byType).map(([type, data]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.count,
      percentage: ((data.count / stats.total) * 100).toFixed(1),
      value: data.value,
      color: colors[type] || '#999999'
    }));

    // Location distribution
    const propertiesByLocation = Object.entries(stats.byLocation).map(([location, data]) => ({
      location,
      count: data.count,
      value: data.value
    }));

    // Status distribution
    const propertyStatus = [
      { status: 'Active', count: stats.active, percentage: ((stats.active / stats.total) * 100).toFixed(1) },
      { status: 'Inactive', count: stats.inactive, percentage: ((stats.inactive / stats.total) * 100).toFixed(1) },
      { status: 'Under Construction', count: stats.underConstruction, percentage: ((stats.underConstruction / stats.total) * 100).toFixed(1) }
    ];

    const responseData = {
      kpis: {
        totalProperties: stats.total,
        activeProperties: stats.active,
        totalValue: stats.totalValue,
        avgOccupancy: stats.avgOccupancy
      },
      charts: {
        revenueByProperty,
        occupancyRate: propertyOccupancy.slice(0, 5),
        typeDistribution
      },
      propertiesByType: typeDistribution,
      propertiesByLocation,
      propertyStatus
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property stats' });
  }
});

/**
 * GET /api/properties
 * Get all properties with optional filtering
 */
router.get('/', [
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'SOLD']),
  query('type').optional().isIn(['COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, type, city, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (status) { where += ' AND status = :status'; countBinds.status = status; }
        if (type) { where += ' AND property_type = :property_type'; countBinds.property_type = type; }
        if (city) { where += ' AND city = :city'; countBinds.city = city; }
        if (search) { where += ' AND (UPPER(property_name) LIKE :search OR UPPER(property_code) LIKE :search)'; countBinds.search = `%${String(search).toUpperCase()}%`; }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM properties${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const fullSelect = `SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, total_floors, latitude, longitude, year_built FROM properties${where} ORDER BY property_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
        const minimalSelect = `SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, year_built FROM properties${where} ORDER BY property_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
        let result;
        try {
          result = await db.execute(fullSelect, dataBinds);
        } catch (colErr) {
          result = await db.execute(minimalSelect, dataBinds);
        }
        const data = (result.rows || []).map(r => rowToProperty(r));
        return res.json({
          success: true,
          data,
          pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
      } catch (dbErr) {
        console.error('DB fetch properties error:', dbErr);
      }
    }

    // Fallback: mock
    const filters = {};
    if (status) filters.STATUS = status;
    if (type) filters.PROPERTY_TYPE = type;
    if (city) filters.CITY = city;
    if (search) filters.search = search;
    const result = await propertyService.getAll(filters, { page: pageNum, limit: limitNum });
    const enrichedProperties = result.data.map(prop => {
      const manager = EMPLOYEES.find(e => e.EMP_ID === prop.MANAGER_ID);
      return { ...prop, MANAGER_NAME: manager ? manager.NAME : null };
    });
    res.json({
      success: true,
      data: enrichedProperties,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch properties' });
  }
});

/**
 * GET /api/properties/export?format=json|csv
 * Export all properties as JSON or CSV
 */
router.get('/export', async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const list = db.isConfigured && db.isConfigured()
      ? (await db.execute('SELECT * FROM properties ORDER BY property_id')).rows.map(r => rowToProperty(r))
      : PROPERTIES.map(p => rowToProperty(p));
    if (format === 'csv') {
      const headers = ['property_id', 'property_code', 'property_name', 'project_name', 'property_type', 'address', 'city', 'state', 'county', 'country', 'postal_code', 'total_area', 'total_units', 'total_floors', 'latitude', 'longitude', 'year_built', 'status'];
      const rows = list.map(p => headers.map(h => (p[h] ?? p[h.toUpperCase()] ?? '')).map(v => typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${String(v).replace(/"/g, '""')}"` : v).join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=properties.csv');
      return res.send(csv);
    }
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/properties/import
 * Import properties from JSON array or CSV text
 */
router.post('/import', async (req, res) => {
  try {
    let list = [];
    if (Array.isArray(req.body)) {
      list = req.body;
    } else if (req.body && Array.isArray(req.body.data)) {
      list = req.body.data;
    }
    const imported = [];
    for (const row of list) {
      const payload = bodyToPropertyInsert(row);
      if (db.isConfigured && db.isConfigured()) {
        await db.execute(
          'INSERT INTO properties (property_code, property_name, property_type, status, address_line1, city, state, country, postal_code, total_area, total_units, year_built) VALUES (:property_code, :property_name, :property_type, :status, :address_line1, :city, :state, :country, :postal_code, :total_area, :total_units, :year_built)',
          payload
        );
      } else {
        const id = 'PROP-IMP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        PROPERTIES.push({
          PROPERTY_ID: id,
          PROPERTY_CODE: payload.property_code,
          PROPERTY_NAME: payload.property_name,
          PROPERTY_TYPE: payload.property_type,
          STATUS: payload.status,
          ADDRESS: payload.address_line1,
          CITY: payload.city,
          STATE: payload.state,
          COUNTRY: payload.country,
          POSTAL_CODE: payload.postal_code,
          TOTAL_AREA: payload.total_area,
          TOTAL_UNITS: payload.total_units,
          YEAR_BUILT: payload.year_built
        });
      }
      imported.push(payload.property_name || payload.property_code);
    }
    res.json({ success: true, message: `Imported ${imported.length} properties`, imported: imported.length, names: imported });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/properties/geocode/suggest?q=...
 * Address suggestions: uses Google first when GOOGLE_MAPS_API_KEY is set, else Mapbox; merges Nominatim when few results.
 */
router.get('/geocode/suggest', async (req, res) => {
  try {
    let q = (req.query.q || req.query.query || '').trim();
    q = q.replace(/\s*[•·]\s*/g, ', ').replace(/,+\s*/g, ', ').trim();
    if (!q) return res.json({ success: true, data: [] });
    const limit = Math.min(Number(req.query.limit) || 8, 12);
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    let combined = [];

    // Prefer Google when key is set
    if (googleKey) {
      try {
        const qLower = q.toLowerCase();
        const inIndia = /chennai|india|mumbai|delhi|bangalore|hyderabad|kolkata|pune|coimbatore|madurai/i.test(qLower);
        const inChennai = /chennai/i.test(qLower);
        const looksSpecific = q.includes(',') || q.trim().split(/\s+/).length >= 3;

        // Find Place from Text: full-phrase search so "Featherlite The Address, Chennai" returns that POI (Autocomplete often splits the query)
        if (looksSpecific) {
          let findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(q)}&inputtype=textquery&fields=place_id,formatted_address,name,geometry&key=${googleKey}`;
          if (inIndia) findUrl += '&locationbias=circle:120000@13.0827,80.2707'; // bias to Chennai region
          const findResp = await fetch(findUrl);
          const findJson = await findResp.json();
          const candidates = findJson?.candidates || [];
          for (const c of candidates.slice(0, 3)) {
            if (!c.place_id) continue;
            try {
              const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(c.place_id)}&key=${googleKey}`;
              const gResp = await fetch(gUrl);
              const gData = await gResp.json();
              const r0 = gData?.results?.[0];
              if (!r0) continue;
              const loc = r0.geometry?.location || c.geometry?.location || {};
              const ac = r0.address_components || [];
              const get = (type) => ac.find(x => x.types.includes(type))?.long_name || '';
              const firstPart = (r0.formatted_address || '').split(',')[0]?.trim() || '';
              const types = r0.types || [];
              const isPoi = types.some(t => ['establishment', 'point_of_interest', 'premise'].includes(t));
              const place = {
                place_name: r0.formatted_address || c.formatted_address || c.name,
                address_line1: firstPart || get('route') || c.name || q,
                city: get('locality') || get('administrative_area_level_2') || '',
                state: get('administrative_area_level_1') || '',
                county: get('administrative_area_level_2') || get('administrative_area_level_1') || '',
                country: get('country') || '',
                postal_code: get('postal_code') || '',
                latitude: loc.lat,
                longitude: loc.lng,
                suggested_property_name: (c.name || (isPoi ? firstPart : null)) || null,
                suggested_tower: get('subpremise') || null
              };
              const key = `${place.latitude?.toFixed(5)}_${place.longitude?.toFixed(5)}`;
              if (!combined.some((r) => `${r.latitude?.toFixed(5)}_${r.longitude?.toFixed(5)}` === key)) combined.unshift(place);
            } catch (_) { /* skip */ }
          }
        }

        // Autocomplete for incremental suggestions
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${googleKey}`;
        if (inIndia) url += '&components=country:in';
        if (inChennai) url += '&location=13.0827,80.2707&radius=80000';
        const resp = await fetch(url);
        const auto = await resp.json();
        const predictions = auto?.predictions || [];
        if (predictions.length > 0) {
          const details = await Promise.all(
            predictions.slice(0, limit).map(async (p) => {
              const detailUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${p.place_id}&key=${googleKey}`;
              const r = await fetch(detailUrl);
              const g = await r.json();
              const r0 = g?.results?.[0];
              if (!r0) return null;
              const loc = r0.geometry?.location || {};
              const ac = r0.address_components || [];
              const get = (type) => ac.find(c => c.types.includes(type))?.long_name || '';
              const firstPart = r0.formatted_address?.split(',')[0]?.trim() || '';
              const types = r0.types || [];
              const isPoi = types.some(t => ['establishment', 'point_of_interest', 'premise'].includes(t));
              return {
                place_name: r0.formatted_address,
                address_line1: firstPart || get('route') || q,
                city: get('locality') || get('administrative_area_level_2'),
                state: get('administrative_area_level_1'),
                county: get('administrative_area_level_2') || get('administrative_area_level_1'),
                country: get('country'),
                postal_code: get('postal_code'),
                latitude: loc.lat,
                longitude: loc.lng,
                suggested_property_name: isPoi ? firstPart : null,
                suggested_tower: get('subpremise') || null
              };
            })
          );
          const googleList = details.filter(Boolean);
          const seen = new Set(combined.map((r) => `${r.latitude?.toFixed(5)}_${r.longitude?.toFixed(5)}`));
          for (const g of googleList) {
            const key = `${g.latitude?.toFixed(5)}_${g.longitude?.toFixed(5)}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push(g);
            }
          }
        }
      } catch (_) { /* continue */ }
    }

    // Mapbox only when Google not used or for extra results
    if (mapboxToken && combined.length < limit) {
      try {
        const qLower = q.toLowerCase();
        const countryBias = (qLower.includes('chennai') || qLower.includes('india') || qLower.includes('mumbai') || qLower.includes('delhi') || qLower.includes('bangalore')) ? '&country=IN' : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${mapboxToken}&limit=${limit}&types=address,place,poi,locality,neighborhood${countryBias}`;
        const resp = await fetch(url);
        const geo = await resp.json();
        if (!geo?.message || geo?.features) {
          const features = geo?.features || [];
          const seen = new Set(combined.map((r) => `${r.latitude?.toFixed(5)}_${r.longitude?.toFixed(5)}`));
          for (const f of features) {
            if (combined.length >= limit) break;
            const [lng2, lat2] = f.center || [];
            const ctx = f.context || [];
            const region = ctx.find(c => c.id?.startsWith('region'));
            const country = ctx.find(c => c.id?.startsWith('country'));
            const postcode = ctx.find(c => c.id?.startsWith('postcode'));
            const place = ctx.find(c => c.id?.startsWith('place'));
            const key = `${lat2?.toFixed(5)}_${lng2?.toFixed(5)}`;
            if (!seen.has(key)) {
              seen.add(key);
              const firstPart = f.place_name?.split(',')[0]?.trim() || f.text || '';
              combined.push({
                place_name: f.place_name,
                address_line1: firstPart || q,
                city: place?.text || f.text || '',
                state: region?.text || '',
                county: region?.text || '',
                country: country?.text || '',
                postal_code: postcode?.text || '',
                latitude: lat2,
                longitude: lng2,
                suggested_property_name: firstPart || null,
                suggested_tower: null
              });
            }
          }
        }
      } catch (_) { /* continue */ }
    }

    // Nominatim for extra coverage when few results
    if (combined.length < limit) {
      try {
        const nominatimData = await fetchNominatimSuggestions(q, limit);
        const seen = new Set(combined.map((r) => `${r.latitude?.toFixed(5)}_${r.longitude?.toFixed(5)}`));
        for (const n of nominatimData) {
          if (combined.length >= limit) break;
          const key = `${n.latitude?.toFixed(5)}_${n.longitude?.toFixed(5)}`;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(n);
          }
        }
      } catch (_) { /* keep combined as is */ }
    }

    if (combined.length > 0) return res.json({ success: true, data: combined.slice(0, limit) });
    return await suggestNominatim(req, res, q, limit);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function fetchNominatimSuggestions(q, limit) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=1`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'PropertyPro/1.0' } });
  const list = await resp.json();
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const ad = item.address || {};
    return {
      place_name: item.display_name,
      address_line1: ad.road ? [ad.house_number, ad.road].filter(Boolean).join(' ') : (ad.suburb || ad.neighbourhood || item.display_name?.split(',')[0] || q),
      city: ad.city || ad.town || ad.village || ad.municipality || '',
      state: ad.state || ad.county || '',
      county: ad.county || ad.state || '',
      country: ad.country || '',
      postal_code: ad.postcode || '',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    };
  });
}

async function suggestNominatim(req, res, q, limit) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'PropertyPro/1.0' } });
    const list = await resp.json();
    if (!Array.isArray(list) || list.length === 0) return res.json({ success: true, data: [] });
    const data = list.map((item) => {
      const ad = item.address || {};
      return {
        place_name: item.display_name,
        address_line1: ad.road ? [ad.house_number, ad.road].filter(Boolean).join(' ') : (ad.suburb || ad.neighbourhood || item.display_name?.split(',')[0] || q),
        city: ad.city || ad.town || ad.village || ad.municipality || '',
        state: ad.state || ad.county || '',
        county: ad.county || ad.state || '',
        country: ad.country || '',
        postal_code: ad.postcode || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      };
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({ success: true, data: [] });
  }
}

/**
 * POST /api/properties/geocode
 * Address auto-fill: uses GOOGLE_MAPS_API_KEY first when set, else MAPBOX_ACCESS_TOKEN
 */
router.post('/geocode', async (req, res) => {
  try {
    const body = req.body || {};
    const address = body.address || body.query;
    const lat = body.latitude ?? body.lat;
    const lng = body.longitude ?? body.lng;
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (address && (googleKey || mapboxToken)) {
      let data = null;
      if (googleKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleKey}`;
        const resp = await fetch(url);
        const geo = await resp.json();
        const r = geo?.results?.[0];
        if (r) {
          const loc = r.geometry?.location || {};
          const ac = r.address_components || [];
          const get = (type) => ac.find(c => c.types.includes(type))?.long_name || '';
          const firstPart = r.formatted_address?.split(',')[0]?.trim() || '';
          const types = r.types || [];
          const isPoi = types.some(t => ['establishment', 'point_of_interest', 'premise'].includes(t));
          data = {
            address_line1: firstPart || get('street_number') + ' ' + get('route') || address,
            city: get('locality') || get('administrative_area_level_2'),
            state: get('administrative_area_level_1'),
            county: get('administrative_area_level_2') || get('administrative_area_level_1'),
            country: get('country'),
            postal_code: get('postal_code'),
            latitude: loc.lat,
            longitude: loc.lng,
            suggested_property_name: isPoi ? firstPart : null,
            suggested_tower: get('subpremise') || null
          };
        }
      }
      if (!data && mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`;
        const resp = await fetch(url);
        const geo = await resp.json();
        const f = geo?.features?.[0];
        if (f) {
          const [lng2, lat2] = f.center || [];
          const ctx = f.context || [];
          const region = ctx.find(c => c.id?.startsWith('region'));
          const country = ctx.find(c => c.id?.startsWith('country'));
          const postcode = ctx.find(c => c.id?.startsWith('postcode'));
          const firstPart = f.place_name?.split(',')[0]?.trim() || f.text || '';
          data = {
            address_line1: firstPart || address,
            city: f.text || '',
            state: region?.text || '',
            county: region?.text || '',
            country: country?.text || '',
            postal_code: postcode?.text || '',
            latitude: lat2,
            longitude: lng2,
            suggested_property_name: firstPart || null,
            suggested_tower: null
          };
        }
      }
      if (data) return res.json({ success: true, data });
    }

    if (address) {
      const parts = String(address).split(',').map(p => p.trim());
      const city = parts[1] || '';
      const state = parts[2] || parts[1] || '';
      const country = parts[parts.length - 1] || 'Kenya';
      return res.json({
        success: true,
        data: {
          address_line1: parts[0] || address,
          city,
          state,
          county: state,
          country,
          postal_code: '',
          latitude: null,
          longitude: null
        }
      });
    }
    if (lat != null && lng != null) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      let data = null;
      if (googleKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latNum},${lngNum}&key=${googleKey}`;
        const resp = await fetch(url);
        const geo = await resp.json();
        const results = geo?.results || [];
        // Prefer premise/establishment/POI so we get "Featherlite The Address, Nemilichery, Pallavaram..." not "Tower-B, Chennai..."
        const preferred = results.find(r => (r.types || []).some(t => ['premise', 'establishment', 'point_of_interest'].includes(t)));
        const r = preferred || results[0];
        if (r) {
          const loc = r.geometry?.location || {};
          const ac = r.address_components || [];
          const get = (type) => ac.find(c => c.types.includes(type))?.long_name || '';
          const firstPart = r.formatted_address?.split(',')[0]?.trim() || '';
          const types = r.types || [];
          const isPoi = types.some(t => ['establishment', 'point_of_interest', 'premise'].includes(t));
          data = {
            address_line1: firstPart || get('street_number') + ' ' + get('route') || `${latNum}, ${lngNum}`,
            city: get('locality') || get('administrative_area_level_2'),
            state: get('administrative_area_level_1'),
            county: get('administrative_area_level_2') || get('administrative_area_level_1'),
            country: get('country'),
            postal_code: get('postal_code'),
            latitude: loc.lat ?? latNum,
            longitude: loc.lng ?? lngNum,
            suggested_property_name: isPoi ? firstPart : null,
            suggested_tower: get('subpremise') || null
          };
        }
      }
      if (!data && mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngNum},${latNum}.json?access_token=${mapboxToken}&limit=1`;
        const resp = await fetch(url);
        const geo = await resp.json();
        const f = geo?.features?.[0];
        if (f) {
          const ctx = f.context || [];
          const region = ctx.find(c => c.id?.startsWith('region'));
          const country = ctx.find(c => c.id?.startsWith('country'));
          const postcode = ctx.find(c => c.id?.startsWith('postcode'));
          const place = ctx.find(c => c.id?.startsWith('place'));
          const firstPart = f.place_name?.split(',')[0]?.trim() || f.text || '';
          data = {
            address_line1: firstPart || `${latNum}, ${lngNum}`,
            city: place?.text || f.text || '',
            state: region?.text || '',
            county: region?.text || '',
            country: country?.text || '',
            postal_code: postcode?.text || '',
            latitude: latNum,
            longitude: lngNum,
            suggested_property_name: firstPart || null,
            suggested_tower: null
          };
        }
      }
      if (data) return res.json({ success: true, data });
      return res.json({
        success: true,
        data: {
          address_line1: `${latNum}, ${lngNum}`,
          city: '',
          state: '',
          county: '',
          country: '',
          postal_code: '',
          latitude: latNum,
          longitude: lngNum
        }
      });
    }
    res.status(400).json({ success: false, error: 'Provide address or latitude/longitude' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/properties/parse-cad
 * Upload DXF (or PDF) and extract suggested floors, units, assets from text/layers
 */
router.post('/parse-cad', uploadCad.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const ext = (path.extname(req.file.originalname || '') || '').toLowerCase();
    const result = { total_floors: null, number_of_units: null, total_area: null, assets: [], layers: [], message: '' };

    if (ext === '.dwg') {
      let dwgTexts = [];
      let dwgLayers = new Set();
      try {
        const buf = fs.readFileSync(req.file.path);
        const wasmDir = path.join(__dirname, '..', 'node_modules', '@mlightcad', 'libredwg-web', 'wasm');
        const { Dwg_File_Type, LibreDwg } = await import('@mlightcad/libredwg-web');
        const libredwg = await LibreDwg.create(wasmDir);
        const dwgPtr = libredwg.dwg_read_data(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), Dwg_File_Type.DWG);
        if (dwgPtr != null && dwgPtr !== undefined) {
          const db = libredwg.convert(dwgPtr);
          libredwg.dwg_free(dwgPtr);
          (db.entities || []).forEach((e) => {
            if (e.layer) dwgLayers.add(e.layer);
            const t = ((e.type === 'TEXT' || e.type === 'MTEXT') && e.text) ? String(e.text).trim() : '';
            if (t) dwgTexts.push(t);
          });
          if (db.tables && db.tables.LAYER && Array.isArray(db.tables.LAYER.entries)) {
            db.tables.LAYER.entries.forEach((entry) => { if (entry && entry.name) dwgLayers.add(entry.name); });
          }
        }
      } catch (dwgErr) {
        console.warn('DWG parse failed, returning message only:', dwgErr.message);
      }
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      if (dwgTexts.length === 0 && dwgLayers.size === 0) {
        result.message = 'DWG file accepted but no text/layers could be read. Export as DXF for best results, or enter details manually.';
        return res.json({ success: true, data: result });
      }
      const texts = dwgTexts;
      const layers = dwgLayers;
      const floorMatch = /(\d+)\s*(?:floors?|levels?|storeys?)/i;
      const unitMatch = /(\d+)\s*(?:units?|rooms?|spaces?|suites?)/i;
      const areaMatch = /(\d+(?:\.\d+)?)\s*(?:sq\.?\s*m|m²|sqm|square\s*meters?)/i;
      const floorNum = /(?:floor|level|storey)\s*[:\s#-]*\s*(\d+)/i;
      const unitNum = /(?:unit|room|space|suite)\s*[:\s#-]*\s*(\d+)/i;
      let maxFloor = 0;
      let maxUnit = 0;
      const assetLabels = new Set();
      [...texts, ...layers].forEach((s) => {
        const str = String(s);
        const fm = str.match(floorMatch); if (fm) result.total_floors = Math.max(result.total_floors || 0, parseInt(fm[1], 10));
        const um = str.match(unitMatch); if (um) result.number_of_units = Math.max(result.number_of_units || 0, parseInt(um[1], 10));
        const am = str.match(areaMatch); if (am) result.total_area = parseFloat(am[1]);
        const fn = str.match(floorNum); if (fn) maxFloor = Math.max(maxFloor, parseInt(fn[1], 10));
        const un = str.match(unitNum); if (un) maxUnit = Math.max(maxUnit, parseInt(un[1], 10));
        if (/floor|level|elevator|stairs|mechanical|electrical|plumbing|hvac|asset|equipment/i.test(str) && str.length < 80) assetLabels.add(str);
      });
      if (maxFloor > 0 && (!result.total_floors || maxFloor > result.total_floors)) result.total_floors = maxFloor;
      if (maxUnit > 0 && (!result.number_of_units || maxUnit > result.number_of_units)) result.number_of_units = maxUnit;
      result.assets = [...assetLabels].slice(0, 30);
      result.layers = [...layers].slice(0, 50);
      if (process.env.OPENAI_API_KEY && (texts.length > 0 || layers.size > 0)) {
        try {
          const content = [
            'Text labels from the drawing:',
            texts.slice(0, 200).join('\n'),
            'Layer names:',
            [...layers].join(', ')
          ].join('\n').slice(0, 3500);
          const openai = await import('openai').then(m => m.default).catch(() => null);
          if (openai) {
            const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await client.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'You extract property details from CAD/floor plan text and layer names. Reply with ONLY a JSON object, no other text. Use keys: total_floors (integer or null), number_of_units (integer or null), total_area (number in sq m or null). Use null when not found or uncertain.' },
                { role: 'user', content: `Extract total_floors, number_of_units, and total_area from this CAD/floor plan content:\n\n${content}` }
              ],
              max_tokens: 120
            });
            const raw = completion.choices?.[0]?.message?.content?.trim() || '';
            const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
            let aiData;
            try {
              aiData = JSON.parse(jsonStr);
            } catch (_) {
              const match = raw.match(/\{[\s\S]*\}/);
              if (match) aiData = JSON.parse(match[0]);
            }
            if (aiData && typeof aiData === 'object') {
              const n = (v) => (v != null && !Number.isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : null);
              const aiFloors = n(aiData.total_floors);
              const aiUnits = n(aiData.number_of_units);
              const aiArea = n(aiData.total_area);
              if (aiFloors != null) result.total_floors = result.total_floors == null ? aiFloors : Math.max(result.total_floors, aiFloors);
              if (aiUnits != null) result.number_of_units = result.number_of_units == null ? aiUnits : Math.max(result.number_of_units, aiUnits);
              if (aiArea != null) result.total_area = result.total_area == null ? aiArea : Math.max(result.total_area, aiArea);
            }
          }
        } catch (aiErr) {
          console.warn('CAD AI extraction failed:', aiErr.message);
        }
      }
      result.message = result.total_floors != null || result.number_of_units != null || result.total_area != null
        ? 'DWG parsed. Total area, units, and floors applied where detected. Review and save.'
        : 'DWG parsed; no floors/units/area detected. Enter details manually if needed.';
      return res.json({ success: true, data: result });
    }

    if (ext === '.pdf') {
      let pdfText = '';
      try {
        const buf = fs.readFileSync(req.file.path);
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buf });
        const textResult = await parser.getText();
        pdfText = (textResult && textResult.text) ? String(textResult.text) : '';
        await parser.destroy().catch(() => {});
      } catch (pdfErr) {
        console.warn('PDF text extraction failed:', pdfErr.message);
      }
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      if (!pdfText || !pdfText.trim()) {
        result.message = 'PDF uploaded but no text could be extracted (image-only or unsupported PDF). Enter details manually or upload a DXF/DWG.';
        return res.json({ success: true, data: result });
      }
      const texts = pdfText.split(/\s*[\r\n]+\s*/).filter(Boolean);
      const floorMatch = /(\d+)\s*(?:floors?|levels?|storeys?)/i;
      const unitMatch = /(\d+)\s*(?:units?|rooms?|spaces?|suites?)/i;
      const areaMatch = /(\d+(?:\.\d+)?)\s*(?:sq\.?\s*m|m²|sqm|square\s*meters?)/i;
      const floorNum = /(?:floor|level|storey)\s*[:\s#-]*\s*(\d+)/i;
      const unitNum = /(?:unit|room|space|suite)\s*[:\s#-]*\s*(\d+)/i;
      let maxFloor = 0;
      let maxUnit = 0;
      const assetLabels = new Set();
      [pdfText, ...texts].forEach((s) => {
        const str = String(s);
        const fm = str.match(floorMatch); if (fm) result.total_floors = Math.max(result.total_floors || 0, parseInt(fm[1], 10));
        const um = str.match(unitMatch); if (um) result.number_of_units = Math.max(result.number_of_units || 0, parseInt(um[1], 10));
        const am = str.match(areaMatch); if (am) result.total_area = parseFloat(am[1]);
        const fn = str.match(floorNum); if (fn) maxFloor = Math.max(maxFloor, parseInt(fn[1], 10));
        const un = str.match(unitNum); if (un) maxUnit = Math.max(maxUnit, parseInt(un[1], 10));
        if (/floor|level|elevator|stairs|mechanical|electrical|plumbing|hvac|asset|equipment/i.test(str) && str.length < 80) assetLabels.add(str);
      });
      if (maxFloor > 0 && (!result.total_floors || maxFloor > result.total_floors)) result.total_floors = maxFloor;
      if (maxUnit > 0 && (!result.number_of_units || maxUnit > result.number_of_units)) result.number_of_units = maxUnit;
      result.assets = [...assetLabels].slice(0, 30);
      if (process.env.OPENAI_API_KEY && pdfText.length > 0) {
        try {
          const content = pdfText.slice(0, 3500);
          const openai = await import('openai').then(m => m.default).catch(() => null);
          if (openai) {
            const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const completion = await client.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'You extract property details from floor plan or CAD PDF text. Reply with ONLY a JSON object. Use keys: total_floors (integer or null), number_of_units (integer or null), total_area (number in sq m or null). Use null when not found or uncertain.' },
                { role: 'user', content: `Extract total_floors, number_of_units, and total_area from this PDF content:\n\n${content}` }
              ],
              max_tokens: 120
            });
            const raw = completion.choices?.[0]?.message?.content?.trim() || '';
            const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
            let aiData;
            try {
              aiData = JSON.parse(jsonStr);
            } catch (_) {
              const match = raw.match(/\{[\s\S]*\}/);
              if (match) aiData = JSON.parse(match[0]);
            }
            if (aiData && typeof aiData === 'object') {
              const n = (v) => (v != null && !Number.isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : null);
              const aiFloors = n(aiData.total_floors);
              const aiUnits = n(aiData.number_of_units);
              const aiArea = n(aiData.total_area);
              if (aiFloors != null) result.total_floors = result.total_floors == null ? aiFloors : Math.max(result.total_floors, aiFloors);
              if (aiUnits != null) result.number_of_units = result.number_of_units == null ? aiUnits : Math.max(result.number_of_units, aiUnits);
              if (aiArea != null) result.total_area = result.total_area == null ? aiArea : Math.max(result.total_area, aiArea);
            }
          }
        } catch (aiErr) {
          console.warn('PDF AI extraction failed:', aiErr.message);
        }
      }
      result.message = result.total_floors != null || result.number_of_units != null || result.total_area != null
        ? 'PDF parsed. Total area, units, and floors applied where detected. Review and save.'
        : 'PDF parsed; no floors/units/area detected in text. Enter details manually if needed.';
      return res.json({ success: true, data: result });
    }

    if (ext !== '.dxf') {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, error: 'Only DXF, DWG, or PDF allowed' });
    }

    let dxfString;
    try {
      dxfString = fs.readFileSync(req.file.path, 'utf8');
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, error: 'Could not read DXF file (binary DXF not supported)' });
    }

    const parser = new DxfParser();
    let dxf;
    try {
      dxf = parser.parseSync(dxfString);
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, error: 'Invalid DXF: ' + (e.message || 'parse error') });
    }
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    const texts = [];
    const layers = new Set();
    (dxf.entities || []).forEach((e) => {
      if (e.layer) layers.add(e.layer);
      const t = (e.text || '').toString().trim();
      if (t) texts.push(t);
    });
    if (dxf.tables && dxf.tables.layers) {
      Object.keys(dxf.tables.layers).forEach((name) => layers.add(name));
    }

    const floorMatch = /(\d+)\s*(?:floors?|levels?|storeys?)/i;
    const unitMatch = /(\d+)\s*(?:units?|rooms?|spaces?|suites?)/i;
    const areaMatch = /(\d+(?:\.\d+)?)\s*(?:sq\.?\s*m|m²|sqm|square\s*meters?)/i;
    const floorNum = /(?:floor|level|storey)\s*[:\s#-]*\s*(\d+)/i;
    const unitNum = /(?:unit|room|space|suite)\s*[:\s#-]*\s*(\d+)/i;

    let maxFloor = 0;
    let maxUnit = 0;
    const assetLabels = new Set();
    [...texts, ...layers].forEach((s) => {
      const str = String(s);
      const fm = str.match(floorMatch); if (fm) result.total_floors = Math.max(result.total_floors || 0, parseInt(fm[1], 10));
      const um = str.match(unitMatch); if (um) result.number_of_units = Math.max(result.number_of_units || 0, parseInt(um[1], 10));
      const am = str.match(areaMatch); if (am) result.total_area = parseFloat(am[1]);
      const fn = str.match(floorNum); if (fn) maxFloor = Math.max(maxFloor, parseInt(fn[1], 10));
      const un = str.match(unitNum); if (un) maxUnit = Math.max(maxUnit, parseInt(un[1], 10));
      if (/floor|level|elevator|stairs|mechanical|electrical|plumbing|hvac|asset|equipment/i.test(str) && str.length < 80) assetLabels.add(str);
    });
    if (maxFloor > 0 && (!result.total_floors || maxFloor > result.total_floors)) result.total_floors = maxFloor;
    if (maxUnit > 0 && (!result.number_of_units || maxUnit > result.number_of_units)) result.number_of_units = maxUnit;
    result.assets = [...assetLabels].slice(0, 30);
    result.layers = [...layers].slice(0, 50);

    // AI extraction: use OpenAI to read text/layers and extract floors, units, area when key is set
    if (process.env.OPENAI_API_KEY && (texts.length > 0 || layers.size > 0)) {
      try {
        const content = [
          'Text labels from the drawing:',
          [...texts].slice(0, 200).join('\n'),
          'Layer names:',
          [...layers].join(', ')
        ].join('\n').slice(0, 3500);
        const openai = await import('openai').then(m => m.default).catch(() => null);
        if (openai) {
          const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You extract property details from CAD/floor plan text and layer names. Reply with ONLY a JSON object, no other text. Use keys: total_floors (integer or null), number_of_units (integer or null), total_area (number in sq m or null). Use null when not found or uncertain.' },
              { role: 'user', content: `Extract total_floors, number_of_units, and total_area from this CAD/floor plan content:\n\n${content}` }
            ],
            max_tokens: 120
          });
          const raw = completion.choices?.[0]?.message?.content?.trim() || '';
          const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
          let aiData;
          try {
            aiData = JSON.parse(jsonStr);
          } catch (_) {
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) aiData = JSON.parse(match[0]);
          }
          if (aiData && typeof aiData === 'object') {
            const n = (v) => (v != null && !Number.isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : null);
            const aiFloors = n(aiData.total_floors);
            const aiUnits = n(aiData.number_of_units);
            const aiArea = n(aiData.total_area);
            if (aiFloors != null) result.total_floors = result.total_floors == null ? aiFloors : Math.max(result.total_floors, aiFloors);
            if (aiUnits != null) result.number_of_units = result.number_of_units == null ? aiUnits : Math.max(result.number_of_units, aiUnits);
            if (aiArea != null) result.total_area = result.total_area == null ? aiArea : Math.max(result.total_area, aiArea);
          }
        }
      } catch (aiErr) {
        console.warn('CAD AI extraction failed:', aiErr.message);
      }
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/properties/:id
 * Get a single property by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, year_built FROM properties WHERE property_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          const prop = rowToProperty(result.rows[0]);
          const spaceResult = await db.execute('SELECT occupancy_status FROM spaces WHERE property_id = :id', { id: parseInt(id, 10) });
          const spaces = spaceResult.rows || [];
          prop.VACANT_SPACES = spaces.filter(s => (s.OCCUPANCY_STATUS || s.occupancy_status) === 'VACANT').length;
          prop.RESERVED_SPACES = spaces.filter(s => (s.OCCUPANCY_STATUS || s.occupancy_status) === 'RESERVED').length;
          return res.json({ success: true, data: prop });
        }
      } catch (dbErr) {
        console.error('DB get property error:', dbErr);
      }
    }

    const property = await propertyService.getById(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    const manager = EMPLOYEES.find(e => e.EMP_ID === property.MANAGER_ID);
    const propSpaces = SPACES.filter(s => s.PROPERTY_ID === property.PROPERTY_ID);
    const enrichedProperty = {
      ...property,
      MANAGER_NAME: manager ? manager.NAME : null,
      MANAGER_EMAIL: manager ? manager.EMAIL : null,
      MANAGER_PHONE: manager ? manager.PHONE : null,
      VACANT_SPACES: propSpaces.filter(s => s.OCCUPANCY_STATUS === 'VACANT').length,
      RESERVED_SPACES: propSpaces.filter(s => s.OCCUPANCY_STATUS === 'RESERVED').length
    };
    res.json({ success: true, data: enrichedProperty });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch property' });
  }
});

/**
 * POST /api/properties
 * Create a new property
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToPropertyInsert(body);
    if (!n.property_name) {
      return res.status(400).json({ success: false, error: 'property_name is required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO properties (property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, year_built)
             VALUES (:property_code, :property_name, :property_type, :status, :address_line1, :address_line2, :city, :state, :country, :postal_code, :total_area, :total_units, :year_built)
             RETURNING property_id INTO :property_id`,
            {
              property_code: n.property_code,
              property_name: n.property_name,
              property_type: n.property_type,
              status: n.status,
              address_line1: n.address_line1 || n.property_name,
              address_line2: n.address_line2,
              city: n.city || 'N/A',
              state: n.state || 'N/A',
              country: n.country || 'USA',
              postal_code: n.postal_code || 'N/A',
              total_area: n.total_area,
              total_units: n.total_units,
              year_built: n.year_built,
              property_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.property_id) ? result.outBinds.property_id[0] : result.outBinds.property_id;
          const getResult = await conn.execute(
            'SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, year_built FROM properties WHERE property_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Property created successfully', data: rowToProperty(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create property error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating property' });
      }
    }

    // Fallback: mock create — service expects uppercase keys
    const payload = {
      PROPERTY_CODE: n.property_code,
      PROPERTY_NAME: n.property_name,
      PROPERTY_TYPE: n.property_type,
      STATUS: n.status,
      ADDRESS: n.address_line1 || '',
      ADDRESS_LINE1: n.address_line1,
      CITY: n.city || '',
      STATE: n.state || '',
      COUNTRY: n.country || '',
      POSTAL_CODE: n.postal_code || '',
      ZIP_CODE: n.postal_code,
      TOTAL_AREA: n.total_area,
      TOTAL_UNITS: n.total_units,
      NUMBER_OF_UNITS: n.total_units,
      YEAR_BUILT: n.year_built,
      DESCRIPTION: n.description || null
    };
    const newProperty = await propertyService.create(payload);
    res.status(201).json({ success: true, message: 'Property created successfully', data: newProperty });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create property' });
  }
});

/**
 * PUT /api/properties/:id
 * Update a property
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToPropertyInsert(body);

    if (db.isConfigured && db.isConfigured()) {
      try {
        const fullUpdate = `UPDATE properties SET property_name = :property_name, property_type = :property_type, status = :status,
           address_line1 = :address_line1, address_line2 = :address_line2, city = :city, state = :state, country = :country,
           postal_code = :postal_code, total_area = :total_area, total_units = :total_units, total_floors = :total_floors,
           latitude = :latitude, longitude = :longitude, year_built = :year_built, last_updated_date = SYSDATE
           WHERE property_id = :id`;
        const minimalUpdate = `UPDATE properties SET property_name = :property_name, property_type = :property_type, status = :status,
           address_line1 = :address_line1, address_line2 = :address_line2, city = :city, state = :state, country = :country,
           postal_code = :postal_code, total_area = :total_area, total_units = :total_units, year_built = :year_built, last_updated_date = SYSDATE
           WHERE property_id = :id`;
        const binds = {
          property_name: n.property_name,
          property_type: n.property_type,
          status: n.status,
          address_line1: n.address_line1 || '',
          address_line2: n.address_line2,
          city: n.city || 'N/A',
          state: n.state || 'N/A',
          country: n.country || 'USA',
          postal_code: n.postal_code || 'N/A',
          total_area: n.total_area,
          total_units: n.total_units,
          total_floors: n.total_floors,
          latitude: n.latitude,
          longitude: n.longitude,
          year_built: n.year_built,
          id: parseInt(id, 10)
        };

        try {
          // Try full update with total_floors / latitude / longitude
          await db.execute(fullUpdate, binds);
        } catch (colErr) {
          // If those columns don't exist, fall back to minimal update
          console.error('DB update property (full) failed, falling back to minimal columns:', colErr.message || colErr);
          await db.execute(minimalUpdate, binds);
        }

        const getFull = 'SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, total_floors, latitude, longitude, year_built FROM properties WHERE property_id = :id';
        const getMinimal = 'SELECT property_id, property_code, property_name, property_type, status, address_line1, address_line2, city, state, country, postal_code, total_area, total_units, year_built FROM properties WHERE property_id = :id';
        let getResult;
        try {
          getResult = await db.execute(getFull, { id: parseInt(id, 10) });
        } catch (colErr2) {
          getResult = await db.execute(getMinimal, { id: parseInt(id, 10) });
        }

        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Property updated successfully', data: rowToProperty(getResult.rows[0]) });
        }
        return res.status(404).json({ success: false, error: 'Property not found' });
      } catch (dbErr) {
        console.error('DB update property error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating property' });
      }
    }

    const updatedProperty = await propertyService.update(id, req.body);
    if (!updatedProperty) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property updated successfully', data: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update property' });
  }
});

/**
 * DELETE /api/properties/:id
 * Delete a property
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM properties WHERE property_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Property not found' });
        }
        return res.json({ success: true, message: 'Property deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete property error:', dbErr);
        if (dbErr.message && (dbErr.message.includes('ORA-02292') || dbErr.message.includes('child record'))) {
          return res.status(400).json({ success: false, error: 'Cannot delete property: has related leases, spaces, or assets' });
        }
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting property' });
      }
    }

    const deleted = await propertyService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete property' });
  }
});

module.exports = router;
