/**
 * LeaseService - Business logic for Lease management
 * Handles lease operations, CAM charges, escalations, amendments
 */

const BaseService = require('./BaseService');

class LeaseService extends BaseService {
  constructor(leaseData, propertyData, tenantData, spaceData) {
    super(leaseData);
    this.propertyData = propertyData;
    this.tenantData = tenantData;
    this.spaceData = spaceData;
  }

  getIdField() {
    return 'LEASE_ID';
  }

  /**
   * Validate lease data
   */
  validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (!isUpdate) {
      if (!data.PROPERTY_ID) throw new Error('Property ID is required');
      if (!data.TENANT_ID) throw new Error('Tenant ID is required');
      if (!data.START_DATE) throw new Error('Start date is required');
      if (!data.END_DATE) throw new Error('End date is required');
      if (!data.BASE_RENT) throw new Error('Base rent is required');
    }

    // Validate dates
    if (data.START_DATE && data.END_DATE) {
      const startDate = new Date(data.START_DATE);
      const endDate = new Date(data.END_DATE);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Validate amounts
    if (data.BASE_RENT && data.BASE_RENT < 0) {
      throw new Error('Base rent must be positive');
    }
    if (data.CAM_CHARGES && data.CAM_CHARGES < 0) {
      throw new Error('CAM charges must be positive');
    }
  }

  /**
   * Enrich lease with property, tenant, and space data
   */
  async enrich(lease) {
    const property = this.propertyData.find(p => p.PROPERTY_ID === lease.PROPERTY_ID);
    const tenant = this.tenantData.find(t => t.TENANT_ID === lease.TENANT_ID);
    const space = this.spaceData.find(s => s.SPACE_ID === lease.SPACE_ID);

    return {
      ...lease,
      PROPERTY_NAME: property?.PROPERTY_NAME,
      PROPERTY_CODE: property?.PROPERTY_CODE,
      PROPERTY_CITY: property?.CITY,
      TENANT_NAME: tenant?.TENANT_NAME,
      TENANT_CODE: tenant?.TENANT_CODE,
      TENANT_CONTACT: tenant?.EMAIL,
      SPACE_CODE: space?.SPACE_CODE,
      SPACE_AREA: space?.AREA,
      SPACE_FLOOR: space?.FLOOR,
      // Calculate total monthly rent
      TOTAL_MONTHLY_RENT: this.calculateTotalRent(lease),
      // Calculate rent per sqm
      RENT_PER_SQM: space?.AREA ? (this.calculateTotalRent(lease) / space.AREA).toFixed(2) : 0,
      // Calculate days until expiry
      DAYS_UNTIL_EXPIRY: this.calculateDaysUntilExpiry(lease.END_DATE),
      // Calculate lease duration
      LEASE_DURATION_MONTHS: this.calculateLeaseDuration(lease.START_DATE, lease.END_DATE)
    };
  }

  /**
   * Calculate total monthly rent including all charges
   */
  calculateTotalRent(lease) {
    const baseRent = parseFloat(lease.BASE_RENT || lease.MONTHLY_RENT || 0);
    const camCharges = parseFloat(lease.CAM_CHARGES || 0);
    const serviceCharge = parseFloat(lease.SERVICE_CHARGE || 0);
    const parkingFee = parseFloat(lease.PARKING_FEE || 0);
    
    return baseRent + camCharges + serviceCharge + parkingFee;
  }

  /**
   * Calculate days until lease expiry
   */
  calculateDaysUntilExpiry(endDate) {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calculate lease duration in months
   */
  calculateLeaseDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return months;
  }

