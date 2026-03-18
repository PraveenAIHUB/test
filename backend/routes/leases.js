/**
 * Lease Management Routes - REFACTORED WITH SERVICE LAYER
 * Handles lease lifecycle, rent calculations, renewals, and escalations
 * Uses database when configured; falls back to mock data.
 */

const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { LEASES, PROPERTIES, TENANTS, SPACES } = require('../data/kenyaProductionData');
const LeaseService = require('../services/LeaseService');

const leaseService = new LeaseService(LEASES, PROPERTIES, TENANTS, SPACES);

function rowToLease(r) {
  const id = r.LEASE_ID ?? r.lease_id;
  const start = r.LEASE_START_DATE ?? r.lease_start_date;
  const end = r.LEASE_END_DATE ?? r.lease_end_date;
  const rent = Number(r.RENT_AMOUNT ?? r.rent_amount ?? r.BASE_RENT ?? r.base_rent ?? 0);
  return {
    LEASE_ID: id,
    lease_id: id,
    LEASE_NUMBER: r.LEASE_NUMBER ?? r.lease_number,
    lease_number: r.LEASE_NUMBER ?? r.lease_number,
    PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
    property_id: r.PROPERTY_ID ?? r.property_id,
    TENANT_ID: r.TENANT_ID ?? r.tenant_id,
    tenant_id: r.TENANT_ID ?? r.tenant_id,
    START_DATE: start,
    start_date: start,
    END_DATE: end,
    end_date: end,
    LEASE_START_DATE: start,
    LEASE_END_DATE: end,
    BASE_RENT: r.BASE_RENT ?? r.base_rent ?? rent,
    base_rent: r.BASE_RENT ?? r.base_rent ?? rent,
    RENT_AMOUNT: r.RENT_AMOUNT ?? r.rent_amount ?? rent,
    rent_amount: r.RENT_AMOUNT ?? r.rent_amount ?? rent,
    MONTHLY_RENT: rent,
    monthly_rent: rent,
    LEASE_TYPE: r.LEASE_TYPE ?? r.lease_type ?? 'COMMERCIAL',
    lease_type: r.LEASE_TYPE ?? r.lease_type ?? 'COMMERCIAL',
    STATUS: r.STATUS ?? r.status ?? 'ACTIVE',
    status: r.STATUS ?? r.status ?? 'ACTIVE',
    SECURITY_DEPOSIT: r.SECURITY_DEPOSIT ?? r.security_deposit,
    security_deposit: r.SECURITY_DEPOSIT ?? r.security_deposit,
    PAYMENT_FREQUENCY: r.PAYMENT_FREQUENCY ?? r.payment_frequency ?? 'MONTHLY',
    payment_terms: r.PAYMENT_FREQUENCY ?? r.payment_frequency ?? 'MONTHLY',
    TERM_MONTHS: r.TERM_MONTHS ?? r.term_months,
    term_months: r.TERM_MONTHS ?? r.term_months
  };
}

/** Normalize value to a JS Date for Oracle DATE bind (avoids ORA-01861). */
function toOracleDate(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function bodyToLeaseInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  const start = b.start_date ?? b.START_DATE ?? b.lease_start_date;
  const end = b.end_date ?? b.END_DATE ?? b.lease_end_date;
  const baseRent = b.monthly_rent != null && b.monthly_rent !== '' ? Number(b.monthly_rent) : (b.base_rent != null ? Number(b.base_rent) : 0);
  const termMonths = (start && end) ? Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 30.44)) : 12;
  return {
    lease_number: b.lease_number || b.LEASE_NUMBER || `LEASE-${Date.now()}`,
    property_id: parseInt(b.property_id ?? b.PROPERTY_ID, 10) || null,
    tenant_id: parseInt(b.tenant_id ?? b.TENANT_ID, 10) || null,
    lease_start_date: toOracleDate(start),
    lease_end_date: toOracleDate(end),
    base_rent: baseRent,
    rent_amount: baseRent,
    cam_charges: 0,
    service_charge: 0,
    parking_fee: 0,
    security_deposit: b.security_deposit != null && b.security_deposit !== '' ? Number(b.security_deposit) : null,
    payment_frequency: b.payment_terms || b.PAYMENT_FREQUENCY || 'MONTHLY',
    lease_type: b.lease_type || b.LEASE_TYPE || 'COMMERCIAL',
    status: b.status || b.STATUS || 'ACTIVE',
    term_months: b.term_months ?? termMonths
  };
}

