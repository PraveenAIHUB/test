const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { VENDORS, VENDOR_INVOICES, WORK_ORDERS } = require('../data/kenyaProductionData');

function rowToVendor(r) {
  const id = r.VENDOR_ID ?? r.vendor_id;
  return {
    VENDOR_ID: id,
    vendor_id: id,
    VENDOR_CODE: r.VENDOR_CODE ?? r.vendor_code,
    vendor_code: r.VENDOR_CODE ?? r.vendor_code,
    VENDOR_NAME: r.VENDOR_NAME ?? r.vendor_name,
    vendor_name: r.VENDOR_NAME ?? r.vendor_name,
    VENDOR_TYPE: r.VENDOR_TYPE ?? r.vendor_type,
    vendor_type: r.VENDOR_TYPE ?? r.vendor_type,
    SERVICE_CATEGORY: r.VENDOR_TYPE ?? r.vendor_type,
    CONTACT_PERSON: r.CONTACT_PERSON ?? r.contact_person,
    contact_person: r.CONTACT_PERSON ?? r.contact_person,
    EMAIL: r.CONTACT_EMAIL ?? r.contact_email,
    contact_email: r.CONTACT_EMAIL ?? r.contact_email,
    PHONE: r.CONTACT_PHONE ?? r.contact_phone,
    contact_phone: r.CONTACT_PHONE ?? r.contact_phone,
    ADDRESS: r.ADDRESS ?? r.address,
    address: r.ADDRESS ?? r.address,
    STATUS: r.STATUS ?? r.status,
    status: r.STATUS ?? r.status,
    RATING: r.RATING ?? r.rating,
    rating: r.RATING ?? r.rating
  };
}

function bodyToVendorInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  return {
    vendor_code: b.vendor_code || b.VENDOR_CODE || `VND-${Date.now()}`,
    vendor_name: String(b.vendor_name ?? b.VENDOR_NAME ?? '').trim(),
    vendor_type: b.vendor_type || b.VENDOR_TYPE || b.service_category || 'SERVICE',
    contact_person: b.contact_person ?? b.CONTACT_PERSON ?? null,
    contact_email: b.contact_email ?? b.CONTACT_EMAIL ?? b.email ?? null,
    contact_phone: b.contact_phone ?? b.CONTACT_PHONE ?? b.phone ?? null,
    address: b.address || b.ADDRESS || null,
    status: b.status || b.STATUS || 'ACTIVE',
    rating: b.rating != null && b.rating !== '' ? Number(b.rating) : null
  };
}