  /**
   * Get lease statistics
   */
  async getStatistics() {
    const total = this.dataSource.length;
    const active = this.dataSource.filter(l => l.STATUS === 'ACTIVE').length;
    const expiring = this.dataSource.filter(l => {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(l.END_DATE);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
    }).length;
    const expired = this.dataSource.filter(l => {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(l.END_DATE);
      return daysUntilExpiry < 0;
    }).length;

    // Calculate total monthly revenue
    const totalMonthlyRevenue = this.dataSource
      .filter(l => l.STATUS === 'ACTIVE')
      .reduce((sum, lease) => sum + this.calculateTotalRent(lease), 0);

    // Calculate average rent
    const avgRent = active > 0 ? totalMonthlyRevenue / active : 0;

    // Group by lease type
    const byType = this.dataSource.reduce((acc, lease) => {
      const type = lease.LEASE_TYPE || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate revenue by type
    const revenueByType = this.dataSource
      .filter(l => l.STATUS === 'ACTIVE')
      .reduce((acc, lease) => {
        const type = lease.LEASE_TYPE || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + this.calculateTotalRent(lease);
        return acc;
      }, {});

    return {
      total,
      active,
      expiring,
      expired,
      totalMonthlyRevenue: totalMonthlyRevenue.toFixed(2),
      avgRent: avgRent.toFixed(2),
      byType,
      revenueByType
    };
  }

  /**
   * Get expiring leases (within specified days)
   */
  async getExpiringLeases(days = 90) {
    const expiringLeases = this.dataSource.filter(lease => {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(lease.END_DATE);
      return daysUntilExpiry > 0 && daysUntilExpiry <= days;
    });

    return this.enrichMany(expiringLeases);
  }

  /**
   * Calculate next escalation date and amount
   */
  calculateNextEscalation(lease) {
    if (!lease.ESCALATION_RATE || !lease.ESCALATION_FREQUENCY) {
      return null;
    }

    const startDate = new Date(lease.RENT_COMMENCEMENT_DATE || lease.START_DATE);
    const today = new Date();
    const frequency = lease.ESCALATION_FREQUENCY || 'ANNUAL';

    let monthsToAdd = 12; // Default annual
    if (frequency === 'BIENNIAL') monthsToAdd = 24;
    if (frequency === 'QUARTERLY') monthsToAdd = 3;

    let nextEscalationDate = new Date(startDate);
    while (nextEscalationDate <= today) {
      nextEscalationDate.setMonth(nextEscalationDate.getMonth() + monthsToAdd);
    }

    const currentRent = this.calculateTotalRent(lease);
    const escalationRate = parseFloat(lease.ESCALATION_RATE) / 100;
    const newRent = currentRent * (1 + escalationRate);

    return {
      nextEscalationDate: nextEscalationDate.toISOString().split('T')[0],
      currentRent: currentRent.toFixed(2),
      newRent: newRent.toFixed(2),
      increase: (newRent - currentRent).toFixed(2),
      increasePercentage: lease.ESCALATION_RATE
    };
  }

  /**
   * Get leases by property
   */
  async getByProperty(propertyId) {
    const leases = this.dataSource.filter(l => l.PROPERTY_ID === parseInt(propertyId));
    return this.enrichMany(leases);
  }

  /**
   * Get leases by tenant
   */
  async getByTenant(tenantId) {
    const leases = this.dataSource.filter(l => l.TENANT_ID === parseInt(tenantId));
    return this.enrichMany(leases);
  }

  /**
   * Get lease revenue timeline
   */
  async getRevenueTimeline() {
    const timeline = this.dataSource
      .filter(l => l.STATUS === 'ACTIVE')
      .map(lease => {
        const property = this.propertyData.find(p => p.PROPERTY_ID === lease.PROPERTY_ID);
        return {
          LEASE_ID: lease.LEASE_ID,
          LEASE_NUMBER: lease.LEASE_NUMBER,
          PROPERTY_NAME: property?.PROPERTY_NAME,
          TENANT_NAME: this.tenantData.find(t => t.TENANT_ID === lease.TENANT_ID)?.TENANT_NAME,
          START_DATE: lease.START_DATE,
          END_DATE: lease.END_DATE,
          MONTHLY_REVENUE: this.calculateTotalRent(lease),
          TOTAL_REVENUE: this.calculateTotalRent(lease) * this.calculateLeaseDuration(lease.START_DATE, lease.END_DATE)
        };
      })
      .sort((a, b) => new Date(a.END_DATE) - new Date(b.END_DATE));

    return timeline;
  }
}

module.exports = LeaseService;

