/**
 * LeaseService Tests
 */

const LeaseService = require('../../services/LeaseService');

describe('LeaseService', () => {
  let leaseService;
  let mockLeases;
  let mockProperties;
  let mockTenants;
  let mockSpaces;

  beforeEach(() => {
    // Mock data
    mockLeases = [
      {
        LEASE_ID: 'L001',
        PROPERTY_ID: 'P001',
        TENANT_ID: 'T001',
        SPACE_ID: 'S001',
        START_DATE: '2024-01-01',
        END_DATE: '2026-12-31',
        BASE_RENT: 100000,
        CAM_CHARGES: 10000,
        SERVICE_CHARGE: 5000,
        PARKING_FEE: 2000,
        STATUS: 'ACTIVE',
        LEASE_TYPE: 'COMMERCIAL'
      },
      {
        LEASE_ID: 'L002',
        PROPERTY_ID: 'P001',
        TENANT_ID: 'T002',
        SPACE_ID: 'S002',
        START_DATE: '2024-06-01',
        END_DATE: '2024-12-31',
        BASE_RENT: 50000,
        CAM_CHARGES: 5000,
        STATUS: 'ACTIVE',
        LEASE_TYPE: 'RETAIL'
      },
      {
        LEASE_ID: 'L003',
        PROPERTY_ID: 'P002',
        TENANT_ID: 'T003',
        SPACE_ID: 'S003',
        START_DATE: '2023-01-01',
        END_DATE: '2024-01-01',
        BASE_RENT: 75000,
        STATUS: 'EXPIRED',
        LEASE_TYPE: 'COMMERCIAL'
      }
    ];

    mockProperties = [
      { PROPERTY_ID: 'P001', PROPERTY_NAME: 'Westlands Tower', PROPERTY_CODE: 'WT001', CITY: 'Nairobi' },
      { PROPERTY_ID: 'P002', PROPERTY_NAME: 'Karen Plaza', PROPERTY_CODE: 'KP001', CITY: 'Nairobi' }
    ];

    mockTenants = [
      { TENANT_ID: 'T001', TENANT_NAME: 'Safaricom Ltd', TENANT_CODE: 'SAF001', EMAIL: 'info@safaricom.co.ke' },
      { TENANT_ID: 'T002', TENANT_NAME: 'KCB Bank', TENANT_CODE: 'KCB001', EMAIL: 'info@kcb.co.ke' },
      { TENANT_ID: 'T003', TENANT_NAME: 'Equity Bank', TENANT_CODE: 'EQB001', EMAIL: 'info@equity.co.ke' }
    ];

    mockSpaces = [
      { SPACE_ID: 'S001', SPACE_CODE: 'WT-F5-01', AREA: 500, FLOOR: '5' },
      { SPACE_ID: 'S002', SPACE_CODE: 'WT-F3-02', AREA: 300, FLOOR: '3' },
      { SPACE_ID: 'S003', SPACE_CODE: 'KP-F1-01', AREA: 400, FLOOR: '1' }
    ];

    leaseService = new LeaseService(mockLeases, mockProperties, mockTenants, mockSpaces);
  });

  describe('getIdField', () => {
    test('should return LEASE_ID', () => {
      expect(leaseService.getIdField()).toBe('LEASE_ID');
    });
  });

  describe('validate', () => {
    test('should validate required fields for new lease', () => {
      expect(() => {
        leaseService.validate({});
      }).toThrow('Property ID is required');
    });

    test('should validate end date is after start date', () => {
      expect(() => {
        leaseService.validate({
          PROPERTY_ID: 'P001',
          TENANT_ID: 'T001',
          START_DATE: '2024-12-31',
          END_DATE: '2024-01-01',
          BASE_RENT: 100000
        });
      }).toThrow('End date must be after start date');
    });

    test('should validate base rent is positive', () => {
      expect(() => {
        leaseService.validate({
          PROPERTY_ID: 'P001',
          TENANT_ID: 'T001',
          START_DATE: '2024-01-01',
          END_DATE: '2024-12-31',
          BASE_RENT: -1000
        });
      }).toThrow('Base rent must be positive');
    });

    test('should validate CAM charges are positive', () => {
      expect(() => {
        leaseService.validate({
          PROPERTY_ID: 'P001',
          TENANT_ID: 'T001',
          START_DATE: '2024-01-01',
          END_DATE: '2024-12-31',
          BASE_RENT: 100000,
          CAM_CHARGES: -500
        });
      }).toThrow('CAM charges must be positive');
    });

    test('should pass validation for valid lease data', () => {
      expect(() => {
        leaseService.validate({
          PROPERTY_ID: 'P001',
          TENANT_ID: 'T001',
          START_DATE: '2024-01-01',
          END_DATE: '2024-12-31',
          BASE_RENT: 100000
        });
      }).not.toThrow();
    });
  });

  describe('calculateTotalRent', () => {
    test('should calculate total rent with all charges', () => {
      const lease = {
        BASE_RENT: 100000,
        CAM_CHARGES: 10000,
        SERVICE_CHARGE: 5000,
        PARKING_FEE: 2000
      };

      const total = leaseService.calculateTotalRent(lease);
      expect(total).toBe(117000);
    });

    test('should handle missing charges', () => {
      const lease = {
        BASE_RENT: 100000
      };

      const total = leaseService.calculateTotalRent(lease);
      expect(total).toBe(100000);
    });

    test('should use MONTHLY_RENT if BASE_RENT is missing', () => {
      const lease = {
        MONTHLY_RENT: 80000,
        CAM_CHARGES: 8000
      };

      const total = leaseService.calculateTotalRent(lease);
      expect(total).toBe(88000);
    });
  });

  describe('calculateDaysUntilExpiry', () => {
    test('should calculate positive days for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const days = leaseService.calculateDaysUntilExpiry(futureDate.toISOString());
      expect(days).toBeGreaterThan(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    test('should calculate negative days for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const days = leaseService.calculateDaysUntilExpiry(pastDate.toISOString());
      expect(days).toBeLessThan(0);
    });
  });

  describe('calculateLeaseDuration', () => {
    test('should calculate duration in months', () => {
      const months = leaseService.calculateLeaseDuration('2024-01-01', '2026-12-31');
      expect(months).toBe(35);
    });

    test('should handle same year leases', () => {
      const months = leaseService.calculateLeaseDuration('2024-01-01', '2024-06-30');
      expect(months).toBe(5);
    });
  });

  describe('enrich', () => {
    test('should enrich lease with property, tenant, and space data', async () => {
      const enriched = await leaseService.enrich(mockLeases[0]);

      expect(enriched.PROPERTY_NAME).toBe('Westlands Tower');
      expect(enriched.PROPERTY_CODE).toBe('WT001');
      expect(enriched.PROPERTY_CITY).toBe('Nairobi');
      expect(enriched.TENANT_NAME).toBe('Safaricom Ltd');
      expect(enriched.TENANT_CODE).toBe('SAF001');
      expect(enriched.TENANT_CONTACT).toBe('info@safaricom.co.ke');
      expect(enriched.SPACE_CODE).toBe('WT-F5-01');
      expect(enriched.SPACE_AREA).toBe(500);
      expect(enriched.SPACE_FLOOR).toBe('5');
    });

    test('should calculate total monthly rent', async () => {
      const enriched = await leaseService.enrich(mockLeases[0]);
      expect(enriched.TOTAL_MONTHLY_RENT).toBe(117000);
    });

    test('should calculate rent per sqm', async () => {
      const enriched = await leaseService.enrich(mockLeases[0]);
      expect(enriched.RENT_PER_SQM).toBe('234.00');
    });

    test('should calculate lease duration', async () => {
      const enriched = await leaseService.enrich(mockLeases[0]);
      expect(enriched.LEASE_DURATION_MONTHS).toBe(35);
    });

    test('should handle missing related data', async () => {
      const lease = {
        LEASE_ID: 'L999',
        PROPERTY_ID: 'P999',
        TENANT_ID: 'T999',
        SPACE_ID: 'S999',
        START_DATE: '2024-01-01',
        END_DATE: '2024-12-31',
        BASE_RENT: 50000
      };

      const enriched = await leaseService.enrich(lease);
      expect(enriched.PROPERTY_NAME).toBeUndefined();
      expect(enriched.TENANT_NAME).toBeUndefined();
      expect(enriched.SPACE_CODE).toBeUndefined();
    });
  });

  describe('getStatistics', () => {
    test('should calculate lease statistics', async () => {
      const stats = await leaseService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.expired).toBeGreaterThan(0);
      expect(parseFloat(stats.totalMonthlyRevenue)).toBeGreaterThan(0);
      expect(parseFloat(stats.avgRent)).toBeGreaterThan(0);
    });

    test('should group leases by type', async () => {
      const stats = await leaseService.getStatistics();

      expect(stats.byType.COMMERCIAL).toBe(2);
      expect(stats.byType.RETAIL).toBe(1);
    });

    test('should calculate revenue by type', async () => {
      const stats = await leaseService.getStatistics();

      expect(stats.revenueByType.COMMERCIAL).toBeGreaterThan(0);
      expect(stats.revenueByType.RETAIL).toBeGreaterThan(0);
    });
  });

  describe('getExpiringLeases', () => {
    test('should return leases expiring within specified days', async () => {
      const expiring = await leaseService.getExpiringLeases(90);
      expect(Array.isArray(expiring)).toBe(true);
    });

    test('should enrich expiring leases', async () => {
      const expiring = await leaseService.getExpiringLeases(365);
      if (expiring.length > 0) {
        expect(expiring[0].PROPERTY_NAME).toBeDefined();
      }
    });
  });
});

