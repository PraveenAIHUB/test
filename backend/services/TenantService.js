const BaseService = require('./BaseService');

/**
 * TenantService
 * Business logic for Tenant management
 */
class TenantService extends BaseService {
  constructor(tenantData, leaseData, invoiceData) {
    super(tenantData);
    this.leaseData = leaseData || [];
    this.invoiceData = invoiceData || [];
  }

  /**
   * Get the ID field name for tenants
   */
  getIdField() {
    return 'TENANT_ID';
  }

  /**
   * Validate tenant data (accepts both UPPERCASE and snake_case from frontend).
   * Normalizes input so TENANT_NAME, EMAIL, etc. are set from tenant_name, email, etc. before checks.
   */
  validate(data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
      throw new Error('Tenant data is required');
    }
    const d = data;
    const str = (v) => (v != null && v !== undefined) ? String(v).trim() : '';
    d.TENANT_NAME = str(d.TENANT_NAME ?? d.tenant_name);
    d.TENANT_CODE = d.TENANT_CODE ?? d.tenant_code ?? (isUpdate ? undefined : `TEN-${Date.now().toString(36).toUpperCase()}`);
    d.TENANT_TYPE = d.TENANT_TYPE ?? d.tenant_type ?? 'CORPORATE';
    d.EMAIL = str(d.EMAIL ?? d.email ?? d.contact_email);
    d.PHONE = str(d.PHONE ?? d.phone ?? d.contact_phone);
    d.CONTACT_PERSON = str(d.CONTACT_PERSON ?? d.contact_person);
    d.STATUS = d.STATUS ?? d.status ?? 'ACTIVE';

    const errors = [];
    const name = d.TENANT_NAME;
    const code = d.TENANT_CODE;
    const type = d.TENANT_TYPE;
    const email = d.EMAIL;
    const phone = d.PHONE;

    if (!isUpdate) {
      if (!name) errors.push('Tenant name is required');
      if (!code) errors.push('Tenant code is required');
      if (!type) errors.push('Tenant type is required');
      if (!email) errors.push('Email is required');
      if (!phone) errors.push('Phone is required');
    }

    const validTypes = ['CORPORATE', 'INDIVIDUAL', 'GOVERNMENT', 'NGO'];
    if (type && !validTypes.includes(type)) {
      errors.push(`Tenant type must be one of: ${validTypes.join(', ')}`);
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'];
    const status = d.STATUS;
    if (status && !validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }

  /**
   * Enrich tenant with related data
   */
  async enrich(tenant) {
    // Get leases for this tenant
    const tenantLeases = this.leaseData.filter(l => l.TENANT_ID === tenant.TENANT_ID);
    const activeLeases = tenantLeases.filter(l => l.STATUS === 'ACTIVE');

    // Calculate monthly revenue from active leases
    const monthlyRevenue = activeLeases.reduce((sum, lease) => {
      const baseRent = lease.BASE_RENT || lease.MONTHLY_RENT || 0;
      const camCharges = lease.CAM_CHARGES || 0;
      const serviceCharge = lease.SERVICE_CHARGE || 0;
      const parkingFee = lease.PARKING_FEE || 0;
      return sum + baseRent + camCharges + serviceCharge + parkingFee;
    }, 0);

    // Get invoices for this tenant
    const tenantInvoices = this.invoiceData.filter(i => i.TENANT_ID === tenant.TENANT_ID);
    const paidInvoices = tenantInvoices.filter(i => i.STATUS === 'PAID');
    const pendingInvoices = tenantInvoices.filter(i => i.STATUS === 'PENDING');
    const overdueInvoices = tenantInvoices.filter(i => i.STATUS === 'OVERDUE');

    // Calculate payment rate
    const paymentRate = tenantInvoices.length > 0
      ? (paidInvoices.length / tenantInvoices.length * 100).toFixed(1)
      : 100;

    // Calculate outstanding balance
    const outstandingBalance = pendingInvoices.reduce((sum, i) => sum + (i.TOTAL_AMOUNT || 0), 0) +
                               overdueInvoices.reduce((sum, i) => sum + (i.TOTAL_AMOUNT || 0), 0);

    // Calculate tenure (days since first lease start date)
    let tenureDays = 0;
    if (tenantLeases.length > 0) {
      const earliestLease = tenantLeases.reduce((earliest, lease) => {
        const leaseStart = new Date(lease.START_DATE);
        const earliestStart = new Date(earliest.START_DATE);
        return leaseStart < earliestStart ? lease : earliest;
      });
      const startDate = new Date(earliestLease.START_DATE);
      const today = new Date();
      tenureDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    }

    return {
      ...tenant,
      LEASE_COUNT: tenantLeases.length,
      ACTIVE_LEASE_COUNT: activeLeases.length,
      MONTHLY_REVENUE: monthlyRevenue,
      INVOICE_COUNT: tenantInvoices.length,
      PAID_INVOICE_COUNT: paidInvoices.length,
      PENDING_INVOICE_COUNT: pendingInvoices.length,
      OVERDUE_INVOICE_COUNT: overdueInvoices.length,
      PAYMENT_RATE: parseFloat(paymentRate),
      OUTSTANDING_BALANCE: outstandingBalance,
      TENURE_DAYS: tenureDays
    };
  }

  /**
   * Get statistics for tenants
   */
  async getStatistics() {
    const tenants = this.dataSource;

    const total = tenants.length;
    const active = tenants.filter(t => t.STATUS === 'ACTIVE').length;
    const inactive = tenants.filter(t => t.STATUS === 'INACTIVE').length;
    const suspended = tenants.filter(t => t.STATUS === 'SUSPENDED').length;

    // Tenants by type
    const byType = tenants.reduce((acc, t) => {
      const type = t.TENANT_TYPE || 'UNKNOWN';
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});

    // Enrich tenants for additional stats
    const enrichedTenants = await this.enrichMany(tenants);

    // Calculate average tenure
    const avgTenure = enrichedTenants.length > 0
      ? enrichedTenants.reduce((sum, t) => sum + (t.TENURE_DAYS || 0), 0) / enrichedTenants.length
      : 0;

    // Calculate average payment rate
    const avgPaymentRate = enrichedTenants.length > 0
      ? enrichedTenants.reduce((sum, t) => sum + (t.PAYMENT_RATE || 0), 0) / enrichedTenants.length
      : 0;

    // Calculate total monthly revenue
    const totalMonthlyRevenue = enrichedTenants.reduce((sum, t) => sum + (t.MONTHLY_REVENUE || 0), 0);

    return {
      total,
      active,
      inactive,
      suspended,
      byType,
      avgTenure: Math.round(avgTenure),
      avgPaymentRate: parseFloat(avgPaymentRate.toFixed(1)),
      totalMonthlyRevenue
    };
  }
}

module.exports = TenantService;