// GET vendor dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Calculate stats from production data
    const activeVendors = VENDORS.filter(v => v.STATUS === 'ACTIVE').length;

    // Average rating
    const vendorsWithRating = VENDORS.filter(v => v.RATING);
    const avgRating = vendorsWithRating.length > 0
      ? vendorsWithRating.reduce((sum, v) => sum + v.RATING, 0) / vendorsWithRating.length
      : 0;

    // Monthly spend (total vendor invoices / 12)
    const totalSpend = VENDOR_INVOICES.reduce((sum, vi) => sum + vi.TOTAL_AMOUNT, 0);
    const monthlySpend = totalSpend / 12;

    // On-time delivery (completed work orders on time)
    const completedWOs = WORK_ORDERS.filter(wo => wo.STATUS === 'COMPLETED' && wo.VENDOR_ID);
    const onTimeWOs = completedWOs.filter(wo => {
      if (!wo.SCHEDULED_DATE || !wo.COMPLETED_DATE) return false;
      return new Date(wo.COMPLETED_DATE) <= new Date(wo.SCHEDULED_DATE);
    });
    const onTimeDelivery = completedWOs.length > 0
      ? (onTimeWOs.length / completedWOs.length * 100)
      : 0;

    // Vendors by category
    const categoryGroups = VENDORS.reduce((acc, v) => {
      if (!acc[v.SERVICE_CATEGORY]) acc[v.SERVICE_CATEGORY] = 0;
      acc[v.SERVICE_CATEGORY]++;
      return acc;
    }, {});

    const vendorsByCategory = Object.entries(categoryGroups).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / VENDORS.length) * 100).toFixed(1)
    }));

    // Top vendors by spend
    const vendorSpend = VENDORS.map(vendor => {
      const vendorInvoices = VENDOR_INVOICES.filter(vi => vi.VENDOR_ID === vendor.VENDOR_ID);
      const spend = vendorInvoices.reduce((sum, vi) => sum + vi.TOTAL_AMOUNT, 0);
      return {
        name: vendor.VENDOR_NAME,
        spend,
        category: vendor.SERVICE_CATEGORY
      };
    }).sort((a, b) => b.spend - a.spend).slice(0, 5);

    // Performance ratings
    const ratingGroups = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
    VENDORS.forEach(v => {
      if (!v.RATING) return;
      if (v.RATING >= 4.5) ratingGroups['5 Stars']++;
      else if (v.RATING >= 3.5) ratingGroups['4 Stars']++;
      else if (v.RATING >= 2.5) ratingGroups['3 Stars']++;
      else if (v.RATING >= 1.5) ratingGroups['2 Stars']++;
      else ratingGroups['1 Star']++;
    });

    const performanceRatings = Object.entries(ratingGroups)
      .filter(([_, count]) => count > 0)
      .map(([rating, count]) => ({
        rating,
        count,
        percentage: ((count / vendorsWithRating.length) * 100).toFixed(1)
      }));

    const stats = {
      kpis: {
        activeVendors,
        avgRating: avgRating.toFixed(1),
        monthlySpend: Math.round(monthlySpend),
        onTimeDelivery: onTimeDelivery.toFixed(1)
      },
      vendorsByCategory,
      topVendorsBySpend: vendorSpend,
      performanceRatings
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor stats' });
  }
});

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const { service_category, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (service_category) { where += ' AND vendor_type = :vendor_type'; countBinds.vendor_type = service_category; }
        if (status) { where += ' AND status = :status'; countBinds.status = status; }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM vendors${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT vendor_id, vendor_code, vendor_name, vendor_type, contact_person, contact_email, contact_phone, address, status, rating FROM vendors${where} ORDER BY vendor_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => rowToVendor(r));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB fetch vendors error:', dbErr);
      }
    }

    let filteredVendors = [...VENDORS];
    if (service_category) filteredVendors = filteredVendors.filter(v => v.SERVICE_CATEGORY === service_category);
    if (status) filteredVendors = filteredVendors.filter(v => v.STATUS === status);
    const enrichedVendors = filteredVendors.map(vendor => {
      const vendorWorkOrders = WORK_ORDERS.filter(wo => wo.VENDOR_ID === vendor.VENDOR_ID);
      const vendorInvoices = VENDOR_INVOICES.filter(vi => vi.VENDOR_ID === vendor.VENDOR_ID);
      const totalSpend = vendorInvoices.reduce((sum, vi) => sum + vi.TOTAL_AMOUNT, 0);
      return { ...vendor, TOTAL_WORK_ORDERS: vendorWorkOrders.length, TOTAL_INVOICES: vendorInvoices.length, TOTAL_SPEND: totalSpend };
    });
    enrichedVendors.sort((a, b) => a.VENDOR_NAME.localeCompare(b.VENDOR_NAME));
    const total = enrichedVendors.length;
    const paginatedVendors = enrichedVendors.slice(offset, offset + limitNum);
    res.json({ success: true, data: paginatedVendors, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vendors' });
  }
});

