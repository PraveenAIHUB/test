const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const TenantService = require('../services/TenantService');
const db = require('../config/database');
const { TENANTS, LEASES, PROPERTIES, INVOICES } = require('../data/kenyaProductionData');

const tenantService = new TenantService(TENANTS, LEASES, INVOICES);

/**
 * Normalize request body from frontend (snake_case) to backend/DB format.
 * Auto-generate tenant_code if not provided.
 */
function normalizeTenantBody(body, forUpdate = false) {
  const b = body && typeof body === 'object' ? body : {};
  const tenant_code = b.tenant_code || b.TENANT_CODE ||
    (forUpdate ? undefined : `TEN-${Date.now().toString(36).toUpperCase()}`);
  const tenant_name = String(b.tenant_name ?? b.TENANT_NAME ?? '').trim();
  const tenant_type = b.tenant_type || b.TENANT_TYPE || 'CORPORATE';
  const contact_person = String(b.contact_person ?? b.CONTACT_PERSON ?? '').trim();
  const contact_email = String(b.email ?? b.EMAIL ?? b.contact_email ?? '').trim();
  const contact_phone = String(b.phone ?? b.PHONE ?? b.contact_phone ?? '').trim();
  const status = b.status || b.STATUS || 'ACTIVE';
  // DB allows ACTIVE, INACTIVE, BLACKLISTED - map SUSPENDED to INACTIVE
  const statusDb = status === 'SUSPENDED' ? 'INACTIVE' : status;

  const normalized = {
    TENANT_NAME: tenant_name,
    TENANT_CODE: tenant_code,
    TENANT_TYPE: tenant_type,
    CONTACT_PERSON: contact_person,
    EMAIL: contact_email,
    PHONE: contact_phone,
    STATUS: status,
    tenant_name,
    tenant_code,
    tenant_type,
    contact_person,
    contact_email,
    contact_phone,
    status: statusDb
  };
  return normalized;
}

