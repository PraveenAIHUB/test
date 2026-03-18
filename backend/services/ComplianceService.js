/**
 * ComplianceService - Business logic for Compliance management
 * Handles Kenya-specific compliance types (NEMA, County, DOSH, Fire, KRA)
 */

const BaseService = require('./BaseService');

class ComplianceService extends BaseService {
  constructor(complianceData, propertyData) {
    super(complianceData);
    this.propertyData = propertyData;
  }

  getIdField() {
    return 'COMPLIANCE_ID';
  }

  /**
   * Kenya-specific compliance types
   */
  static KENYA_COMPLIANCE_TYPES = {
    // NEMA (National Environment Management Authority)
    NEMA: [
      { code: 'NEMA_EIA', name: 'Environmental Impact Assessment', authority: 'NEMA', frequency: 'ONE_TIME' },
      { code: 'NEMA_AUDIT', name: 'Environmental Audit', authority: 'NEMA', frequency: 'ANNUAL' },
      { code: 'NEMA_WASTE_LICENSE', name: 'Waste Management License', authority: 'NEMA', frequency: 'ANNUAL' },
      { code: 'NEMA_EFFLUENT', name: 'Effluent Discharge License', authority: 'NEMA', frequency: 'ANNUAL' },
      { code: 'NEMA_NOISE', name: 'Noise Pollution Permit', authority: 'NEMA', frequency: 'ANNUAL' }
    ],
    
    // County Government
    COUNTY: [
      { code: 'COUNTY_BUILDING_APPROVAL', name: 'Building Plan Approval', authority: 'County Government', frequency: 'ONE_TIME' },
      { code: 'COUNTY_OCCUPANCY', name: 'Occupancy Certificate', authority: 'County Government', frequency: 'ONE_TIME' },
      { code: 'COUNTY_CHANGE_USER', name: 'Change of User Permit', authority: 'County Government', frequency: 'ONE_TIME' },
      { code: 'COUNTY_SBP', name: 'Single Business Permit', authority: 'County Government', frequency: 'ANNUAL' },
      { code: 'COUNTY_FOOD_HANDLING', name: 'Food Handling License', authority: 'County Health', frequency: 'ANNUAL' },
      { code: 'COUNTY_LIQUOR', name: 'Liquor License', authority: 'County Government', frequency: 'ANNUAL' },
      { code: 'COUNTY_SIGNAGE', name: 'Signage Permit', authority: 'County Government', frequency: 'ANNUAL' },
      { code: 'COUNTY_LAND_RATES', name: 'Land Rates Payment', authority: 'County Government', frequency: 'ANNUAL' },
      { code: 'COUNTY_PARKING', name: 'Parking Bay License', authority: 'County Government', frequency: 'ANNUAL' },
      { code: 'COUNTY_OUTDOOR_ADVERTISING', name: 'Outdoor Advertising Permit', authority: 'County Government', frequency: 'ANNUAL' }
    ],
    
    // Fire Department
    FIRE: [
      { code: 'FIRE_CERTIFICATE', name: 'Fire Safety Certificate', authority: 'County Fire Department', frequency: 'ANNUAL' },
      { code: 'FIRE_DRILL', name: 'Fire Drill Record', authority: 'County Fire Department', frequency: 'QUARTERLY' },
      { code: 'FIRE_EQUIPMENT', name: 'Fire Equipment Inspection', authority: 'County Fire Department', frequency: 'SEMI_ANNUAL' },
      { code: 'FIRE_HYDRANT', name: 'Fire Hydrant Testing', authority: 'County Fire Department', frequency: 'ANNUAL' },
      { code: 'FIRE_ALARM', name: 'Fire Alarm System Inspection', authority: 'County Fire Department', frequency: 'ANNUAL' }
    ],
    
    // DOSH (Directorate of Occupational Safety & Health)
    DOSH: [
      { code: 'DOSH_AUDIT', name: 'Occupational Health & Safety Audit', authority: 'DOSH', frequency: 'ANNUAL' },
      { code: 'DOSH_ELEVATOR', name: 'Elevator/Lift Inspection Certificate', authority: 'DOSH', frequency: 'ANNUAL' },
      { code: 'DOSH_BOILER', name: 'Boiler/Pressure Vessel Inspection', authority: 'DOSH', frequency: 'ANNUAL' },
      { code: 'DOSH_FACTORY', name: 'Factory Registration', authority: 'DOSH', frequency: 'ONE_TIME' },
      { code: 'DOSH_CRANE', name: 'Crane Inspection Certificate', authority: 'DOSH', frequency: 'ANNUAL' },
      { code: 'DOSH_FIRST_AID', name: 'First Aid Equipment Inspection', authority: 'DOSH', frequency: 'ANNUAL' }
    ],
    
    // Water & Sanitation
    WATER: [
      { code: 'WATER_QUALITY', name: 'Water Quality Testing', authority: 'Water Service Provider', frequency: 'QUARTERLY' },
      { code: 'WATER_SEWERAGE', name: 'Sewerage Connection Permit', authority: 'Water Service Provider', frequency: 'ONE_TIME' },
      { code: 'WATER_BOREHOLE', name: 'Borehole Permit', authority: 'WARMA', frequency: 'ANNUAL' },
      { code: 'WATER_DISCHARGE', name: 'Wastewater Discharge Permit', authority: 'WARMA', frequency: 'ANNUAL' }
    ],
    
    // Energy & Electrical
    ENERGY: [
      { code: 'ENERGY_ELECTRICAL_CERT', name: 'Electrical Installation Certificate', authority: 'Electrical Engineer', frequency: 'ONE_TIME' },
      { code: 'ENERGY_AUDIT', name: 'Energy Audit Report', authority: 'Energy Auditor', frequency: 'BIENNIAL' },
      { code: 'ENERGY_GENERATOR_NOISE', name: 'Generator Noise Permit', authority: 'NEMA', frequency: 'ANNUAL' },
      { code: 'ENERGY_SOLAR', name: 'Solar Installation Approval', authority: 'EPRA', frequency: 'ONE_TIME' },
      { code: 'ENERGY_TRANSFORMER', name: 'Transformer Inspection', authority: 'KPLC', frequency: 'ANNUAL' }
    ],
    
    // KRA (Kenya Revenue Authority)
    KRA: [
      { code: 'KRA_VAT', name: 'VAT Registration & Compliance', authority: 'KRA', frequency: 'MONTHLY' },
      { code: 'KRA_WHT', name: 'Withholding Tax Compliance', authority: 'KRA', frequency: 'MONTHLY' },
      { code: 'KRA_PAYE', name: 'PAYE Compliance', authority: 'KRA', frequency: 'MONTHLY' },
      { code: 'KRA_RENTAL_INCOME', name: 'Rental Income Tax', authority: 'KRA', frequency: 'MONTHLY' },
      { code: 'KRA_CORPORATE_TAX', name: 'Corporate Tax Filing', authority: 'KRA', frequency: 'ANNUAL' },
      { code: 'KRA_TAX_COMPLIANCE', name: 'Tax Compliance Certificate', authority: 'KRA', frequency: 'ANNUAL' }
    ],
    
    // Public Health
    HEALTH: [
      { code: 'HEALTH_INSPECTION', name: 'Public Health Inspection', authority: 'County Health', frequency: 'ANNUAL' },
      { code: 'HEALTH_PEST_CONTROL', name: 'Pest Control Certificate', authority: 'Pest Control Company', frequency: 'QUARTERLY' },
      { code: 'HEALTH_WATER_TANK', name: 'Water Tank Cleaning Certificate', authority: 'Licensed Cleaner', frequency: 'SEMI_ANNUAL' },
      { code: 'HEALTH_FUMIGATION', name: 'Fumigation Certificate', authority: 'Pest Control Company', frequency: 'QUARTERLY' }
    ],
    
    // Insurance & Legal
    INSURANCE: [
      { code: 'INS_PROPERTY', name: 'Property Insurance', authority: 'Insurance Company', frequency: 'ANNUAL' },
      { code: 'INS_LIABILITY', name: 'Public Liability Insurance', authority: 'Insurance Company', frequency: 'ANNUAL' },
      { code: 'INS_WORKMEN', name: 'Workmen Compensation Insurance', authority: 'Insurance Company', frequency: 'ANNUAL' },
      { code: 'INS_FIRE', name: 'Fire Insurance', authority: 'Insurance Company', frequency: 'ANNUAL' }
    ],
    
    // Security
    SECURITY: [
      { code: 'SEC_GUARD_LICENSE', name: 'Security Guard Licensing', authority: 'PSRA', frequency: 'ANNUAL' },
      { code: 'SEC_CCTV_APPROVAL', name: 'CCTV Installation Approval', authority: 'County Government', frequency: 'ONE_TIME' },
      { code: 'SEC_ACCESS_CONTROL', name: 'Access Control System Approval', authority: 'County Government', frequency: 'ONE_TIME' }
    ]
  };

