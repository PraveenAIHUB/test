const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const WorkOrderService = require('../services/WorkOrderService');
const db = require('../config/database');
const { WORK_ORDERS, PROPERTIES, ASSETS, VENDORS } = require('../data/kenyaProductionData');

const workOrderService = new WorkOrderService(WORK_ORDERS, PROPERTIES, ASSETS, VENDORS);

function rowToWorkOrder(r) {
  const id = r.WORK_ORDER_ID ?? r.work_order_id;
  return {
    WORK_ORDER_ID: id,
    work_order_id: id,
    WORK_ORDER_NUMBER: r.WORK_ORDER_NUMBER ?? r.work_order_number,
    work_order_number: r.WORK_ORDER_NUMBER ?? r.work_order_number,
    WORK_ORDER_CODE: r.WORK_ORDER_NUMBER ?? r.work_order_number,
    PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
    property_id: r.PROPERTY_ID ?? r.property_id,
    ASSET_ID: r.ASSET_ID ?? r.asset_id,
    asset_id: r.ASSET_ID ?? r.asset_id,
    TITLE: r.TITLE ?? r.title,
    title: r.TITLE ?? r.title,
    DESCRIPTION: r.DESCRIPTION ?? r.description,
    description: r.DESCRIPTION ?? r.description,
    WORK_ORDER_TYPE: r.WORK_ORDER_TYPE ?? r.work_order_type ?? 'CORRECTIVE',
    work_order_type: r.WORK_ORDER_TYPE ?? r.work_order_type ?? 'CORRECTIVE',
    TYPE: r.WORK_ORDER_TYPE ?? r.work_order_type ?? 'CORRECTIVE',
    PRIORITY: r.PRIORITY ?? r.priority ?? 'MEDIUM',
    priority: r.PRIORITY ?? r.priority ?? 'MEDIUM',
    STATUS: r.STATUS ?? r.status ?? 'OPEN',
    status: r.STATUS ?? r.status ?? 'OPEN',
    VENDOR_ID: r.VENDOR_ID ?? r.vendor_id,
    vendor_id: r.VENDOR_ID ?? r.vendor_id,
    REPORTED_DATE: r.REPORTED_DATE ?? r.reported_date,
    reported_date: r.REPORTED_DATE ?? r.reported_date,
    CREATED_DATE: r.REPORTED_DATE ?? r.reported_date,
    SCHEDULED_DATE: r.SCHEDULED_DATE ?? r.scheduled_date,
    scheduled_date: r.SCHEDULED_DATE ?? r.scheduled_date,
    COMPLETED_DATE: r.COMPLETED_DATE ?? r.completed_date,
    completed_date: r.COMPLETED_DATE ?? r.completed_date
  };
}

/** Normalize value to a JS Date for Oracle DATE bind (avoids ORA-01861). */
function toOracleDate(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function bodyToWorkOrderInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  return {
    work_order_number: b.work_order_number || b.WORK_ORDER_NUMBER || `WO-${Date.now()}`,
    property_id: parseInt(b.property_id ?? b.PROPERTY_ID, 10) || null,
    asset_id: (() => { const v = b.asset_id ?? b.ASSET_ID; if (v == null || v === '') return null; const n = parseInt(v, 10); return (Number.isInteger(n) && n > 0) ? n : null; })(),
    title: String(b.title ?? b.TITLE ?? '').trim(),
    description: b.description ?? b.DESCRIPTION ?? null,
    work_order_type: b.work_order_type || b.WORK_ORDER_TYPE || b.type || 'CORRECTIVE',
    priority: b.priority || b.PRIORITY || 'MEDIUM',
    vendor_id: b.vendor_id != null && b.vendor_id !== '' ? parseInt(b.vendor_id, 10) : null,
    status: b.status || b.STATUS || 'OPEN',
    scheduled_date: toOracleDate(b.scheduled_date ?? b.SCHEDULED_DATE)
  };
}