/**
 * GET /api/tenants/stats
 * Get dashboard statistics for tenants
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await tenantService.getStatistics();
    const enrichedTenants = await tenantService.enrichMany(TENANTS);

    // Tenants by type
    const tenantsByType = Object.entries(stats.byType).map(([type, count]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / stats.total) * 100).toFixed(1)
    }));

    // Tenants by location (based on their leased properties)
    const locationGroups = {};
    LEASES.forEach(lease => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === lease.PROPERTY_ID);
      if (property) {
        const location = property.CITY;
        if (!locationGroups[location]) locationGroups[location] = new Set();
        locationGroups[location].add(lease.TENANT_ID);
      }
    });
    const tenantsByLocation = Object.entries(locationGroups).map(([location, tenantSet]) => ({
      location,
      count: tenantSet.size
    }));

    // Top tenants by revenue
    const topTenantsByRevenue = enrichedTenants
      .filter(t => (t.MONTHLY_REVENUE || 0) > 0)
      .sort((a, b) => (b.MONTHLY_REVENUE || 0) - (a.MONTHLY_REVENUE || 0))
      .slice(0, 5)
      .map(t => ({
        name: t.TENANT_NAME,
        revenue: t.MONTHLY_REVENUE || 0,
        leases: t.ACTIVE_LEASE_COUNT || 0
      }));

    const responseData = {
      kpis: {
        totalTenants: stats.total,
        corporateTenants: stats.byType.CORPORATE || 0,
        avgTenure: (stats.avgTenure / 365).toFixed(1), // Convert days to years
        paymentRate: stats.avgPaymentRate
      },
      tenantsByType,
      tenantsByLocation,
      topTenantsByRevenue
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenant stats' });
  }
});

/**
 * GET /api/tenants
 * Get all tenants with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const binds = {};
        if (status) { where += ' AND status = :status'; binds.status = status; }
        if (type) { where += ' AND tenant_type = :tenant_type'; binds.tenant_type = type; }
        if (search) { where += ' AND (UPPER(tenant_name) LIKE :search OR UPPER(tenant_code) LIKE :search)'; binds.search = `%${search.toUpperCase()}%`; }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM tenants${where}`, binds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...binds, limit: limitNum, offset };
        const result = await db.execute(
          `SELECT tenant_id, tenant_code, tenant_name, tenant_type, contact_person, contact_email, contact_phone, status, created_date
           FROM tenants${where} ORDER BY tenant_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => {
          const id = r.TENANT_ID ?? r.tenant_id;
          return {
            TENANT_ID: id,
            tenant_id: id,
            TENANT_CODE: r.TENANT_CODE ?? r.tenant_code,
            tenant_code: r.TENANT_CODE ?? r.tenant_code,
            TENANT_NAME: r.TENANT_NAME ?? r.tenant_name,
            tenant_name: r.TENANT_NAME ?? r.tenant_name,
            TENANT_TYPE: r.TENANT_TYPE ?? r.tenant_type,
            tenant_type: r.TENANT_TYPE ?? r.tenant_type,
            CONTACT_PERSON: r.CONTACT_PERSON ?? r.contact_person,
            contact_person: r.CONTACT_PERSON ?? r.contact_person,
            EMAIL: r.CONTACT_EMAIL ?? r.contact_email,
            contact_email: r.CONTACT_EMAIL ?? r.contact_email,
            PHONE: r.CONTACT_PHONE ?? r.contact_phone,
            contact_phone: r.CONTACT_PHONE ?? r.contact_phone,
            STATUS: r.STATUS ?? r.status,
            status: r.STATUS ?? r.status
          };
        });
        return res.json({
          success: true,
          data,
          pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
      } catch (dbErr) {
        console.error('DB fetch tenants error:', dbErr);
      }
    }

    const filters = {};
    if (status) filters.STATUS = status;
    if (type) filters.TENANT_TYPE = type;
    if (search) filters.search = search;
    const result = await tenantService.getAll(filters, { page: pageNum, limit: limitNum });
    res.json({
      success: true,
      data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

/**
 * GET /api/tenants/:id
 * Get a single tenant by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT tenant_id, tenant_code, tenant_name, tenant_type, contact_person, contact_email, contact_phone, status, created_date FROM tenants WHERE tenant_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          const r = result.rows[0];
          const tenant = {
            TENANT_ID: r.TENANT_ID,
            tenant_id: r.TENANT_ID,
            TENANT_CODE: r.TENANT_CODE,
            tenant_code: r.TENANT_CODE,
            TENANT_NAME: r.TENANT_NAME,
            tenant_name: r.TENANT_NAME,
            TENANT_TYPE: r.TENANT_TYPE,
            tenant_type: r.TENANT_TYPE,
            CONTACT_PERSON: r.CONTACT_PERSON,
            contact_person: r.CONTACT_PERSON,
            EMAIL: r.CONTACT_EMAIL,
            contact_email: r.CONTACT_EMAIL,
            PHONE: r.CONTACT_PHONE,
            contact_phone: r.CONTACT_PHONE,
            STATUS: r.STATUS,
            status: r.STATUS
          };
          const leaseResult = await db.execute(
            'SELECT l.lease_id, l.lease_number, p.property_name, p.property_code, l.base_rent, l.rent_amount, l.lease_start_date, l.lease_end_date, l.status FROM leases l JOIN properties p ON p.property_id = l.property_id WHERE l.tenant_id = :id AND l.status = \'ACTIVE\'',
            { id: parseInt(id, 10) }
          );
          tenant.PROPERTIES = (leaseResult.rows || []).map(row => ({
            LEASE_ID: row.LEASE_ID,
            PROPERTY_NAME: row.PROPERTY_NAME,
            PROPERTY_CODE: row.PROPERTY_CODE,
            MONTHLY_RENT: row.RENT_AMOUNT ?? row.BASE_RENT ?? 0,
            START_DATE: row.LEASE_START_DATE,
            END_DATE: row.LEASE_END_DATE
          }));
          return res.json({ success: true, data: tenant });
        }
      } catch (dbErr) {
        console.error('DB get tenant error:', dbErr);
      }
    }

    const tenant = await tenantService.getById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    const tenantLeases = LEASES.filter(l => l.TENANT_ID === tenant.TENANT_ID && l.STATUS === 'ACTIVE');
    const tenantProperties = tenantLeases.map(lease => {
      const property = PROPERTIES.find(p => p.PROPERTY_ID === lease.PROPERTY_ID);
      return {
        LEASE_ID: lease.LEASE_ID,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        PROPERTY_CODE: property ? property.PROPERTY_CODE : null,
        MONTHLY_RENT: lease.MONTHLY_RENT || lease.BASE_RENT || 0,
        START_DATE: lease.START_DATE,
        END_DATE: lease.END_DATE
      };
    });
    res.json({ success: true, data: { ...tenant, PROPERTIES: tenantProperties } });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenant' });
  }
});

/**
 * Build normalized tenant payload from request body (handles any key casing).
 */
