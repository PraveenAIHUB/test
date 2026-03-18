const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { WORK_ORDERS, ASSETS, PROPERTIES, VENDORS } = require('../data/kenyaProductionData');

// GET maintenance dashboard stats
router.get('/stats', async (req, res) => {
  try {
    if (db.isConfigured && db.isConfigured()) {
      try {
        const countResult = await db.execute('SELECT COUNT(*) AS cnt FROM work_orders', []);
        const totalWorkOrders = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const statusResult = await db.execute(
          `SELECT status, COUNT(*) AS cnt FROM work_orders GROUP BY status`,
          []
        );
        let open = 0, inProgress = 0, completed = 0;
        (statusResult.rows || []).forEach(r => {
          const raw = r.STATUS ?? r.status ?? '';
          const s = String(raw).toUpperCase();
          const c = Number(r.CNT ?? r.cnt ?? 0);
          if (s === 'OPEN') open = c;
          else if (s === 'IN_PROGRESS') inProgress = c;
          else if (s === 'COMPLETED') completed = c;
        });
        const typeResult = await db.execute(
          `SELECT work_order_type AS typ, COUNT(*) AS cnt FROM work_orders GROUP BY work_order_type`,
          []
        );
        const typeGroups = {};
        (typeResult.rows || []).forEach(r => {
          const t = r.TYP ?? r.typ ?? 'OTHER';
          typeGroups[t] = Number(r.CNT ?? r.cnt ?? 0);
        });
        const workOrdersByType = Object.entries(typeGroups).map(([type, count]) => ({
          type,
          count,
          percentage: totalWorkOrders > 0 ? ((count / totalWorkOrders) * 100).toFixed(1) : '0'
        }));
        return res.json({ success: true, data: { kpis: { totalWorkOrders, open, inProgress, completed }, workOrdersByType } });
      } catch (dbErr) {
        console.error('DB maintenance stats error:', dbErr);
      }
    }

    const totalWorkOrders = WORK_ORDERS.length;
    const open = WORK_ORDERS.filter(w => w.STATUS === 'OPEN').length;
    const inProgress = WORK_ORDERS.filter(w => w.STATUS === 'IN_PROGRESS').length;
    const completed = WORK_ORDERS.filter(w => w.STATUS === 'COMPLETED').length;
    const typeGroups = WORK_ORDERS.reduce((acc, w) => {
      const t = w.WORK_ORDER_TYPE || w.TYPE || 'OTHER';
      if (!acc[t]) acc[t] = 0;
      acc[t]++;
      return acc;
    }, {});
    const workOrdersByType = Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalWorkOrders) * 100).toFixed(1)
    }));
    res.json({ success: true, data: { kpis: { totalWorkOrders, open, inProgress, completed }, workOrdersByType } });
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance stats' });
  }
});

