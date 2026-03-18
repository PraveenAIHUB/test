const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AssetService = require('../services/AssetService');
const db = require('../config/database');
const { ASSETS, PROPERTIES, WORK_ORDERS } = require('../data/kenyaProductionData');

const assetService = new AssetService(ASSETS, PROPERTIES, WORK_ORDERS);

function rowToAsset(r) {
  const id = r.ASSET_ID ?? r.asset_id;
  const status = r.STATUS ?? r.status;
  return {
    ASSET_ID: id,
    asset_id: id,
    ASSET_CODE: r.ASSET_CODE ?? r.asset_code,
    asset_code: r.ASSET_CODE ?? r.asset_code,
    ASSET_NAME: r.ASSET_NAME ?? r.asset_name,
    asset_name: r.ASSET_NAME ?? r.asset_name,
    PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
    property_id: r.PROPERTY_ID ?? r.property_id,
    ASSET_CATEGORY: r.ASSET_CATEGORY ?? r.asset_category,
    asset_category: r.ASSET_CATEGORY ?? r.asset_category,
    ASSET_TYPE: r.ASSET_TYPE ?? r.asset_type,
    asset_type: r.ASSET_TYPE ?? r.asset_type,
    MANUFACTURER: r.MANUFACTURER ?? r.manufacturer,
    manufacturer: r.MANUFACTURER ?? r.manufacturer,
    MODEL_NUMBER: r.MODEL_NUMBER ?? r.model_number,
    model_number: r.MODEL_NUMBER ?? r.model_number,
    SERIAL_NUMBER: r.SERIAL_NUMBER ?? r.serial_number,
    serial_number: r.SERIAL_NUMBER ?? r.serial_number,
    PURCHASE_DATE: r.PURCHASE_DATE ?? r.purchase_date,
    purchase_date: r.PURCHASE_DATE ?? r.purchase_date,
    PURCHASE_COST: r.PURCHASE_COST ?? r.purchase_cost,
    purchase_cost: r.PURCHASE_COST ?? r.purchase_cost,
    WARRANTY_EXPIRY_DATE: r.WARRANTY_EXPIRY_DATE ?? r.warranty_expiry_date,
    warranty_expiry: r.WARRANTY_EXPIRY_DATE ?? r.warranty_expiry_date,
    STATUS: status,
    status: status === 'ACTIVE' ? 'OPERATIONAL' : status
  };
}

/** Normalize value to a JS Date for Oracle DATE bind (avoids ORA-01861). */
function toOracleDate(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function bodyToAssetInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  const status = (b.status || b.STATUS || 'ACTIVE').toUpperCase();
  const dbStatus = status === 'OPERATIONAL' ? 'ACTIVE' : status;
  const purchaseDateRaw = b.purchase_date ?? b.PURCHASE_DATE ?? null;
  const warrantyRaw = b.warranty_expiry ?? b.WARRANTY_EXPIRY_DATE ?? b.warranty_expiry_date ?? null;
  return {
    asset_code: b.asset_code || b.ASSET_CODE || `AST-${Date.now()}`,
    asset_name: String(b.asset_name ?? b.ASSET_NAME ?? '').trim(),
    property_id: parseInt(b.property_id ?? b.PROPERTY_ID, 10) || null,
    asset_category: b.asset_category || b.ASSET_CATEGORY || 'HVAC',
    asset_type: b.asset_type || b.ASSET_TYPE || null,
    manufacturer: b.manufacturer || b.MANUFACTURER || null,
    model_number: b.model_number || b.MODEL_NUMBER || null,
    serial_number: b.serial_number || b.SERIAL_NUMBER || null,
    purchase_date: toOracleDate(purchaseDateRaw),
    purchase_cost: b.purchase_cost != null && b.purchase_cost !== '' ? Number(b.purchase_cost) : null,
    warranty_expiry_date: toOracleDate(warrantyRaw),
    status: dbStatus
  };
}