function buildTenantPayload(body) {
  const b = body && typeof body === 'object' ? body : {};
  const v = (x) => (x != null && x !== '') ? String(x).trim() : '';
  const name = v(b.tenant_name ?? b.TENANT_NAME);
  const code = b.tenant_code ?? b.TENANT_CODE ?? `TEN-${Date.now().toString(36).toUpperCase()}`;
  const type = b.tenant_type ?? b.TENANT_TYPE ?? 'CORPORATE';
  const email = v(b.email ?? b.EMAIL ?? b.contact_email);
  const phone = v(b.phone ?? b.PHONE ?? b.contact_phone);
  const contactPerson = v(b.contact_person ?? b.CONTACT_PERSON);
  const status = b.status ?? b.STATUS ?? 'ACTIVE';
  return {
    tenant_name: name,
    TENANT_NAME: name,
    tenant_code: code,
    TENANT_CODE: code,
    tenant_type: type,
    TENANT_TYPE: type,
    email,
    EMAIL: email,
    contact_email: email,
    phone,
    PHONE: phone,
    contact_phone: phone,
    contact_person: contactPerson,
    CONTACT_PERSON: contactPerson,
    status: status === 'SUSPENDED' ? 'INACTIVE' : status,
    STATUS: status
  };
}

/**
 * POST /api/tenants
 * Create a new tenant
 */
router.post('/', async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {
        body = {};
      }
    }
    if (!body || typeof body !== 'object') {
      body = {};
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[POST /api/tenants] body keys:', Object.keys(body));
    }
    const payload = buildTenantPayload(body);

    if (!payload.TENANT_NAME || !payload.EMAIL || !payload.PHONE) {
      const received = Object.keys(body).length ? Object.keys(body).join(', ') : '(empty or not parsed)';
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tenant_name, email, and phone are required. Received keys: ' + received
      });
    }

    tenantService.validate(payload, false);

    const statusDb = payload.status;
    const n = {
      tenant_name: payload.TENANT_NAME,
      tenant_code: payload.TENANT_CODE,
      tenant_type: payload.TENANT_TYPE,
      contact_person: payload.CONTACT_PERSON || null,
      contact_email: payload.EMAIL,
      contact_phone: payload.PHONE,
      status: statusDb
    };

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const result = await conn.execute(
            `INSERT INTO tenants (tenant_code, tenant_name, tenant_type, contact_person, contact_email, contact_phone, status)
             VALUES (:tenant_code, :tenant_name, :tenant_type, :contact_person, :contact_email, :contact_phone, :status)
             RETURNING tenant_id INTO :tenant_id`,
            {
              tenant_code: n.tenant_code,
              tenant_name: n.tenant_name,
              tenant_type: n.tenant_type,
              contact_person: n.contact_person || null,
              contact_email: n.contact_email,
              contact_phone: n.contact_phone,
              status: n.status,
              tenant_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.tenant_id) ? result.outBinds.tenant_id[0] : result.outBinds.tenant_id;
          const getResult = await conn.execute(
            'SELECT tenant_id, tenant_code, tenant_name, tenant_type, contact_person, contact_email, contact_phone, status FROM tenants WHERE tenant_id = :id',
            { id: newId }
          );
          await conn.close();
          const r = getResult.rows[0];
          const newTenant = {
            TENANT_ID: r.TENANT_ID,
            tenant_id: r.TENANT_ID,
            TENANT_CODE: r.TENANT_CODE,
            tenant_code: r.TENANT_CODE,
            TENANT_NAME: r.TENANT_NAME,
            tenant_name: r.TENANT_NAME,
            TENANT_TYPE: r.TENANT_TYPE,
            tenant_type: r.TENANT_TYPE,
            CONTACT_PERSON: r.CONTACT_PERSON,
            contact_person: r.CONTACT_PERSON,
            EMAIL: r.CONTACT_EMAIL,
            contact_email: r.CONTACT_EMAIL,
            PHONE: r.CONTACT_PHONE,
            contact_phone: r.CONTACT_PHONE,
            STATUS: r.STATUS,
            status: r.STATUS
          };
          return res.status(201).json({ success: true, message: 'Tenant created successfully', data: newTenant });
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create tenant error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating tenant' });
      }
    }

    const newTenant = await tenantService.create(payload);
    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: newTenant
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create tenant'
    });
  }
});