// GET single vendor
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT vendor_id, vendor_code, vendor_name, vendor_type, contact_person, contact_email, contact_phone, address, status, rating FROM vendors WHERE vendor_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          return res.json({ success: true, data: rowToVendor(result.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB get vendor error:', dbErr);
      }
    }

    const vendor = VENDORS.find(v => v.VENDOR_ID == id || v.vendor_id == id);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    const vendorWorkOrders = WORK_ORDERS.filter(wo => wo.VENDOR_ID === vendor.VENDOR_ID);
    const vendorInvoices = VENDOR_INVOICES.filter(vi => vi.VENDOR_ID === vendor.VENDOR_ID);
    const enrichedVendor = {
      ...vendor,
      WORK_ORDERS: vendorWorkOrders.map(wo => ({ WORK_ORDER_ID: wo.WORK_ORDER_ID, WORK_ORDER_CODE: wo.WORK_ORDER_CODE, DESCRIPTION: wo.DESCRIPTION, STATUS: wo.STATUS, CREATED_DATE: wo.CREATED_DATE })),
      INVOICES: vendorInvoices.map(vi => ({ INVOICE_ID: vi.VENDOR_INVOICE_ID, INVOICE_CODE: vi.INVOICE_CODE, TOTAL_AMOUNT: vi.TOTAL_AMOUNT, STATUS: vi.STATUS, INVOICE_DATE: vi.INVOICE_DATE })),
      TOTAL_SPEND: vendorInvoices.reduce((sum, vi) => sum + vi.TOTAL_AMOUNT, 0)
    };
    res.json({ success: true, data: enrichedVendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor' });
  }
});

// CREATE new vendor
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToVendorInsert(body);
    if (!n.vendor_name) {
      return res.status(400).json({ success: false, error: 'vendor_name is required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, contact_email, contact_phone, address, status, rating)
             VALUES (:vendor_code, :vendor_name, :vendor_type, :contact_person, :contact_email, :contact_phone, :address, :status, :rating)
             RETURNING vendor_id INTO :vendor_id`,
            {
              vendor_code: n.vendor_code,
              vendor_name: n.vendor_name,
              vendor_type: n.vendor_type,
              contact_person: n.contact_person,
              contact_email: n.contact_email,
              contact_phone: n.contact_phone,
              address: n.address,
              status: n.status,
              rating: n.rating,
              vendor_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.vendor_id) ? result.outBinds.vendor_id[0] : result.outBinds.vendor_id;
          const getResult = await conn.execute(
            'SELECT vendor_id, vendor_code, vendor_name, vendor_type, contact_person, contact_email, contact_phone, address, status, rating FROM vendors WHERE vendor_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Vendor created successfully', data: rowToVendor(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create vendor error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating vendor' });
      }
    }

    return res.status(201).json({ success: true, message: 'Vendor creation requires database connection', data: null });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ success: false, error: 'Failed to create vendor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToVendorInsert(body);

    if (db.isConfigured && db.isConfigured()) {
      try {
        await db.execute(
          `UPDATE vendors SET vendor_name = :vendor_name, vendor_type = :vendor_type, contact_person = :contact_person, contact_email = :contact_email, contact_phone = :contact_phone, address = :address, status = :status, rating = :rating, last_updated_date = SYSDATE WHERE vendor_id = :id`,
          {
            vendor_name: n.vendor_name,
            vendor_type: n.vendor_type,
            contact_person: n.contact_person,
            contact_email: n.contact_email,
            contact_phone: n.contact_phone,
            address: n.address,
            status: n.status,
            rating: n.rating,
            id: parseInt(id, 10)
          }
        );
        const getResult = await db.execute(
          'SELECT vendor_id, vendor_code, vendor_name, vendor_type, contact_person, contact_email, contact_phone, address, status, rating FROM vendors WHERE vendor_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Vendor updated successfully', data: rowToVendor(getResult.rows[0]) });
        }
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      } catch (dbErr) {
        console.error('DB update vendor error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating vendor' });
      }
    }

    const vendor = VENDORS.find(v => v.VENDOR_ID == id);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor update requires database connection', data: vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ success: false, error: 'Failed to update vendor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM vendors WHERE vendor_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Vendor not found' });
        }
        return res.json({ success: true, message: 'Vendor deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete vendor error:', dbErr);
        if (dbErr.message && (dbErr.message.includes('ORA-02292') || dbErr.message.includes('child record'))) {
          return res.status(400).json({ success: false, error: 'Cannot delete vendor: has related work orders or invoices' });
        }
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting vendor' });
      }
    }

    const vendor = VENDORS.find(v => v.VENDOR_ID == id);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deletion requires database connection' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ success: false, error: 'Failed to delete vendor' });
  }
});

module.exports = router;