// GET maintenance work orders (alias for work orders)
router.get('/', async (req, res) => {
  try {
    const { status, property_id, asset_id, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (status) { where += ' AND wo.status = :status'; countBinds.status = status; }
        if (property_id) { where += ' AND wo.property_id = :property_id'; countBinds.property_id = parseInt(property_id, 10); }
        if (asset_id) { where += ' AND wo.asset_id = :asset_id'; countBinds.asset_id = parseInt(asset_id, 10); }
        const countResult = await db.execute(
          `SELECT COUNT(*) AS cnt FROM work_orders wo${where}`,
          countBinds
        );
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT wo.work_order_id, wo.work_order_number, wo.property_id, wo.asset_id, wo.title, wo.description, wo.work_order_type, wo.priority, wo.vendor_id, wo.reported_date, wo.scheduled_date, wo.completed_date, wo.status,
                  p.property_name AS property_name, a.asset_name AS asset_name, v.vendor_name AS vendor_name
           FROM work_orders wo
           LEFT JOIN properties p ON wo.property_id = p.property_id
           LEFT JOIN assets a ON wo.asset_id = a.asset_id
           LEFT JOIN vendors v ON wo.vendor_id = v.vendor_id
           ${where} ORDER BY wo.work_order_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => ({
          WORK_ORDER_ID: r.WORK_ORDER_ID ?? r.work_order_id,
          work_order_id: r.WORK_ORDER_ID ?? r.work_order_id,
          WORK_ORDER_NUMBER: r.WORK_ORDER_NUMBER ?? r.work_order_number,
          PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
          property_id: r.PROPERTY_ID ?? r.property_id,
          ASSET_ID: r.ASSET_ID ?? r.asset_id,
          asset_id: r.ASSET_ID ?? r.asset_id,
          TITLE: r.TITLE ?? r.title,
          TYPE: r.WORK_ORDER_TYPE ?? r.work_order_type,
          WORK_ORDER_TYPE: r.WORK_ORDER_TYPE ?? r.work_order_type,
          PRIORITY: r.PRIORITY ?? r.priority,
          STATUS: r.STATUS ?? r.status,
          VENDOR_ID: r.VENDOR_ID ?? r.vendor_id,
          SCHEDULED_DATE: r.SCHEDULED_DATE ?? r.scheduled_date,
          COMPLETED_DATE: r.COMPLETED_DATE ?? r.completed_date,
          PROPERTY_NAME: r.PROPERTY_NAME ?? r.property_name ?? null,
          ASSET_NAME: r.ASSET_NAME ?? r.asset_name ?? null,
          VENDOR_NAME: r.VENDOR_NAME ?? r.vendor_name ?? null
        }));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB maintenance list error:', dbErr);
      }
    }

    let filteredWorkOrders = [...WORK_ORDERS];
    if (status) filteredWorkOrders = filteredWorkOrders.filter(w => w.STATUS === status);
    if (property_id) filteredWorkOrders = filteredWorkOrders.filter(w => w.PROPERTY_ID === property_id);
    if (asset_id) filteredWorkOrders = filteredWorkOrders.filter(w => w.ASSET_ID === asset_id);
    const enrichedWorkOrders = filteredWorkOrders.map(wo => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === wo.PROPERTY_ID);
      const asset = wo.ASSET_ID ? ASSETS.find(a => a.ASSET_ID === wo.ASSET_ID) : null;
      const vendor = wo.VENDOR_ID ? VENDORS.find(v => v.VENDOR_ID === wo.VENDOR_ID) : null;
      return { ...wo, PROPERTY_NAME: property ? property.PROPERTY_NAME : null, ASSET_NAME: asset ? asset.ASSET_NAME : null, VENDOR_NAME: vendor ? vendor.VENDOR_NAME : null };
    });
    const total = enrichedWorkOrders.length;
    const paginatedWorkOrders = enrichedWorkOrders.slice(offset, offset + limitNum);
    res.json({ success: true, data: paginatedWorkOrders, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Error fetching maintenance work orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch maintenance work orders' });
  }
});