/**
 * GET /api/assets/stats
 * Get dashboard statistics for assets
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await assetService.getStatistics();
    const enrichedAssets = await assetService.enrichMany(ASSETS);

    // Assets by category
    const assetsByCategory = Object.entries(stats.byCategory).map(([category, count]) => ({
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / stats.total) * 100).toFixed(1)
    }));

    // Assets by status
    const assetsByStatus = [
      { status: 'Operational', count: stats.operational, percentage: ((stats.operational / stats.total) * 100).toFixed(1) },
      { status: 'Under Maintenance', count: stats.underMaintenance, percentage: ((stats.underMaintenance / stats.total) * 100).toFixed(1) },
      { status: 'Out Of Service', count: stats.outOfService, percentage: ((stats.outOfService / stats.total) * 100).toFixed(1) }
    ];

    // Maintenance due soon (within 30 days)
    const maintenanceDue = enrichedAssets
      .filter(a => a.DAYS_UNTIL_NEXT_MAINTENANCE !== null && a.DAYS_UNTIL_NEXT_MAINTENANCE >= 0 && a.DAYS_UNTIL_NEXT_MAINTENANCE <= 30)
      .sort((a, b) => a.DAYS_UNTIL_NEXT_MAINTENANCE - b.DAYS_UNTIL_NEXT_MAINTENANCE)
      .slice(0, 5)
      .map(a => ({
        assetName: a.ASSET_NAME,
        dueDate: a.NEXT_MAINTENANCE_DATE,
        daysUntilDue: a.DAYS_UNTIL_NEXT_MAINTENANCE,
        category: a.CATEGORY.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

    const responseData = {
      kpis: {
        totalAssets: stats.total,
        operational: stats.operational,
        underMaintenance: stats.underMaintenance,
        totalValue: stats.totalPurchaseValue
      },
      assetsByCategory,
      assetsByStatus,
      maintenanceDue
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching asset stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch asset stats' });
  }
});

/**
 * GET /api/assets
 * Get all assets with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { property_id, status, category, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (property_id) { where += ' AND property_id = :property_id'; countBinds.property_id = parseInt(property_id, 10); }
        if (status) { where += ' AND status = :status'; countBinds.status = status === 'OPERATIONAL' ? 'ACTIVE' : status; }
        if (category) { where += ' AND asset_category = :asset_category'; countBinds.asset_category = category; }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM assets${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT asset_id, asset_code, asset_name, property_id, asset_category, asset_type, manufacturer, model_number, serial_number, purchase_date, purchase_cost, warranty_expiry_date, status FROM assets${where} ORDER BY asset_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => rowToAsset(r));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB fetch assets error:', dbErr);
      }
    }

    const filters = {};
    if (property_id) filters.PROPERTY_ID = property_id;
    if (status) filters.STATUS = status;
    if (category) filters.CATEGORY = category;
    const result = await assetService.getAll(filters, { page: pageNum, limit: limitNum });
    res.json({ success: true, data: result.data, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/assets/:id
 * Get a single asset by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT asset_id, asset_code, asset_name, property_id, asset_category, asset_type, manufacturer, model_number, serial_number, purchase_date, purchase_cost, warranty_expiry_date, status FROM assets WHERE asset_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          return res.json({ success: true, data: rowToAsset(result.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB get asset error:', dbErr);
      }
    }

    const asset = await assetService.getById(id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    const assetWorkOrders = WORK_ORDERS.filter(wo => wo.ASSET_ID === asset.ASSET_ID);
    const property = PROPERTIES.find(p => p.PROPERTY_ID === asset.PROPERTY_ID);
    const enrichedAsset = {
      ...asset,
      PROPERTY_ADDRESS: property ? property.ADDRESS : null,
      PROPERTY_CITY: property ? property.CITY : null,
      WORK_ORDERS: assetWorkOrders.map(wo => ({ WORK_ORDER_ID: wo.WORK_ORDER_ID, WORK_ORDER_CODE: wo.WORK_ORDER_CODE, DESCRIPTION: wo.DESCRIPTION, STATUS: wo.STATUS, PRIORITY: wo.PRIORITY, CREATED_DATE: wo.CREATED_DATE }))
    };
    res.json({ success: true, data: enrichedAsset });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch asset' });
  }
});

/**
 * POST /api/assets
 * Create a new asset
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToAssetInsert(body);
    if (!n.asset_name) {
      return res.status(400).json({ success: false, error: 'asset_name is required' });
    }
    if (!n.property_id) {
      return res.status(400).json({ success: false, error: 'property_id is required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO assets (asset_code, asset_name, property_id, asset_category, asset_type, manufacturer, model_number, serial_number, purchase_date, purchase_cost, warranty_expiry_date, status)
             VALUES (:asset_code, :asset_name, :property_id, :asset_category, :asset_type, :manufacturer, :model_number, :serial_number, :purchase_date, :purchase_cost, :warranty_expiry_date, :status)
             RETURNING asset_id INTO :asset_id`,
            {
              asset_code: n.asset_code,
              asset_name: n.asset_name,
              property_id: n.property_id,
              asset_category: n.asset_category,
              asset_type: n.asset_type,
              manufacturer: n.manufacturer,
              model_number: n.model_number,
              serial_number: n.serial_number,
              purchase_date: n.purchase_date,
              purchase_cost: n.purchase_cost,
              warranty_expiry_date: n.warranty_expiry_date,
              status: n.status,
              asset_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.asset_id) ? result.outBinds.asset_id[0] : result.outBinds.asset_id;
          const getResult = await conn.execute(
            'SELECT asset_id, asset_code, asset_name, property_id, asset_category, asset_type, manufacturer, model_number, serial_number, purchase_date, purchase_cost, warranty_expiry_date, status FROM assets WHERE asset_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Asset created successfully', data: rowToAsset(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create asset error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating asset' });
      }
    }

    const newAsset = await assetService.create(req.body);
    res.status(201).json({ success: true, message: 'Asset created successfully', data: newAsset });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create asset' });
  }
});

/**
 * PUT /api/assets/:id
 * Update an asset
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToAssetInsert(body);

    if (db.isConfigured && db.isConfigured()) {
      try {
        await db.execute(
          `UPDATE assets SET asset_name = :asset_name, property_id = :property_id, asset_category = :asset_category, asset_type = :asset_type, manufacturer = :manufacturer, model_number = :model_number, serial_number = :serial_number, purchase_date = :purchase_date, purchase_cost = :purchase_cost, warranty_expiry_date = :warranty_expiry_date, status = :status, last_updated_date = SYSDATE WHERE asset_id = :id`,
          {
            asset_name: n.asset_name,
            property_id: n.property_id,
            asset_category: n.asset_category,
            asset_type: n.asset_type,
            manufacturer: n.manufacturer,
            model_number: n.model_number,
            serial_number: n.serial_number,
            purchase_date: n.purchase_date,
            purchase_cost: n.purchase_cost,
            warranty_expiry_date: n.warranty_expiry_date,
            status: n.status,
            id: parseInt(id, 10)
          }
        );
        const getResult = await db.execute(
          'SELECT asset_id, asset_code, asset_name, property_id, asset_category, asset_type, manufacturer, model_number, serial_number, purchase_date, purchase_cost, warranty_expiry_date, status FROM assets WHERE asset_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Asset updated successfully', data: rowToAsset(getResult.rows[0]) });
        }
        return res.status(404).json({ success: false, error: 'Asset not found' });
      } catch (dbErr) {
        console.error('DB update asset error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating asset' });
      }
    }

    const updatedAsset = await assetService.update(id, req.body);
    if (!updatedAsset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset updated successfully', data: updatedAsset });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update asset' });
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM assets WHERE asset_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Asset not found' });
        }
        return res.json({ success: true, message: 'Asset deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete asset error:', dbErr);
        if (dbErr.message && (dbErr.message.includes('ORA-02292') || dbErr.message.includes('child record'))) {
          return res.status(400).json({ success: false, error: 'Cannot delete asset: has related work orders' });
        }
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting asset' });
      }
    }

    const deleted = await assetService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete asset' });
  }
});

module.exports = router;