/**
 * GET /api/leases/stats
 * Get dashboard statistics for leases
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await leaseService.getStatistics();
    const expiringLeases = await leaseService.getExpiringLeases(90);
    const revenueTimeline = await leaseService.getRevenueTimeline();

    // Lease duration distribution
    const durationGroups = { '1 Year': 0, '2 Years': 0, '3 Years': 0, '5+ Years': 0 };
    LEASES.forEach(lease => {
      const years = lease.TERM_MONTHS / 12;
      if (years <= 1) durationGroups['1 Year']++;
      else if (years <= 2) durationGroups['2 Years']++;
      else if (years <= 3) durationGroups['3 Years']++;
      else durationGroups['5+ Years']++;
    });

    const leaseDurationDistribution = Object.entries(durationGroups).map(([duration, count]) => ({
      duration,
      count,
      percentage: LEASES.length ? ((count / LEASES.length) * 100).toFixed(1) : 0
    }));

    const totalRev = Object.values(stats.revenueByType || {}).reduce((s, v) => s + Number(v), 0);
    const revenueByLeaseType = Object.entries(stats.revenueByType || {}).map(([type, revenue]) => {
      const rev = Number(revenue);
      const count = (stats.byType || {})[type] || 0;
      const percentage = totalRev > 0 ? ((rev / totalRev) * 100).toFixed(1) : 0;
      return { type, count, revenue: rev, percentage };
    });

    const responseData = {
      kpis: {
        activeLeases: stats.active,
        monthlyRevenue: stats.totalMonthlyRevenue,
        expiringSoon: expiringLeases.length,
        avgLeaseValue: Math.round(stats.avgRent)
      },
      leaseExpiryTimeline: Array.isArray(revenueTimeline) ? revenueTimeline : [],
      revenueByLeaseType,
      leaseDurationDistribution
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching lease stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lease stats' });
  }
});

/**
 * GET /api/leases
 * Get all leases with filtering and pagination
 */
