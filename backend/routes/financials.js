const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const db = require('../config/database');
const { INVOICES, VENDOR_INVOICES, LEASES, TENANTS, PROPERTIES, VENDORS, PAYMENT_RECEIPTS } = require('../data/kenyaProductionData');
const FinancialService = require('../services/FinancialService');

const financialService = new FinancialService(INVOICES, TENANTS, LEASES, PROPERTIES, PAYMENT_RECEIPTS);

/** Normalize value to a JS Date for Oracle DATE bind (avoids ORA-01861). */
function toOracleDate(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function rowToInvoice(r) {
  const id = r.INVOICE_ID ?? r.invoice_id;
  return {
    INVOICE_ID: id,
    invoice_id: id,
    INVOICE_NUMBER: r.INVOICE_NUMBER ?? r.invoice_number,
    invoice_number: r.INVOICE_NUMBER ?? r.invoice_number,
    TENANT_ID: r.TENANT_ID ?? r.tenant_id,
    tenant_id: r.TENANT_ID ?? r.tenant_id,
    LEASE_ID: r.LEASE_ID ?? r.lease_id,
    lease_id: r.LEASE_ID ?? r.lease_id,
    PROPERTY_ID: r.PROPERTY_ID ?? r.property_id,
    property_id: r.PROPERTY_ID ?? r.property_id,
    INVOICE_DATE: r.INVOICE_DATE ?? r.invoice_date,
    invoice_date: r.INVOICE_DATE ?? r.invoice_date,
    DUE_DATE: r.DUE_DATE ?? r.due_date,
    due_date: r.DUE_DATE ?? r.due_date,
    AMOUNT: r.AMOUNT ?? r.amount,
    amount: r.AMOUNT ?? r.amount,
    TAX_AMOUNT: r.VAT_AMOUNT ?? r.vat_amount ?? 0,
    VAT_AMOUNT: r.VAT_AMOUNT ?? r.vat_amount ?? 0,
    TOTAL_AMOUNT: r.TOTAL_AMOUNT ?? r.total_amount,
    total_amount: r.TOTAL_AMOUNT ?? r.total_amount,
    STATUS: r.STATUS ?? r.status ?? 'PENDING',
    status: r.STATUS ?? r.status ?? 'PENDING',
    PAYMENT_DATE: r.PAYMENT_DATE ?? r.payment_date,
    payment_date: r.PAYMENT_DATE ?? r.payment_date,
    DESCRIPTION: r.DESCRIPTION ?? r.description,
    description: r.DESCRIPTION ?? r.description
  };
}

function bodyToInvoiceInsert(body) {
  const b = body && typeof body === 'object' ? body : {};
  const amount = parseFloat(b.amount ?? b.AMOUNT ?? 0) || 0;
  const vatRate = parseFloat(b.vat_rate ?? b.VAT_RATE ?? 16) || 16;
  const whtRate = parseFloat(b.withholding_tax_rate ?? b.WITHHOLDING_TAX_RATE ?? 10) || 10;
  const vatAmount = (amount * vatRate / 100);
  const whtAmount = (amount * whtRate / 100);
  const totalAmount = amount + vatAmount;
  const netAmountDue = totalAmount - whtAmount;
  return {
    invoice_number: b.invoice_number || b.INVOICE_NUMBER || `INV-${new Date().toISOString().slice(0, 7).replace(/-/, '')}-${String(Date.now()).slice(-6)}`,
    tenant_id: parseInt(b.tenant_id ?? b.TENANT_ID, 10) || null,
    lease_id: b.lease_id != null && b.lease_id !== '' ? parseInt(b.lease_id ?? b.LEASE_ID, 10) : null,
    property_id: parseInt(b.property_id ?? b.PROPERTY_ID, 10) || null,
    invoice_type: b.invoice_type || b.INVOICE_TYPE || 'RENT',
    due_date: b.due_date || b.DUE_DATE || null,
    billing_period_start: b.billing_period_start || null,
    billing_period_end: b.billing_period_end || null,
    amount,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    withholding_tax_rate: whtRate,
    withholding_tax_amount: whtAmount,
    total_amount: totalAmount,
    net_amount_due: netAmountDue,
    status: b.status || b.STATUS || 'PENDING',
    description: b.description ?? b.DESCRIPTION ?? null
  };
}

/**
 * GET /api/financials/stats
 * Get financial dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get statistics from service
    const stats = await financialService.getStatistics();
    const monthlyRevenueTrend = financialService.getMonthlyRevenueTrend(7);

    // Calculate expenses (vendor invoices)
    const paidVendorInvoices = VENDOR_INVOICES.filter(vi => vi.STATUS === 'PAID');
    const totalExpenses = paidVendorInvoices.reduce((sum, vi) => sum + vi.TOTAL_AMOUNT, 0);

    // Net operating income
    const netOperatingIncome = stats.paidAmount - totalExpenses;

    // Expenses by category (from vendor invoices)
    const categoryGroups = VENDOR_INVOICES.reduce((acc, vi) => {
      const vendor = VENDORS.find(v => v.VENDOR_ID === vi.VENDOR_ID);
      const category = vendor ? vendor.SERVICE_CATEGORY : 'Other';
      if (!acc[category]) acc[category] = 0;
      acc[category] += vi.TOTAL_AMOUNT;
      return acc;
    }, {});

    const expensesByCategory = Object.entries(categoryGroups).map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / totalExpenses) * 100).toFixed(1)
    }));

    // Collection rate by month (last 7 months)
    const collectionRate = monthlyRevenueTrend.map(item => ({
      month: item.month,
      rate: stats.collectionRate
    }));

    const responseData = {
      kpis: {
        monthlyRevenue: stats.totalAmount,
        collections: stats.paidAmount,
        outstanding: stats.pendingAmount,
        netOperatingIncome
      },
      revenueByMonth: monthlyRevenueTrend,
      expensesByCategory,
      collectionRate,
      aging: stats.aging
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch financial stats' });
  }
});

/**
 * GET /api/financials
 * Get all invoices with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, tenant_id, property_id, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // If type filter is 'EXPENSE', return vendor invoices (no DB table for vendor invoices in schema)
    if (type === 'EXPENSE') {
      // Filter vendor invoices
      let vendorInvoices = [...VENDOR_INVOICES];

      if (status) {
        vendorInvoices = vendorInvoices.filter(i => i.STATUS === status);
      }
      if (property_id) {
        vendorInvoices = vendorInvoices.filter(i => i.PROPERTY_ID === property_id);
      }

      // Enrich vendor invoices
      const enrichedVendorInvoices = vendorInvoices.map(inv => {
        const vendor = VENDORS.find(v => v.VENDOR_ID === inv.VENDOR_ID);
        const property = PROPERTIES.find(p => p.PROPERTY_ID === inv.PROPERTY_ID);

        return {
          ...inv,
          TYPE: 'EXPENSE',
          VENDOR_NAME: vendor ? vendor.VENDOR_NAME : null,
          PROPERTY_NAME: property ? property.PROPERTY_NAME : null
        };
      });

      const total = enrichedVendorInvoices.length;
      const paginatedInvoices = enrichedVendorInvoices.slice(offset, offset + limitNum);
      return res.json({
        success: true,
        data: paginatedInvoices,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
      });
    }

    // Tenant invoices (REVENUE): from DB or service
    if (db.isConfigured && db.isConfigured()) {
      try {
        let where = ' WHERE 1=1';
        const countBinds = {};
        if (status) { where += ' AND status = :status'; countBinds.status = status; }
        if (tenant_id) { where += ' AND tenant_id = :tenant_id'; countBinds.tenant_id = parseInt(tenant_id, 10); }
        if (property_id) { where += ' AND property_id = :property_id'; countBinds.property_id = parseInt(property_id, 10); }
        const countResult = await db.execute(`SELECT COUNT(*) AS cnt FROM tenant_invoices${where}`, countBinds);
        const total = Number(countResult.rows?.[0]?.CNT ?? countResult.rows?.[0]?.cnt ?? 0);
        const dataBinds = { ...countBinds, offset, limit: limitNum };
        const result = await db.execute(
          `SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, invoice_date, due_date, amount, vat_amount, total_amount, status, payment_date, description FROM tenant_invoices${where} ORDER BY invoice_id DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
          dataBinds
        );
        const data = (result.rows || []).map(r => ({ ...rowToInvoice(r), TYPE: 'REVENUE' }));
        return res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
      } catch (dbErr) {
        console.error('DB fetch invoices error:', dbErr);
      }
    }

    const filters = {};
    if (status) filters.STATUS = status;
    if (tenant_id) filters.TENANT_ID = tenant_id;
    if (property_id) filters.PROPERTY_ID = property_id;
    const result = await financialService.getAll(filters, { page: pageNum, limit: limitNum });
    const enrichedData = result.data.map(inv => ({ ...inv, TYPE: 'REVENUE' }));
    res.json({ success: true, data: enrichedData, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/financials/overdue
 * Get overdue invoices
 */
router.get('/overdue', async (req, res) => {
  try {
    const overdueInvoices = await financialService.getOverdueInvoices();
    res.json({ success: true, data: overdueInvoices });
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overdue invoices' });
  }
});

/**
 * GET /api/financials/:id
 * Get a single invoice by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, invoice_date, due_date, amount, vat_amount, total_amount, status, payment_date, description FROM tenant_invoices WHERE invoice_id = :id',
          { id: parseInt(id, 10) }
        );
        if (result.rows && result.rows.length > 0) {
          return res.json({ success: true, data: rowToInvoice(result.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB get invoice error:', dbErr);
      }
    }

    const invoice = await financialService.getById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /api/financials
 * Create a new invoice
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const n = bodyToInvoiceInsert(body);
    if (!n.tenant_id || !n.property_id || !n.due_date) {
      return res.status(400).json({ success: false, error: 'tenant_id, property_id and due_date are required' });
    }

    if (db.isConfigured && db.isConfigured()) {
      try {
        const conn = await db.getConnection();
        try {
          const dueDate = toOracleDate(n.due_date);
          const billingStart = toOracleDate(n.billing_period_start);
          const billingEnd = toOracleDate(n.billing_period_end);
          const result = await conn.execute(
            `INSERT INTO tenant_invoices (invoice_number, tenant_id, lease_id, property_id, invoice_type, due_date, billing_period_start, billing_period_end, amount, vat_rate, vat_amount, withholding_tax_rate, withholding_tax_amount, total_amount, net_amount_due, status, description)
             VALUES (:invoice_number, :tenant_id, :lease_id, :property_id, :invoice_type, :due_date, :billing_period_start, :billing_period_end, :amount, :vat_rate, :vat_amount, :withholding_tax_rate, :withholding_tax_amount, :total_amount, :net_amount_due, :status, :description)
             RETURNING invoice_id INTO :invoice_id`,
            {
              invoice_number: n.invoice_number,
              tenant_id: n.tenant_id,
              lease_id: n.lease_id,
              property_id: n.property_id,
              invoice_type: n.invoice_type,
              due_date: dueDate,
              billing_period_start: billingStart,
              billing_period_end: billingEnd,
              amount: n.amount,
              vat_rate: n.vat_rate,
              vat_amount: n.vat_amount,
              withholding_tax_rate: n.withholding_tax_rate,
              withholding_tax_amount: n.withholding_tax_amount,
              total_amount: n.total_amount,
              net_amount_due: n.net_amount_due,
              status: n.status,
              description: n.description,
              invoice_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true }
          );
          const newId = Array.isArray(result.outBinds.invoice_id) ? result.outBinds.invoice_id[0] : result.outBinds.invoice_id;
          const getResult = await conn.execute(
            'SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, invoice_date, due_date, amount, vat_amount, total_amount, status, payment_date, description FROM tenant_invoices WHERE invoice_id = :id',
            { id: newId }
          );
          await conn.close();
          if (getResult.rows && getResult.rows.length > 0) {
            return res.status(201).json({ success: true, message: 'Invoice created successfully', data: rowToInvoice(getResult.rows[0]) });
          }
        } finally {
          try { await conn.close(); } catch (_) {}
        }
      } catch (dbErr) {
        console.error('DB create invoice error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error creating invoice' });
      }
    }

    const newInvoice = await financialService.createInvoice(req.body);
    res.status(201).json({ success: true, message: 'Invoice created successfully', data: newInvoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create invoice' });
  }
});

/**
 * POST /api/financials/:id/payment
 * Record a payment for an invoice
 */
router.post('/:id/payment', async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const amountPaid = parseFloat(body.amount_paid ?? body.AMOUNT_PAID ?? body.amount ?? 0) || 0;
    const paymentMethod = body.payment_method || body.PAYMENT_METHOD || 'BANK_TRANSFER';
    const paymentReference = body.payment_reference ?? body.PAYMENT_REFERENCE ?? null;
    const notes = body.notes ?? body.NOTES ?? null;

    if (db.isConfigured && db.isConfigured() && amountPaid > 0) {
      try {
        const invResult = await db.execute(
          'SELECT invoice_id, tenant_id, total_amount, amount_paid, status FROM tenant_invoices WHERE invoice_id = :id',
          { id: invoiceId }
        );
        if (!invResult.rows || invResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        const inv = invResult.rows[0];
        const tenantId = inv.TENANT_ID ?? inv.tenant_id;
        const totalAmount = parseFloat(inv.TOTAL_AMOUNT ?? inv.total_amount ?? 0);
        const prevPaid = parseFloat(inv.AMOUNT_PAID ?? inv.amount_paid ?? 0) || 0;
        const newPaid = prevPaid + amountPaid;
        const balance = Math.max(0, totalAmount - newPaid);
        const newStatus = balance <= 0 ? 'PAID' : 'PARTIAL';

        const conn = await db.getConnection();
        try {
          const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;
          await conn.execute(
            `INSERT INTO payment_receipts (receipt_number, invoice_id, tenant_id, amount_paid, payment_method, payment_reference, notes) VALUES (:receipt_number, :invoice_id, :tenant_id, :amount_paid, :payment_method, :payment_reference, :notes)`,
            { receipt_number: receiptNumber, invoice_id: invoiceId, tenant_id: tenantId, amount_paid: amountPaid, payment_method: paymentMethod, payment_reference: paymentReference, notes },
            { autoCommit: false }
          );
          await conn.execute(
            `UPDATE tenant_invoices SET amount_paid = :amount_paid, balance = :balance, status = :status, payment_date = CASE WHEN :status = 'PAID' THEN SYSDATE ELSE payment_date END, last_updated_date = SYSDATE WHERE invoice_id = :id`,
            { amount_paid: newPaid, balance, status: newStatus, id: invoiceId },
            { autoCommit: false }
          );
          await conn.commit();
          await conn.close();
        } finally {
          try { await conn.close(); } catch (_) {}
        }
        const updated = await db.execute(
          'SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, invoice_date, due_date, amount, vat_amount, total_amount, status, payment_date, description FROM tenant_invoices WHERE invoice_id = :id',
          { id: invoiceId }
        );
        return res.json({ success: true, message: 'Payment recorded successfully', data: updated.rows && updated.rows[0] ? rowToInvoice(updated.rows[0]) : { invoice_id: invoiceId, amount_paid: newPaid, balance, status: newStatus } });
      } catch (dbErr) {
        console.error('DB record payment error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error recording payment' });
      }
    }

    const result = await financialService.recordPayment(req.params.id, req.body);
    res.json({ success: true, message: 'Payment recorded successfully', data: result });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to record payment' });
  }
});