  /**
   * Get all Kenya compliance types
   */
  static getAllComplianceTypes() {
    const allTypes = [];
    Object.keys(ComplianceService.KENYA_COMPLIANCE_TYPES).forEach(category => {
      ComplianceService.KENYA_COMPLIANCE_TYPES[category].forEach(type => {
        allTypes.push({
          ...type,
          category
        });
      });
    });
    return allTypes;
  }

  /**
   * Get compliance types by category
   */
  static getComplianceTypesByCategory(category) {
    return ComplianceService.KENYA_COMPLIANCE_TYPES[category] || [];
  }

  /**
   * Validate compliance data
   */
  validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (!isUpdate) {
      if (!data.COMPLIANCE_TYPE) throw new Error('Compliance type is required');
      if (!data.PROPERTY_ID) throw new Error('Property ID is required');
      if (!data.DUE_DATE) throw new Error('Due date is required');
    }
  }

  /**
   * Enrich compliance with property data
   */
  async enrich(compliance) {
    const property = this.propertyData.find(p => p.PROPERTY_ID === compliance.PROPERTY_ID);
    
    // Calculate days until due
    const daysUntilDue = this.calculateDaysUntilDue(compliance.DUE_DATE);
    
    // Determine risk level based on days until due
    const riskLevel = this.calculateRiskLevel(daysUntilDue, compliance.STATUS);

    return {
      ...compliance,
      PROPERTY_NAME: property?.PROPERTY_NAME,
      PROPERTY_CODE: property?.PROPERTY_CODE,
      PROPERTY_CITY: property?.CITY,
      DAYS_UNTIL_DUE: daysUntilDue,
      RISK_LEVEL: riskLevel,
      IS_OVERDUE: daysUntilDue < 0 && compliance.STATUS !== 'COMPLETED'
    };
  }

  /**
   * Calculate days until due date
   */
  calculateDaysUntilDue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calculate risk level based on days until due
   */
  calculateRiskLevel(daysUntilDue, status) {
    if (status === 'COMPLETED') return 'LOW';
    if (daysUntilDue < 0) return 'CRITICAL';
    if (daysUntilDue <= 7) return 'HIGH';
    if (daysUntilDue <= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get compliance statistics
   */
  async getStatistics() {
    const total = this.dataSource.length;
    const completed = this.dataSource.filter(c => c.STATUS === 'COMPLETED').length;
    const pending = this.dataSource.filter(c => c.STATUS === 'PENDING').length;
    const overdue = this.dataSource.filter(c => {
      return c.STATUS !== 'COMPLETED' && this.calculateDaysUntilDue(c.DUE_DATE) < 0;
    }).length;

    // Group by category
    const byCategory = this.dataSource.reduce((acc, compliance) => {
      const category = compliance.COMPLIANCE_CATEGORY || 'OTHER';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Group by authority
    const byAuthority = this.dataSource.reduce((acc, compliance) => {
      const authority = compliance.AUTHORITY || 'UNKNOWN';
      acc[authority] = (acc[authority] || 0) + 1;
      return acc;
    }, {});

    // Risk distribution
    const riskDistribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    this.dataSource.forEach(compliance => {
      const daysUntilDue = this.calculateDaysUntilDue(compliance.DUE_DATE);
      const risk = this.calculateRiskLevel(daysUntilDue, compliance.STATUS);
      riskDistribution[risk]++;
    });

    // Upcoming compliance (next 30 days)
    const upcoming = this.dataSource.filter(c => {
      const days = this.calculateDaysUntilDue(c.DUE_DATE);
      return days > 0 && days <= 30 && c.STATUS !== 'COMPLETED';
    }).length;

    return {
      total,
      completed,
      pending,
      overdue,
      upcoming,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      byCategory,
      byAuthority,
      riskDistribution
    };
  }

  /**
   * Get overdue compliance items
   */
  async getOverdueCompliance() {
    const overdueItems = this.dataSource.filter(compliance => {
      return compliance.STATUS !== 'COMPLETED' &&
             this.calculateDaysUntilDue(compliance.DUE_DATE) < 0;
    });

    return this.enrichMany(overdueItems);
  }

  /**
   * Get upcoming compliance (within specified days)
   */
  async getUpcomingCompliance(days = 30) {
    const upcomingItems = this.dataSource.filter(compliance => {
      const daysUntilDue = this.calculateDaysUntilDue(compliance.DUE_DATE);
      return daysUntilDue > 0 && daysUntilDue <= days &&
             compliance.STATUS !== 'COMPLETED';
    });

    return this.enrichMany(upcomingItems);
  }

  /**
   * Get compliance by property
   */
  async getByProperty(propertyId) {
    const items = this.dataSource.filter(c => c.PROPERTY_ID === parseInt(propertyId));
    return this.enrichMany(items);
  }

  /**
   * Get compliance by category
   */
  async getByCategory(category) {
    const items = this.dataSource.filter(c => c.COMPLIANCE_CATEGORY === category);
    return this.enrichMany(items);
  }

  /**
   * Calculate next due date based on frequency
   */
  calculateNextDueDate(completionDate, frequency) {
    const date = new Date(completionDate);

    switch (frequency) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'SEMI_ANNUAL':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'ANNUAL':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'BIENNIAL':
        date.setFullYear(date.getFullYear() + 2);
        break;
      case 'ONE_TIME':
        return null; // No next due date for one-time compliance
      default:
        date.setFullYear(date.getFullYear() + 1); // Default to annual
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Mark compliance as completed and create next occurrence if recurring
   */
  async completeCompliance(complianceId, completionData) {
    const compliance = await this.getById(complianceId);

    // Update current compliance
    await this.update(complianceId, {
      STATUS: 'COMPLETED',
      COMPLETION_DATE: completionData.COMPLETION_DATE || new Date().toISOString().split('T')[0],
      CERTIFICATE_NUMBER: completionData.CERTIFICATE_NUMBER,
      CERTIFICATE_ISSUE_DATE: completionData.CERTIFICATE_ISSUE_DATE,
      CERTIFICATE_EXPIRY_DATE: completionData.CERTIFICATE_EXPIRY_DATE,
      NOTES: completionData.NOTES
    });

    // Create next occurrence if recurring
    if (compliance.FREQUENCY && compliance.FREQUENCY !== 'ONE_TIME') {
      const nextDueDate = this.calculateNextDueDate(
        completionData.COMPLETION_DATE || new Date().toISOString().split('T')[0],
        compliance.FREQUENCY
      );

      if (nextDueDate) {
        const nextCompliance = {
          COMPLIANCE_TYPE: compliance.COMPLIANCE_TYPE,
          TITLE: compliance.TITLE,
          PROPERTY_ID: compliance.PROPERTY_ID,
          COMPLIANCE_CATEGORY: compliance.COMPLIANCE_CATEGORY,
          REGULATION: compliance.REGULATION,
          AUTHORITY: compliance.AUTHORITY,
          FREQUENCY: compliance.FREQUENCY,
          DUE_DATE: nextDueDate,
          STATUS: 'PENDING',
          PRIORITY: compliance.PRIORITY,
          ASSIGNED_TO: compliance.ASSIGNED_TO,
          NOTES: `Auto-generated from compliance #${complianceId}`
        };

        return this.create(nextCompliance);
      }
    }

    return null;
  }
}

module.exports = ComplianceService;