router.get('/', async (req, res) => {
  const { status, property_id, tenant_id, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  try {
    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (status) { where += ' AND status = :status'; countBinds.status = status; }
        if (property_id) { where += ' AND property_id = :property_id'; countBinds.property_id = parseInt(property_id, 10); }
        if (tenant_id) { where += ' AND tenant_id = :tenant_id'; countBinds.tenant_id = parseInt(tenant_id, 10); }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM leases${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT lease_id, lease_number, property_id, tenant_id, space_id, lease_start_date, lease_end_date, base_rent, rent_amount, cam_charges, service_charge, parking_fee, security_deposit, payment_frequency, lease_type, status, term_months FROM leases${where} ORDER BY lease_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => rowToLease(r));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB fetch leases error:', dbErr);
      }
    }

    const filters = {};
    if (status) filters.STATUS = status;
    if (property_id) filters.PROPERTY_ID = property_id;
    if (tenant_id) filters.TENANT_ID = tenant_id;
    const result = await leaseService.getAll(filters, { page: pageNum, limit: limitNum });
    res.json({ success: true, data: result.data, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leases' });
  }
});

/**
 * GET /api/leases/:id
 * Get a single lease by ID with full enrichment
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT lease_id, lease_number, property_id, tenant_id, space_id, lease_start_date, lease_end_date, base_rent, rent_amount, cam_charges, service_charge, parking_fee, security_deposit, payment_frequency, lease_type, status, term_months FROM leases WHERE lease_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          return res.json({ success: true, data: rowToLease(result.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB get lease error:', dbErr);
      }
    }

    const lease = await leaseService.getById(id);
    if (!lease) {
      return res.status(404).json({ success: false, error: 'Lease not found' });
    }
    res.json({ success: true, data: lease });
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lease' });
  }
});

/**
 * POST /api/leases
 * Create a new lease
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToLeaseInsert(body);
    if (!n.property_id || !n.tenant_id || !n.lease_start_date || !n.lease_end_date) {
      return res.status(400).json({ success: false, error: 'property_id, tenant_id, start_date, and end_date are required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO leases (lease_number, property_id, tenant_id, lease_start_date, lease_end_date, base_rent, rent_amount, cam_charges, service_charge, parking_fee, security_deposit, payment_frequency, lease_type, status, term_months)
             VALUES (:lease_number, :property_id, :tenant_id, :lease_start_date, :lease_end_date, :base_rent, :rent_amount, :cam_charges, :service_charge, :parking_fee, :security_deposit, :payment_frequency, :lease_type, :status, :term_months)
             RETURNING lease_id INTO :lease_id`,
            {
              lease_number: n.lease_number,
              property_id: n.property_id,
              tenant_id: n.tenant_id,
              lease_start_date: n.lease_start_date,
              lease_end_date: n.lease_end_date,
              base_rent: n.base_rent,
              rent_amount: n.rent_amount,
              cam_charges: n.cam_charges,
              service_charge: n.service_charge,
              parking_fee: n.parking_fee,
              security_deposit: n.security_deposit,
              payment_frequency: n.payment_frequency,
              lease_type: n.lease_type,
              status: n.status,
              term_months: n.term_months,
              lease_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.lease_id) ? result.outBinds.lease_id[0] : result.outBinds.lease_id;
          const getResult = await conn.execute(
            'SELECT lease_id, lease_number, property_id, tenant_id, lease_start_date, lease_end_date, base_rent, rent_amount, lease_type, status, security_deposit, payment_frequency, term_months FROM leases WHERE lease_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Lease created successfully', data: rowToLease(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create lease error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating lease' });
      }
    }

    const newLease = await leaseService.create(req.body);
    res.status(201).json({ success: true, message: 'Lease created successfully', data: newLease });
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create lease' });
  }
});

/**
 * PUT /api/leases/:id
 * Update an existing lease
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToLeaseInsert(body);

    if (db.isConfigured && db.isConfigured()) {
      try {
        await db.execute(
          `UPDATE leases SET property_id = :property_id, tenant_id = :tenant_id, lease_start_date = :lease_start_date, lease_end_date = :lease_end_date,
           base_rent = :base_rent, rent_amount = :rent_amount, security_deposit = :security_deposit, payment_frequency = :payment_frequency, lease_type = :lease_type, status = :status, term_months = :term_months, last_updated_date = SYSDATE
           WHERE lease_id = :id`,
          {
            property_id: n.property_id,
            tenant_id: n.tenant_id,
            lease_start_date: n.lease_start_date,
            lease_end_date: n.lease_end_date,
            base_rent: n.base_rent,
            rent_amount: n.rent_amount,
            security_deposit: n.security_deposit,
            payment_frequency: n.payment_frequency,
            lease_type: n.lease_type,
            status: n.status,
            term_months: n.term_months,
            id: parseInt(id, 10)
          }
        );
        const getResult = await db.execute(
          'SELECT lease_id, lease_number, property_id, tenant_id, lease_start_date, lease_end_date, base_rent, rent_amount, lease_type, status, security_deposit, payment_frequency, term_months FROM leases WHERE lease_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Lease updated successfully', data: rowToLease(getResult.rows[0]) });
        }
        return res.status(404).json({ success: false, error: 'Lease not found' });
      } catch (dbErr) {
        console.error('DB update lease error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating lease' });
      }
    }

    const updatedLease = await leaseService.update(id, req.body);
    if (!updatedLease) {
      return res.status(404).json({ success: false, error: 'Lease not found' });
    }
    res.json({ success: true, message: 'Lease updated successfully', data: updatedLease });
  } catch (error) {
    console.error('Error updating lease:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update lease' });
  }
});

/**
 * DELETE /api/leases/:id
 * Delete a lease
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM leases WHERE lease_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Lease not found' });
        }
        return res.json({ success: true, message: 'Lease deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete lease error:', dbErr);
        if (dbErr.message && (dbErr.message.includes('ORA-02292') || dbErr.message.includes('child record'))) {
          return res.status(400).json({ success: false, error: 'Cannot delete lease: has related invoices or rent schedule' });
        }
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting lease' });
      }
    }

    const deleted = await leaseService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Lease not found' });
    }
    res.json({ success: true, message: 'Lease deleted successfully' });
  } catch (error) {
    console.error('Error deleting lease:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lease' });
  }
});

module.exports = router;
