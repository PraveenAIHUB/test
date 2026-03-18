const BaseService = require('./BaseService');

/**
 * PropertyService
 * Business logic for Property management
 */
class PropertyService extends BaseService {
  constructor(propertyData, leaseData, spaceData) {
    super(propertyData);
    this.leaseData = leaseData || [];
    this.spaceData = spaceData || [];
  }

  /**
   * Get the ID field name for properties
   */
  getIdField() {
    return 'PROPERTY_ID';
  }

  /**
   * Validate property data
   */
  validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      if (!data.PROPERTY_NAME) errors.push('Property name is required');
      if (!data.PROPERTY_CODE) errors.push('Property code is required');
      if (!data.PROPERTY_TYPE) errors.push('Property type is required');
      if (!data.ADDRESS) errors.push('Address is required');
      if (!data.CITY) errors.push('City is required');
    }

    // Validate property type
    const validTypes = ['COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE'];
    if (data.PROPERTY_TYPE && !validTypes.includes(data.PROPERTY_TYPE)) {
      errors.push(`Property type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'SOLD'];
    if (data.STATUS && !validStatuses.includes(data.STATUS)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate numeric fields
    if (data.TOTAL_AREA && (isNaN(data.TOTAL_AREA) || data.TOTAL_AREA <= 0)) {
      errors.push('Total area must be a positive number');
    }

    if (data.CURRENT_VALUE && (isNaN(data.CURRENT_VALUE) || data.CURRENT_VALUE < 0)) {
      errors.push('Current value must be a non-negative number');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }

  /**
   * Enrich property with related data
   */
  async enrich(property) {
    // Get leases for this property
    const propertyLeases = this.leaseData.filter(l => l.PROPERTY_ID === property.PROPERTY_ID);
    const activeLeases = propertyLeases.filter(l => l.STATUS === 'ACTIVE');

    // Get spaces for this property
    const propertySpaces = this.spaceData.filter(s => s.PROPERTY_ID === property.PROPERTY_ID);
    const occupiedSpaces = propertySpaces.filter(s => s.OCCUPANCY_STATUS === 'OCCUPIED');

    // Calculate occupancy rate
    const occupancyRate = propertySpaces.length > 0
      ? (occupiedSpaces.length / propertySpaces.length * 100).toFixed(1)
      : 0;

    // Calculate monthly revenue from active leases
    const monthlyRevenue = activeLeases.reduce((sum, lease) => {
      const baseRent = lease.BASE_RENT || lease.MONTHLY_RENT || 0;
      const camCharges = lease.CAM_CHARGES || 0;
      const serviceCharge = lease.SERVICE_CHARGE || 0;
      const parkingFee = lease.PARKING_FEE || 0;
      return sum + baseRent + camCharges + serviceCharge + parkingFee;
    }, 0);

    return {
      ...property,
      LEASE_COUNT: propertyLeases.length,
      ACTIVE_LEASE_COUNT: activeLeases.length,
      SPACE_COUNT: propertySpaces.length,
      OCCUPIED_SPACE_COUNT: occupiedSpaces.length,
      OCCUPANCY_RATE: parseFloat(occupancyRate),
      MONTHLY_REVENUE: monthlyRevenue
    };
  }

  /**
   * Get statistics for properties
   */
  async getStatistics() {
    const properties = this.dataSource;

    const total = properties.length;
    const active = properties.filter(p => p.STATUS === 'ACTIVE').length;
    const inactive = properties.filter(p => p.STATUS === 'INACTIVE').length;
    const underConstruction = properties.filter(p => p.STATUS === 'UNDER_CONSTRUCTION').length;

    // Calculate total value
    const totalValue = properties.reduce((sum, p) => sum + (p.CURRENT_VALUE || 0), 0);

    // Calculate average occupancy
    const enrichedProperties = await this.enrichMany(properties);
    const avgOccupancy = enrichedProperties.length > 0
      ? enrichedProperties.reduce((sum, p) => sum + (p.OCCUPANCY_RATE || 0), 0) / enrichedProperties.length
      : 0;

    // Properties by type
    const byType = properties.reduce((acc, p) => {
      const type = p.PROPERTY_TYPE || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0 };
      }
      acc[type].count++;
      acc[type].value += p.CURRENT_VALUE || 0;
      return acc;
    }, {});

    // Properties by location
    const byLocation = properties.reduce((acc, p) => {
      const location = p.CITY || 'UNKNOWN';
      if (!acc[location]) {
        acc[location] = { count: 0, value: 0 };
      }
      acc[location].count++;
      acc[location].value += p.CURRENT_VALUE || 0;
      return acc;
    }, {});

    // Calculate total monthly revenue
    const totalMonthlyRevenue = enrichedProperties.reduce((sum, p) => sum + (p.MONTHLY_REVENUE || 0), 0);

    return {
      total,
      active,
      inactive,
      underConstruction,
      totalValue,
      avgOccupancy: parseFloat(avgOccupancy.toFixed(1)),
      totalMonthlyRevenue,
      byType,
      byLocation
    };
  }
}

module.exports = PropertyService;