/**
 * GET /api/workorders/stats
 * Get dashboard statistics for work orders
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await workOrderService.getStatistics();

    // Completed this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedMTD = WORK_ORDERS.filter(wo => {
      if (wo.STATUS !== 'COMPLETED' || !wo.COMPLETED_DATE) return false;
      const completedDate = new Date(wo.COMPLETED_DATE);
      return completedDate >= firstDayOfMonth && completedDate <= today;
    }).length;

    // Work orders by type
    const workOrdersByType = Object.entries(stats.byType).map(([type, count]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / stats.total) * 100).toFixed(1)
    }));

    // Work orders by priority
    const workOrdersByPriority = Object.entries(stats.byPriority).map(([priority, count]) => ({
      priority: priority.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / stats.total) * 100).toFixed(1)
    }));

    // Recent work orders (last 5)
    const enrichedWorkOrders = await workOrderService.enrichMany(WORK_ORDERS);
    const recentWorkOrders = enrichedWorkOrders
      .sort((a, b) => new Date(b.CREATED_DATE) - new Date(a.CREATED_DATE))
      .slice(0, 5)
      .map(wo => ({
        woNumber: wo.WORK_ORDER_CODE,
        property: wo.PROPERTY_NAME,
        type: wo.TYPE.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        priority: wo.PRIORITY.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: wo.STATUS.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

    const responseData = {
      kpis: {
        openWorkOrders: stats.open,
        inProgress: stats.inProgress,
        completedMTD,
        avgResolution: stats.avgResolutionTime
      },
      workOrdersByType,
      workOrdersByPriority,
      recentWorkOrders
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching work order stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work order stats' });
  }
});

/**
 * GET /api/workorders
 * Get all work orders with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { property_id, status, priority, type, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (property_id) { where += ' AND property_id = :property_id'; countBinds.property_id = parseInt(property_id, 10); }
        if (status) { where += ' AND status = :status'; countBinds.status = status; }
        if (priority) { where += ' AND priority = :priority'; countBinds.priority = priority; }
        if (type) { where += ' AND work_order_type = :work_order_type'; countBinds.work_order_type = type; }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM work_orders${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT work_order_id, work_order_number, property_id, asset_id, title, description, work_order_type, priority, assigned_to, vendor_id, reported_date, scheduled_date, completed_date, status FROM work_orders${where} ORDER BY work_order_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => rowToWorkOrder(r));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB fetch work orders error:', dbErr);
      }
    }

    const filters = {};
    if (property_id) filters.PROPERTY_ID = property_id;
    if (status) filters.STATUS = status;
    if (priority) filters.PRIORITY = priority;
    if (type) filters.TYPE = type;
    const result = await workOrderService.getAll(filters, { page: pageNum, limit: limitNum });
    const priorityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    result.data.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.PRIORITY] || 5) - (priorityOrder[b.PRIORITY] || 5);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.CREATED_DATE || 0) - new Date(a.CREATED_DATE || 0);
    });
    res.json({ success: true, data: result.data, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work orders' });
  }
});

/**
 * GET /api/workorders/:id
 * Get a single work order by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT work_order_id, work_order_number, property_id, asset_id, title, description, work_order_type, priority, assigned_to, vendor_id, reported_date, scheduled_date, completed_date, status FROM work_orders WHERE work_order_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          return res.json({ success: true, data: rowToWorkOrder(result.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB get work order error:', dbErr);
      }
    }

    const workOrder = await workOrderService.getById(id);
    if (!workOrder) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }
    const vendor = workOrder.VENDOR_ID ? VENDORS.find(v => v.VENDOR_ID === workOrder.VENDOR_ID) : null;
    const property = PROPERTIES.find(p => p.PROPERTY_ID === workOrder.PROPERTY_ID);
    const asset = workOrder.ASSET_ID ? ASSETS.find(a => a.ASSET_ID === workOrder.ASSET_ID) : null;
    const enrichedWorkOrder = {
      ...workOrder,
      PROPERTY_ADDRESS: property ? property.ADDRESS : null,
      PROPERTY_CITY: property ? property.CITY : null,
      ASSET_CATEGORY: asset ? asset.CATEGORY : null,
      VENDOR_CONTACT: vendor ? vendor.CONTACT_PERSON : null,
      VENDOR_PHONE: vendor ? vendor.PHONE : null
    };
    res.json({ success: true, data: enrichedWorkOrder });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work order' });
  }
});

/**
 * POST /api/workorders/request
 * Customer submits asset/unit maintenance request (AC, electrical, etc.) for their unit/floor
 */