// Legacy endpoints for backward compatibility
router.get('/invoices', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.STATUS = status;

    // Get invoices using service
    const result = await financialService.getAll(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Remaining legacy endpoints - keeping for backward compatibility
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await financialService.getById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const newInvoice = await financialService.createInvoice(req.body);
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create invoice'
    });
  }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (db.isConfigured && db.isConfigured()) {
      try {
        const existing = await db.execute(
          'SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, due_date, amount, vat_amount, total_amount, status, description FROM tenant_invoices WHERE invoice_id = :id',
          { id: parseInt(id, 10) }
        );
        if (!existing.rows || existing.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        const row = existing.rows[0];
        const merged = {
          invoice_number: row.INVOICE_NUMBER ?? row.invoice_number,
          tenant_id: row.TENANT_ID ?? row.tenant_id,
          lease_id: row.LEASE_ID ?? row.lease_id,
          property_id: row.PROPERTY_ID ?? row.property_id,
          due_date: row.DUE_DATE ?? row.due_date,
          amount: row.AMOUNT ?? row.amount,
          status: row.STATUS ?? row.status,
          description: row.DESCRIPTION ?? row.description,
          ...body
        };
        const n = bodyToInvoiceInsert(merged);
        const dueDateVal = toOracleDate(n.due_date);
        if (!dueDateVal) {
          return res.status(400).json({ success: false, error: 'due_date is required' });
        }
        await db.execute(
          `UPDATE tenant_invoices SET tenant_id = :tenant_id, lease_id = :lease_id, property_id = :property_id, due_date = :due_date, amount = :amount, vat_amount = :vat_amount, withholding_tax_amount = :withholding_tax_amount, total_amount = :total_amount, net_amount_due = :net_amount_due, status = :status, description = :description, last_updated_date = SYSDATE WHERE invoice_id = :id`,
          { tenant_id: n.tenant_id, lease_id: n.lease_id, property_id: n.property_id, due_date: dueDateVal, amount: n.amount, vat_amount: n.vat_amount, withholding_tax_amount: n.withholding_tax_amount, total_amount: n.total_amount, net_amount_due: n.net_amount_due, status: n.status, description: n.description, id: parseInt(id, 10) }
        );
        const getResult = await db.execute(
          'SELECT invoice_id, invoice_number, tenant_id, lease_id, property_id, invoice_date, due_date, amount, vat_amount, total_amount, status, payment_date, description FROM tenant_invoices WHERE invoice_id = :id',
          { id: parseInt(id, 10) }
        );
        if (getResult.rows && getResult.rows.length > 0) {
          return res.json({ success: true, message: 'Invoice updated successfully', data: rowToInvoice(getResult.rows[0]) });
        }
      } catch (dbErr) {
        console.error('DB update invoice error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error updating invoice' });
      }
    }

    const updatedInvoice = await financialService.update(id, req.body);
    if (!updatedInvoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice updated successfully', data: updatedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update invoice' });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (db.isConfigured && db.isConfigured()) {
      try {
        // Delete payment_receipts first (FK to tenant_invoices)
        await db.execute('DELETE FROM credit_notes WHERE invoice_id = :id', { id: parseInt(id, 10) });
        await db.execute('DELETE FROM payment_receipts WHERE invoice_id = :id', { id: parseInt(id, 10) });
        const result = await db.execute('DELETE FROM tenant_invoices WHERE invoice_id = :id', { id: parseInt(id, 10) });
        const deleted = result.rowsAffected > 0;
        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Invoice not found' });
        }
        return res.json({ success: true, message: 'Invoice deleted successfully' });
      } catch (dbErr) {
        console.error('DB delete invoice error:', dbErr);
        return res.status(500).json({ success: false, error: dbErr.message || 'Database error deleting invoice' });
      }
    }

    const deleted = await financialService.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
});

module.exports = router;
