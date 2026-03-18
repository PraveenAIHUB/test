/**
 * ComplianceService Tests
 */

const ComplianceService = require('../../services/ComplianceService');

describe('ComplianceService', () => {
  let complianceService;
  let mockCompliance;
  let mockProperties;

  beforeEach(() => {
    const today = new Date();
    const past30 = new Date(today);
    past30.setDate(past30.getDate() - 30);
    const future30 = new Date(today);
    future30.setDate(future30.getDate() + 30);
    const future60 = new Date(today);
    future60.setDate(future60.getDate() + 60);

    mockCompliance = [
      {
        COMPLIANCE_ID: 'C001',
        PROPERTY_ID: 'P001',
        COMPLIANCE_TYPE: 'FIRE_CERTIFICATE',
        COMPLIANCE_CATEGORY: 'FIRE',
        AUTHORITY: 'County Fire Department',
        ISSUE_DATE: past30.toISOString().split('T')[0],
        EXPIRY_DATE: future30.toISOString().split('T')[0],
        STATUS: 'ACTIVE',
        RISK_LEVEL: 'HIGH'
      },
      {
        COMPLIANCE_ID: 'C002',
        PROPERTY_ID: 'P001',
        COMPLIANCE_TYPE: 'NEMA_AUDIT',
        COMPLIANCE_CATEGORY: 'NEMA',
        AUTHORITY: 'NEMA',
        ISSUE_DATE: '2024-01-01',
        EXPIRY_DATE: past30.toISOString().split('T')[0],
        STATUS: 'EXPIRED',
        RISK_LEVEL: 'CRITICAL'
      },
      {
        COMPLIANCE_ID: 'C003',
        PROPERTY_ID: 'P002',
        COMPLIANCE_TYPE: 'COUNTY_SBP',
        COMPLIANCE_CATEGORY: 'COUNTY',
        AUTHORITY: 'County Government',
        ISSUE_DATE: '2024-01-01',
        EXPIRY_DATE: future60.toISOString().split('T')[0],
        STATUS: 'ACTIVE',
        RISK_LEVEL: 'MEDIUM'
      }
    ];

    mockProperties = [
      { PROPERTY_ID: 'P001', PROPERTY_NAME: 'Westlands Tower', PROPERTY_CODE: 'WT001', CITY: 'Nairobi' },
      { PROPERTY_ID: 'P002', PROPERTY_NAME: 'Karen Plaza', PROPERTY_CODE: 'KP001', CITY: 'Nairobi' }
    ];

    complianceService = new ComplianceService(mockCompliance, mockProperties);
  });

  describe('getIdField', () => {
    test('should return COMPLIANCE_ID', () => {
      expect(complianceService.getIdField()).toBe('COMPLIANCE_ID');
    });
  });

  describe('KENYA_COMPLIANCE_TYPES', () => {
    test('should have all 10 compliance categories', () => {
      const types = ComplianceService.KENYA_COMPLIANCE_TYPES;
      
      expect(types.NEMA).toBeDefined();
      expect(types.COUNTY).toBeDefined();
      expect(types.FIRE).toBeDefined();
      expect(types.DOSH).toBeDefined();
      expect(types.WATER).toBeDefined();
      expect(types.ENERGY).toBeDefined();
      expect(types.KRA).toBeDefined();
      expect(types.HEALTH).toBeDefined();
      expect(types.INSURANCE).toBeDefined();
      expect(types.SECURITY).toBeDefined();
    });

    test('should have at least 52 compliance types total', () => {
      const types = ComplianceService.KENYA_COMPLIANCE_TYPES;
      const totalTypes = Object.values(types).reduce((sum, category) => sum + category.length, 0);
      
      expect(totalTypes).toBeGreaterThanOrEqual(52);
    });

    test('should have NEMA compliance types', () => {
      const nemaTypes = ComplianceService.KENYA_COMPLIANCE_TYPES.NEMA;
      
      expect(nemaTypes.length).toBeGreaterThan(0);
      expect(nemaTypes[0].code).toBe('NEMA_EIA');
      expect(nemaTypes[0].authority).toBe('NEMA');
    });

    test('should have County compliance types', () => {
      const countyTypes = ComplianceService.KENYA_COMPLIANCE_TYPES.COUNTY;
      
      expect(countyTypes.length).toBeGreaterThan(0);
      expect(countyTypes.some(t => t.code === 'COUNTY_SBP')).toBe(true);
    });

    test('should have Fire compliance types', () => {
      const fireTypes = ComplianceService.KENYA_COMPLIANCE_TYPES.FIRE;
      
      expect(fireTypes.length).toBeGreaterThan(0);
      expect(fireTypes.some(t => t.code === 'FIRE_CERTIFICATE')).toBe(true);
    });

    test('should have KRA compliance types', () => {
      const kraTypes = ComplianceService.KENYA_COMPLIANCE_TYPES.KRA;
      
      expect(kraTypes.length).toBeGreaterThan(0);
      expect(kraTypes.some(t => t.code === 'KRA_VAT')).toBe(true);
      expect(kraTypes.some(t => t.code === 'KRA_WHT')).toBe(true);
    });
  });

  describe('validate', () => {
    test('should validate required fields for new compliance record', () => {
      expect(() => {
        complianceService.validate({});
      }).toThrow('Compliance type is required');
    });

    test('should pass validation for valid compliance data', () => {
      expect(() => {
        complianceService.validate({
          PROPERTY_ID: 'P001',
          COMPLIANCE_TYPE: 'FIRE_CERTIFICATE',
          DUE_DATE: '2024-12-31'
        });
      }).not.toThrow();
    });
  });

  describe('calculateDaysUntilDue', () => {
    test('should calculate positive days for future due date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const days = complianceService.calculateDaysUntilDue(futureDate.toISOString().split('T')[0]);
      expect(days).toBeGreaterThan(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    test('should calculate negative days for past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const days = complianceService.calculateDaysUntilDue(pastDate.toISOString().split('T')[0]);
      expect(days).toBeLessThan(0);
    });
  });

  describe('calculateRiskLevel', () => {
    test('should return LOW for completed status', () => {
      const risk = complianceService.calculateRiskLevel(10, 'COMPLETED');
      expect(risk).toBe('LOW');
    });

    test('should return CRITICAL for overdue', () => {
      const risk = complianceService.calculateRiskLevel(-1, 'PENDING');
      expect(risk).toBe('CRITICAL');
    });

    test('should return HIGH for due within 7 days', () => {
      const risk = complianceService.calculateRiskLevel(5, 'PENDING');
      expect(risk).toBe('HIGH');
    });

    test('should return MEDIUM for due within 30 days', () => {
      const risk = complianceService.calculateRiskLevel(15, 'PENDING');
      expect(risk).toBe('MEDIUM');
    });

    test('should return LOW for due beyond 30 days', () => {
      const risk = complianceService.calculateRiskLevel(60, 'PENDING');
      expect(risk).toBe('LOW');
    });
  });

  describe('enrich', () => {
    test('should enrich compliance with property data', async () => {
      const compliance = {
        ...mockCompliance[0],
        DUE_DATE: mockCompliance[0].EXPIRY_DATE
      };
      const enriched = await complianceService.enrich(compliance);

      expect(enriched.PROPERTY_NAME).toBe('Westlands Tower');
      expect(enriched.PROPERTY_CODE).toBe('WT001');
      expect(enriched.PROPERTY_CITY).toBe('Nairobi');
    });

    test('should calculate days until due', async () => {
      const compliance = {
        ...mockCompliance[0],
        DUE_DATE: mockCompliance[0].EXPIRY_DATE
      };
      const enriched = await complianceService.enrich(compliance);
      expect(enriched.DAYS_UNTIL_DUE).toBeDefined();
    });

    test('should calculate risk level', async () => {
      const compliance = {
        ...mockCompliance[0],
        DUE_DATE: mockCompliance[0].EXPIRY_DATE
      };
      const enriched = await complianceService.enrich(compliance);
      expect(enriched.RISK_LEVEL).toBeDefined();
    });

    test('should determine if compliance is overdue', async () => {
      const compliance = {
        ...mockCompliance[1],
        DUE_DATE: mockCompliance[1].EXPIRY_DATE
      };
      const enriched = await complianceService.enrich(compliance);
      expect(enriched.IS_OVERDUE).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    test('should calculate compliance statistics', async () => {
      const stats = await complianceService.getStatistics();

      expect(stats.total).toBe(3);
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.overdue).toBe('number');
    });

    test('should group by category', async () => {
      const stats = await complianceService.getStatistics();

      expect(stats.byCategory).toBeDefined();
      expect(typeof stats.byCategory).toBe('object');
    });

    test('should calculate risk distribution', async () => {
      const stats = await complianceService.getStatistics();

      expect(stats.riskDistribution).toBeDefined();
      expect(typeof stats.riskDistribution).toBe('object');
      expect(stats.riskDistribution.CRITICAL).toBeDefined();
      expect(stats.riskDistribution.HIGH).toBeDefined();
      expect(stats.riskDistribution.MEDIUM).toBeDefined();
      expect(stats.riskDistribution.LOW).toBeDefined();
    });
  });

  describe('getAllComplianceTypes (static)', () => {
    test('should return all compliance types', () => {
      const allTypes = ComplianceService.getAllComplianceTypes();

      expect(Array.isArray(allTypes)).toBe(true);
      expect(allTypes.length).toBeGreaterThan(50);
    });

    test('should include category in each type', () => {
      const allTypes = ComplianceService.getAllComplianceTypes();

      expect(allTypes[0].category).toBeDefined();
      expect(allTypes[0].code).toBeDefined();
      expect(allTypes[0].name).toBeDefined();
      expect(allTypes[0].authority).toBeDefined();
      expect(allTypes[0].frequency).toBeDefined();
    });
  });

  describe('getComplianceTypesByCategory (static)', () => {
    test('should return types for specific category', () => {
      const fireTypes = ComplianceService.getComplianceTypesByCategory('FIRE');

      expect(Array.isArray(fireTypes)).toBe(true);
      expect(fireTypes.length).toBeGreaterThan(0);
    });

    test('should return empty array for invalid category', () => {
      const types = ComplianceService.getComplianceTypesByCategory('INVALID');

      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBe(0);
    });
  });
});