router.post('/request', verifyToken, async (req, res) => {
  try {
    const body = { ...(req.body || {}), requested_by_user_id: req.user?.user_id };
    const n = bodyToWorkOrderInsert(body);
    if (!n.title) return res.status(400).json({ success: false, error: 'title is required' });
    if (!n.property_id) return res.status(400).json({ success: false, error: 'property_id is required' });
    const payload = {
      WORK_ORDER_NUMBER: n.work_order_number,
      WORK_ORDER_CODE: n.work_order_number,
      PROPERTY_ID: n.property_id,
      ASSET_ID: n.asset_id,
      TITLE: n.title,
      DESCRIPTION: n.description,
      WORK_ORDER_TYPE: n.work_order_type,
      TYPE: n.work_order_type,
      PRIORITY: n.priority || 'MEDIUM',
      STATUS: 'OPEN',
      REQUESTED_BY_USER_ID: req.user?.user_id,
      SPACE_ID: body.space_id ?? null,
      FLOOR_ID: body.floor_id ?? null
    };
    const created = await workOrderService.create(payload);
    res.status(201).json({ success: true, message: 'Maintenance request submitted', data: created });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/workorders
 * Create a new work order
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToWorkOrderInsert(body);
    if (!n.title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }
    if (!n.property_id) {
      return res.status(400).json({ success: false, error: 'property_id is required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO work_orders (work_order_number, property_id, asset_id, title, description, work_order_type, priority, vendor_id, status, scheduled_date)
             VALUES (:work_order_number, :property_id, :asset_id, :title, :description, :work_order_type, :priority, :vendor_id, :status, :scheduled_date)
             RETURNING work_order_id INTO :work_order_id`,
            {
              work_order_number: n.work_order_number,
              property_id: n.property_id,
              asset_id: n.asset_id,
              title: n.title,
              description: n.description,
              work_order_type: n.work_order_type,
              priority: n.priority,
              vendor_id: n.vendor_id,
              status: n.status,
              scheduled_date: n.scheduled_date,
              work_order_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.work_order_id) ? result.outBinds.work_order_id[0] : result.outBinds.work_order_id;
          const getResult = await conn.execute(
            'SELECT work_order_id, work_order_number, property_id, asset_id, title, description, work_order_type, priority, vendor_id, reported_date, scheduled_date, completed_date, status FROM work_orders WHERE work_order_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Work order created successfully', data: rowToWorkOrder(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create work order error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating work order' });
      }
    }

    const newWorkOrder = await workOrderService.create(req.body);
    res.status(201).json({ success: true, message: 'Work order created successfully', data: newWorkOrder });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create work order' });
  }
});

/**
 * PUT /api/workorders/:id
 * Update a work order
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (db.isConfigured && db.isConfigured()) {
      try {
        const existing = await db.execute(
          'SELECT work_order_id, work_order_number, property_id, asset_id, title, description, work_order_type, priority, vendor_id, status, scheduled_date FROM work_orders WHERE work_order_id = :id',
          { id: parseInt(id, 10) }
        );
        if (!existing.rows || existing.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Work order not found' });
        }
        const row = existing.rows[0];
        const merged = {
          work_order_number: row.WORK_ORDER_NUMBER ?? row.work_order_number,
          property_id: row.PROPERTY_ID ?? row.property_id,
          asset_id: row.ASSET_ID ?? row.asset_id,
          title: row.TITLE ?? row.title,
          description: row.DESCRIPTION ?? row.description,
          work_order_type: row.WORK_ORDER_TYPE ?? row.work_order_type,
          priority: row.PRIORITY ?? row.priority,
          vendor_id: row.VENDOR_ID ?? row.vendor_id,
          status: row.STATUS ?? row.status,
          scheduled_date: row.SCHEDULED_DATE ?? row.scheduled_date,
          ...body
        };
        const n = bodyToWorkOrderInsert(merged);
        await db.execute(
          `UPDATE work_orders SET property_id = :property_id, asset_id = :asset_id, title = :title, description = :description, work_order_type = :work_order_type, priority = :priority, vendor_id = :vendor_id, status = :status, scheduled_date = :scheduled_date, last_updated_date = SYSDATE WHERE work_order_id = :id`,
          {
            property_id: n.property_id,
            asset_id: n.asset_id,
            title: n.title,
            description: n.description,
            work_order_type: n.work_order_type,
            priority: n.priority,
            vendor_id: n.vendor_id,
            status: n.status,
            scheduled_date: n.scheduled_date,
            id: parseInt(id, 10)
          }
        );
        const getResult = await db.execute(
          'SELECT work_order_id, work_order_number, property_id, asset_id, title, description, work_order_type, priority, vendor_id, reported_date, scheduled_date, completed_date, status FROM work_orders WHERE work_order_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Work order updated successfully', data: rowToWorkOrder(getResult.rows[0]) });
        }
        return res.status(404).json({ success: false, error: 'Work order not found' });
      } catch (dbErr) {
        console.error('DB update work order error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating work order' });
      }
    }

    const updatedWorkOrder = await workOrderService.update(id, req.body);
    if (!updatedWorkOrder) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }
    res.json({ success: true, message: 'Work order updated successfully', data: updatedWorkOrder });
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update work order' });
  }
});

/**
 * DELETE /api/workorders/:id
 * Delete a work order
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM work_orders WHERE work_order_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Work order not found' });
        }
        return res.json({ success: true, message: 'Work order deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete work order error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting work order' });
      }
    }

    const deleted = await workOrderService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }
    res.json({ success: true, message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete work order' });
  }
});

module.exports = router;