/**
 * PUT /api/tenants/:id
 * Update a tenant
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const raw = req.body && typeof req.body === 'object' ? req.body : {};
    const body = raw.data && typeof raw.data === 'object' ? raw.data : (raw.tenant && typeof raw.tenant === 'object' ? raw.tenant : raw);
    const n = normalizeTenantBody(body, true);
    if (n.tenant_code) n.TENANT_CODE = n.tenant_code;
    tenantService.validate(n, true);

    if (db.isConfigured && db.isConfigured()) {
      try {
        await db.execute(
          `UPDATE tenants SET tenant_name = :tenant_name, tenant_type = :tenant_type, contact_person = :contact_person,
           contact_email = :contact_email, contact_phone = :contact_phone, status = :status, last_updated_date = SYSDATE
           WHERE tenant_id = :id`,
          {
            tenant_name: n.tenant_name,
            tenant_type: n.tenant_type,
            contact_person: n.contact_person || null,
            contact_email: n.contact_email,
            contact_phone: n.contact_phone,
            status: n.status,
            id: parseInt(id, 10)
          }
        );
        const getResult = await db.execute(
          'SELECT tenant_id, tenant_code, tenant_name, tenant_type, contact_person, contact_email, contact_phone, status FROM tenants WHERE tenant_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          const r = getResult.rows[0];
          const updatedTenant = {
            TENANT_ID: r.TENANT_ID,
            tenant_id: r.TENANT_ID,
            TENANT_CODE: r.TENANT_CODE,
            tenant_code: r.TENANT_CODE,
            TENANT_NAME: r.TENANT_NAME,
            tenant_name: r.TENANT_NAME,
            TENANT_TYPE: r.TENANT_TYPE,
            tenant_type: r.TENANT_TYPE,
            CONTACT_PERSON: r.CONTACT_PERSON,
            contact_person: r.CONTACT_PERSON,
            EMAIL: r.CONTACT_EMAIL,
            contact_email: r.CONTACT_EMAIL,
            PHONE: r.CONTACT_PHONE,
            contact_phone: r.CONTACT_PHONE,
            STATUS: r.STATUS,
            status: r.STATUS
          };
          return res.json({ success: true, message: 'Tenant updated successfully', data: updatedTenant });
        }
      } catch (dbErr) {
        console.error('DB update tenant error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating tenant' });
      }
    }

    const updatedTenant = await tenantService.update(id, n);
    if (!updatedTenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update tenant'
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete a tenant
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute('DELETE FROM tenants WHERE tenant_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Tenant not found' });
        }
        return res.json({ success: true, message: 'Tenant deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete tenant error:', dbErr);
        if (dbErr.message && (dbErr.message.includes('ORA-02292') || dbErr.message.includes('child record'))) {
          return res.status(400).json({ success: false, error: 'Cannot delete tenant: has related leases or records' });
        }
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting tenant' });
      }
    }

    const deleted = await tenantService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tenant'
    });
  }
});

module.exports = router;
