/**
 * FinancialService - Business logic for Financial management
 * Handles invoices, payments, receipts, GL mapping, WHT calculations
 */

const BaseService = require('./BaseService');

class FinancialService extends BaseService {
  constructor(invoiceData, tenantData, leaseData, propertyData, paymentReceiptsData = []) {
    super(invoiceData);
    this.tenantData = tenantData;
    this.leaseData = leaseData;
    this.propertyData = propertyData;
    this.paymentReceiptsData = paymentReceiptsData;
  }

  getIdField() {
    return 'INVOICE_ID';
  }

  /**
   * Validate invoice data
   */
  validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (!isUpdate) {
      if (!data.TENANT_ID) throw new Error('Tenant ID is required');
      if (!data.INVOICE_DATE) throw new Error('Invoice date is required');
      if (!data.DUE_DATE) throw new Error('Due date is required');
      if (!data.AMOUNT) throw new Error('Amount is required');
    }

    // Validate amounts
    if (data.AMOUNT && data.AMOUNT < 0) {
      throw new Error('Amount must be positive');
    }
  }

  /**
   * Enrich invoice with tenant, lease, and property data
   */
  async enrich(invoice) {
    const tenant = this.tenantData.find(t => t.TENANT_ID === invoice.TENANT_ID);
    const lease = this.leaseData.find(l => l.LEASE_ID === invoice.LEASE_ID);
    const property = this.propertyData.find(p => p.PROPERTY_ID === invoice.PROPERTY_ID);

    // Calculate payment status
    const daysOverdue = this.calculateDaysOverdue(invoice);
    const collectionStatus = this.getCollectionStatus(daysOverdue, invoice.STATUS);

    // Get payment receipts for this invoice
    const payments = this.paymentReceiptsData.filter(p => p.INVOICE_ID === invoice.INVOICE_ID);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.AMOUNT_PAID || 0), 0);

    return {
      ...invoice,
      TENANT_NAME: tenant?.TENANT_NAME,
      TENANT_CODE: tenant?.TENANT_CODE,
      TENANT_EMAIL: tenant?.EMAIL,
      TENANT_PHONE: tenant?.PHONE,
      LEASE_NUMBER: lease?.LEASE_NUMBER,
      PROPERTY_NAME: property?.PROPERTY_NAME,
      PROPERTY_CODE: property?.PROPERTY_CODE,
      DAYS_OVERDUE: daysOverdue,
      COLLECTION_STATUS: collectionStatus,
      TOTAL_PAID: totalPaid.toFixed(2),
      BALANCE: (parseFloat(invoice.TOTAL_AMOUNT || 0) - totalPaid).toFixed(2),
      PAYMENT_COUNT: payments.length
    };
  }

  /**
   * Calculate days overdue
   */
  calculateDaysOverdue(invoice) {
    if (invoice.STATUS === 'PAID') return 0;
    
    const today = new Date();
    const dueDate = new Date(invoice.DUE_DATE);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get collection status based on days overdue
   */
  getCollectionStatus(daysOverdue, status) {
    if (status === 'PAID') return 'CURRENT';
    if (daysOverdue === 0) return 'CURRENT';
    if (daysOverdue <= 30) return '1-30 DAYS';
    if (daysOverdue <= 60) return '31-60 DAYS';
    if (daysOverdue <= 90) return '61-90 DAYS';
    return '90+ DAYS';
  }

  /**
   * Calculate withholding tax (Kenya WHT on rent)
   */
  calculateWithholdingTax(amount, whtRate = 10) {
    return (amount * whtRate / 100).toFixed(2);
  }

  /**
   * Calculate VAT (Kenya VAT at 16%)
   */
  calculateVAT(amount, vatRate = 16) {
    return (amount * vatRate / 100).toFixed(2);
  }

  /**
   * Create invoice with all calculations
   */
  async createInvoice(data) {
    // Calculate tax amounts
    const amount = parseFloat(data.AMOUNT);
    const vatRate = data.VAT_RATE || 16;
    const whtRate = data.WITHHOLDING_TAX_RATE || 10;

    const vatAmount = this.calculateVAT(amount, vatRate);
    const whtAmount = this.calculateWithholdingTax(amount, whtRate);
    const totalAmount = amount + parseFloat(vatAmount);
    const netAmountDue = totalAmount - parseFloat(whtAmount);

    const invoiceData = {
      ...data,
      VAT_AMOUNT: vatAmount,
      VAT_RATE: vatRate,
      WITHHOLDING_TAX_AMOUNT: whtAmount,
      WITHHOLDING_TAX_RATE: whtRate,
      TOTAL_AMOUNT: totalAmount.toFixed(2),
      NET_AMOUNT_DUE: netAmountDue.toFixed(2),
      STATUS: 'PENDING',
      INVOICE_NUMBER: this.generateInvoiceNumber()
    };

    return this.create(invoiceData);
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = this.dataSource.length + 1;
    return `INV-${year}${month}-${String(count).padStart(5, '0')}`;
  }

  /**
   * Get invoice statistics
   */
  async getStatistics() {
    const total = this.dataSource.length;
    const paid = this.dataSource.filter(i => i.STATUS === 'PAID').length;
    const pending = this.dataSource.filter(i => i.STATUS === 'PENDING').length;
    const overdue = this.dataSource.filter(i => {
      return i.STATUS !== 'PAID' && this.calculateDaysOverdue(i) > 0;
    }).length;

    // Calculate amounts
    const totalAmount = this.dataSource.reduce((sum, inv) => 
      sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);
    
    const paidAmount = this.dataSource
      .filter(i => i.STATUS === 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);
    
    const pendingAmount = this.dataSource
      .filter(i => i.STATUS === 'PENDING')
      .reduce((sum, inv) => sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);

    const overdueAmount = this.dataSource
      .filter(i => i.STATUS !== 'PAID' && this.calculateDaysOverdue(i) > 0)
      .reduce((sum, inv) => sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);

    // Collection aging
    const aging = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    this.dataSource.forEach(invoice => {
      if (invoice.STATUS === 'PAID') return;

      const daysOverdue = this.calculateDaysOverdue(invoice);
      const amount = parseFloat(invoice.TOTAL_AMOUNT || 0);

      if (daysOverdue === 0) aging.current += amount;
      else if (daysOverdue <= 30) aging['1-30'] += amount;
      else if (daysOverdue <= 60) aging['31-60'] += amount;
      else if (daysOverdue <= 90) aging['61-90'] += amount;
      else aging['90+'] += amount;
    });

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = this.getMonthlyRevenueTrend(6);

    return {
      total,
      paid,
      pending,
      overdue,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2),
      collectionRate: total > 0 ? ((paid / total) * 100).toFixed(2) : 0,
      aging: {
        current: aging.current.toFixed(2),
        '1-30': aging['1-30'].toFixed(2),
        '31-60': aging['31-60'].toFixed(2),
        '61-90': aging['61-90'].toFixed(2),
        '90+': aging['90+'].toFixed(2)
      },
      monthlyRevenue
    };
  }

  /**
   * Get monthly revenue trend
   */
  getMonthlyRevenueTrend(months = 6) {
    const trend = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = month.toISOString().substring(0, 7); // YYYY-MM

      const monthlyInvoices = this.dataSource.filter(inv => {
        const invDate = inv.INVOICE_DATE.substring(0, 7);
        return invDate === monthStr;
      });

      const revenue = monthlyInvoices.reduce((sum, inv) =>
        sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);

      const paid = monthlyInvoices
        .filter(i => i.STATUS === 'PAID')
        .reduce((sum, inv) => sum + parseFloat(inv.TOTAL_AMOUNT || 0), 0);

      trend.push({
        month: monthStr,
        invoiced: revenue.toFixed(2),
        collected: paid.toFixed(2),
        count: monthlyInvoices.length
      });
    }

    return trend;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices() {
    const overdueInvoices = this.dataSource.filter(invoice => {
      return invoice.STATUS !== 'PAID' && this.calculateDaysOverdue(invoice) > 0;
    });

    return this.enrichMany(overdueInvoices);
  }

  /**
   * Get invoices by tenant
   */
  async getByTenant(tenantId) {
    const invoices = this.dataSource.filter(i => i.TENANT_ID === parseInt(tenantId));
    return this.enrichMany(invoices);
  }

  /**
   * Get invoices by property
   */
  async getByProperty(propertyId) {
    const invoices = this.dataSource.filter(i => i.PROPERTY_ID === parseInt(propertyId));
    return this.enrichMany(invoices);
  }

  /**
   * Record payment receipt
   */
  async recordPayment(invoiceId, paymentData) {
    const invoice = await this.getById(invoiceId);

    const receipt = {
      RECEIPT_ID: this.paymentReceiptsData.length + 1,
      RECEIPT_NUMBER: this.generateReceiptNumber(),
      INVOICE_ID: invoiceId,
      TENANT_ID: invoice.TENANT_ID,
      PAYMENT_DATE: paymentData.PAYMENT_DATE || new Date().toISOString().split('T')[0],
      AMOUNT_PAID: paymentData.AMOUNT_PAID,
      PAYMENT_METHOD: paymentData.PAYMENT_METHOD || 'BANK_TRANSFER',
      PAYMENT_REFERENCE: paymentData.PAYMENT_REFERENCE,
      BANK_NAME: paymentData.BANK_NAME,
      PROCESSED_BY: 'SYSTEM',
      NOTES: paymentData.NOTES,
      CREATED_DATE: new Date().toISOString()
    };

    this.paymentReceiptsData.push(receipt);

    // Update invoice status if fully paid
    const totalPaid = this.paymentReceiptsData
      .filter(p => p.INVOICE_ID === invoiceId)
      .reduce((sum, p) => sum + parseFloat(p.AMOUNT_PAID || 0), 0);

    if (totalPaid >= parseFloat(invoice.TOTAL_AMOUNT)) {
      await this.update(invoiceId, {
        STATUS: 'PAID',
        PAYMENT_DATE: paymentData.PAYMENT_DATE || new Date().toISOString().split('T')[0]
      });
    } else if (totalPaid > 0) {
      await this.update(invoiceId, {
        STATUS: 'PARTIAL'
      });
    }

    return receipt;
  }

  /**
   * Generate receipt number
   */
  generateReceiptNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = this.paymentReceiptsData.length + 1;
    return `RCP-${year}${month}-${String(count).padStart(5, '0')}`;
  }
}

module.exports = FinancialService;