// GET /api/maintenance/schedules - list schedules (work orders as schedules for table)
router.get('/schedules', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          `SELECT wo.work_order_id, wo.work_order_number, wo.title, wo.work_order_type, wo.status, wo.scheduled_date,
                  p.property_name, a.asset_name
           FROM work_orders wo
           LEFT JOIN properties p ON wo.property_id = p.property_id
           LEFT JOIN assets a ON wo.asset_id = a.asset_id
           ORDER BY wo.scheduled_date DESC NULLS LAST, wo.work_order_id DESC
           OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          { offset, limit: limitNum }
        );
        const data = (result.rows || []).map(r => ({
          SCHEDULE_ID: r.WORK_ORDER_ID ?? r.work_order_id,
          SCHEDULE_NAME: r.TITLE ?? r.title ?? (r.WORK_ORDER_NUMBER ?? r.work_order_number),
          ASSET_NAME: r.ASSET_NAME ?? r.asset_name ?? '-',
          PROPERTY_NAME: r.PROPERTY_NAME ?? r.property_name ?? '-',
          FREQUENCY: (r.WORK_ORDER_TYPE ?? r.work_order_type) === 'PREVENTIVE' ? 'Recurring' : 'One-time',
          NEXT_DUE_DATE: r.SCHEDULED_DATE ?? r.scheduled_date,
          ASSIGNED_TO: '-',
          STATUS: r.STATUS ?? r.status ?? 'OPEN'
        }));
        return res.json({ success: true, data });
      } catch (dbErr) {
        console.error('DB maintenance schedules error:', dbErr);
      }
    }

    const list = WORK_ORDERS.slice(offset, offset + limitNum).map(wo => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === wo.PROPERTY_ID);
      const asset = wo.ASSET_ID ? ASSETS.find(a => a.ASSET_ID === wo.ASSET_ID) : null;
      return {
        SCHEDULE_ID: wo.WORK_ORDER_ID ?? wo.WO_ID,
        SCHEDULE_NAME: wo.TITLE ?? wo.WORK_ORDER_NUMBER ?? wo.WO_NUMBER,
        ASSET_NAME: asset ? asset.ASSET_NAME : '-',
        PROPERTY_NAME: property ? property.PROPERTY_NAME : '-',
        FREQUENCY: (wo.WORK_ORDER_TYPE || wo.TYPE) === 'PREVENTIVE' ? 'Recurring' : 'One-time',
        NEXT_DUE_DATE: wo.SCHEDULED_DATE ?? wo.CREATED_DATE,
        ASSIGNED_TO: wo.ASSIGNED_TO ?? '-',
        STATUS: wo.STATUS ?? 'OPEN'
      };
    });
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          `SELECT wo.work_order_id, wo.work_order_number, wo.property_id, wo.asset_id, wo.title, wo.description, wo.work_order_type, wo.priority, wo.vendor_id, wo.reported_date, wo.scheduled_date, wo.completed_date, wo.status,
                  p.property_name AS property_name, a.asset_name AS asset_name, v.vendor_name AS vendor_name
           FROM work_orders wo
           LEFT JOIN properties p ON wo.property_id = p.property_id
           LEFT JOIN assets a ON wo.asset_id = a.asset_id
           LEFT JOIN vendors v ON wo.vendor_id = v.vendor_id
           WHERE wo.work_order_id = :id`,
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          const r = result.rows[0];
          return res.json({
            success: true,
            data: {
              WORK_ORDER_ID: r.WORK_ORDER_ID ?? r.work_order_id,
              work_order_id: r.WORK_ORDER_ID ?? r.work_order_id,
              WORK_ORDER_NUMBER: r.WORK_ORDER_NUMBER ?? r.work_order_number,
              PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
              ASSET_ID: r.ASSET_ID ?? r.asset_id,
              TITLE: r.TITLE ?? r.title,
              TYPE: r.WORK_ORDER_TYPE ?? r.work_order_type,
              PRIORITY: r.PRIORITY ?? r.priority,
              STATUS: r.STATUS ?? r.status,
              VENDOR_ID: r.VENDOR_ID ?? r.vendor_id,
              SCHEDULED_DATE: r.SCHEDULED_DATE ?? r.scheduled_date,
              COMPLETED_DATE: r.COMPLETED_DATE ?? r.completed_date,
              PROPERTY_NAME: r.PROPERTY_NAME ?? r.property_name ?? null,
              ASSET_NAME: r.ASSET_NAME ?? r.asset_name ?? null,
              VENDOR_NAME: r.VENDOR_NAME ?? r.vendor_name ?? null
            }
          });
        }
      } catch (dbErr) {
        console.error('DB maintenance get error:', dbErr);
      }
    }

    const workOrder = WORK_ORDERS.find(w => String(w.WORK_ORDER_ID) === String(id));
    if (!workOrder) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }
    const property = PROPERTIES.find(p => p.PROPERTY_ID === workOrder.PROPERTY_ID);
    const asset = workOrder.ASSET_ID ? ASSETS.find(a => a.ASSET_ID === workOrder.ASSET_ID) : null;
    const vendor = workOrder.VENDOR_ID ? VENDORS.find(v => v.VENDOR_ID === workOrder.VENDOR_ID) : null;
    res.json({ success: true, data: { ...workOrder, PROPERTY_NAME: property ? property.PROPERTY_NAME : null, ASSET_NAME: asset ? asset.ASSET_NAME : null, VENDOR_NAME: vendor ? vendor.VENDOR_NAME : null } });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work order' });
  }
});

module.exports = router;

