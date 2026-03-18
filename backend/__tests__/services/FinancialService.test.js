/**
 * FinancialService Tests
 */

const FinancialService = require('../../services/FinancialService');

describe('FinancialService', () => {
  let financialService;
  let mockInvoices;
  let mockTenants;
  let mockLeases;
  let mockProperties;
  let mockPaymentReceipts;

  beforeEach(() => {
    // Mock data
    const today = new Date();
    const pastDue30 = new Date(today);
    pastDue30.setDate(pastDue30.getDate() - 30);
    const pastDue60 = new Date(today);
    pastDue60.setDate(pastDue60.getDate() - 60);
    const futureDue = new Date(today);
    futureDue.setDate(futureDue.getDate() + 30);

    mockInvoices = [
      {
        INVOICE_ID: 'INV001',
        TENANT_ID: 'T001',
        LEASE_ID: 'L001',
        PROPERTY_ID: 'P001',
        INVOICE_NUMBER: 'INV-202401-00001',
        INVOICE_DATE: '2024-01-01',
        DUE_DATE: pastDue30.toISOString().split('T')[0],
        AMOUNT: 100000,
        VAT_AMOUNT: 16000,
        VAT_RATE: 16,
        WITHHOLDING_TAX_AMOUNT: 10000,
        WITHHOLDING_TAX_RATE: 10,
        TOTAL_AMOUNT: 116000,
        NET_AMOUNT_DUE: 106000,
        STATUS: 'PENDING'
      },
      {
        INVOICE_ID: 'INV002',
        TENANT_ID: 'T002',
        LEASE_ID: 'L002',
        PROPERTY_ID: 'P001',
        INVOICE_NUMBER: 'INV-202401-00002',
        INVOICE_DATE: '2024-01-15',
        DUE_DATE: futureDue.toISOString().split('T')[0],
        AMOUNT: 50000,
        VAT_AMOUNT: 8000,
        VAT_RATE: 16,
        WITHHOLDING_TAX_AMOUNT: 5000,
        WITHHOLDING_TAX_RATE: 10,
        TOTAL_AMOUNT: 58000,
        NET_AMOUNT_DUE: 53000,
        STATUS: 'PENDING'
      },
      {
        INVOICE_ID: 'INV003',
        TENANT_ID: 'T003',
        LEASE_ID: 'L003',
        PROPERTY_ID: 'P002',
        INVOICE_NUMBER: 'INV-202312-00001',
        INVOICE_DATE: '2023-12-01',
        DUE_DATE: pastDue60.toISOString().split('T')[0],
        AMOUNT: 75000,
        VAT_AMOUNT: 12000,
        VAT_RATE: 16,
        WITHHOLDING_TAX_AMOUNT: 7500,
        WITHHOLDING_TAX_RATE: 10,
        TOTAL_AMOUNT: 87000,
        NET_AMOUNT_DUE: 79500,
        STATUS: 'PAID'
      }
    ];

    mockTenants = [
      { TENANT_ID: 'T001', TENANT_NAME: 'Safaricom Ltd', TENANT_CODE: 'SAF001', EMAIL: 'info@safaricom.co.ke', PHONE: '+254-700-000-000' },
      { TENANT_ID: 'T002', TENANT_NAME: 'KCB Bank', TENANT_CODE: 'KCB001', EMAIL: 'info@kcb.co.ke', PHONE: '+254-711-111-111' },
      { TENANT_ID: 'T003', TENANT_NAME: 'Equity Bank', TENANT_CODE: 'EQB001', EMAIL: 'info@equity.co.ke', PHONE: '+254-722-222-222' }
    ];

    mockLeases = [
      { LEASE_ID: 'L001', LEASE_NUMBER: 'LSE-2024-001', PROPERTY_ID: 'P001', TENANT_ID: 'T001' },
      { LEASE_ID: 'L002', LEASE_NUMBER: 'LSE-2024-002', PROPERTY_ID: 'P001', TENANT_ID: 'T002' },
      { LEASE_ID: 'L003', LEASE_NUMBER: 'LSE-2023-001', PROPERTY_ID: 'P002', TENANT_ID: 'T003' }
    ];

    mockProperties = [
      { PROPERTY_ID: 'P001', PROPERTY_NAME: 'Westlands Tower', PROPERTY_CODE: 'WT001' },
      { PROPERTY_ID: 'P002', PROPERTY_NAME: 'Karen Plaza', PROPERTY_CODE: 'KP001' }
    ];

    mockPaymentReceipts = [
      { RECEIPT_ID: 'RCP001', INVOICE_ID: 'INV003', AMOUNT_PAID: 87000, PAYMENT_DATE: '2024-01-15', PAYMENT_METHOD: 'M_PESA' }
    ];

    financialService = new FinancialService(
      mockInvoices,
      mockTenants,
      mockLeases,
      mockProperties,
      mockPaymentReceipts
    );
  });

  describe('getIdField', () => {
    test('should return INVOICE_ID', () => {
      expect(financialService.getIdField()).toBe('INVOICE_ID');
    });
  });

  describe('validate', () => {
    test('should validate required fields for new invoice', () => {
      expect(() => {
        financialService.validate({});
      }).toThrow('Tenant ID is required');
    });

    test('should validate amount is positive', () => {
      expect(() => {
        financialService.validate({
          TENANT_ID: 'T001',
          INVOICE_DATE: '2024-01-01',
          DUE_DATE: '2024-02-01',
          AMOUNT: -1000
        });
      }).toThrow('Amount must be positive');
    });

    test('should pass validation for valid invoice data', () => {
      expect(() => {
        financialService.validate({
          TENANT_ID: 'T001',
          INVOICE_DATE: '2024-01-01',
          DUE_DATE: '2024-02-01',
          AMOUNT: 100000
        });
      }).not.toThrow();
    });
  });

  describe('calculateWithholdingTax', () => {
    test('should calculate WHT at 10% (Kenya default)', () => {
      const wht = financialService.calculateWithholdingTax(100000);
      expect(wht).toBe('10000.00');
    });

    test('should calculate WHT at custom rate', () => {
      const wht = financialService.calculateWithholdingTax(100000, 5);
      expect(wht).toBe('5000.00');
    });
  });

  describe('calculateVAT', () => {
    test('should calculate VAT at 16% (Kenya default)', () => {
      const vat = financialService.calculateVAT(100000);
      expect(vat).toBe('16000.00');
    });

    test('should calculate VAT at custom rate', () => {
      const vat = financialService.calculateVAT(100000, 18);
      expect(vat).toBe('18000.00');
    });
  });

  describe('calculateDaysOverdue', () => {
    test('should return 0 for paid invoices', () => {
      const days = financialService.calculateDaysOverdue({ STATUS: 'PAID', DUE_DATE: '2024-01-01' });
      expect(days).toBe(0);
    });

    test('should return 0 for future due dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const days = financialService.calculateDaysOverdue({
        STATUS: 'PENDING',
        DUE_DATE: futureDate.toISOString().split('T')[0]
      });
      expect(days).toBe(0);
    });

    test('should calculate positive days for past due dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const days = financialService.calculateDaysOverdue({
        STATUS: 'PENDING',
        DUE_DATE: pastDate.toISOString().split('T')[0]
      });
      expect(days).toBeGreaterThan(29);
    });
  });

  describe('getCollectionStatus', () => {
    test('should return CURRENT for paid invoices', () => {
      const status = financialService.getCollectionStatus(0, 'PAID');
      expect(status).toBe('CURRENT');
    });

    test('should return CURRENT for 0 days overdue', () => {
      const status = financialService.getCollectionStatus(0, 'PENDING');
      expect(status).toBe('CURRENT');
    });

    test('should return 1-30 DAYS for 1-30 days overdue', () => {
      const status = financialService.getCollectionStatus(15, 'PENDING');
      expect(status).toBe('1-30 DAYS');
    });

    test('should return 31-60 DAYS for 31-60 days overdue', () => {
      const status = financialService.getCollectionStatus(45, 'PENDING');
      expect(status).toBe('31-60 DAYS');
    });

    test('should return 61-90 DAYS for 61-90 days overdue', () => {
      const status = financialService.getCollectionStatus(75, 'PENDING');
      expect(status).toBe('61-90 DAYS');
    });

    test('should return 90+ DAYS for over 90 days overdue', () => {
      const status = financialService.getCollectionStatus(120, 'PENDING');
      expect(status).toBe('90+ DAYS');
    });
  });

  describe('generateInvoiceNumber', () => {
    test('should generate invoice number with year-month-sequence format', () => {
      const invoiceNumber = financialService.generateInvoiceNumber();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');

      expect(invoiceNumber).toMatch(new RegExp(`^INV-${year}${month}-\\d{5}$`));
    });

    test('should increment sequence number', () => {
      const inv1 = financialService.generateInvoiceNumber();
      financialService.dataSource.push({ INVOICE_ID: 'INV999' });
      const inv2 = financialService.generateInvoiceNumber();

      const seq1 = parseInt(inv1.split('-')[2]);
      const seq2 = parseInt(inv2.split('-')[2]);

      expect(seq2).toBe(seq1 + 1);
    });
  });

  describe('createInvoice', () => {
    test('should create invoice with all tax calculations', async () => {
      const invoiceData = {
        TENANT_ID: 'T001',
        LEASE_ID: 'L001',
        PROPERTY_ID: 'P001',
        INVOICE_DATE: '2024-02-01',
        DUE_DATE: '2024-03-01',
        AMOUNT: 100000
      };

      const invoice = await financialService.createInvoice(invoiceData);

      expect(invoice.VAT_AMOUNT).toBe('16000.00');
      expect(invoice.VAT_RATE).toBe(16);
      expect(invoice.WITHHOLDING_TAX_AMOUNT).toBe('10000.00');
      expect(invoice.WITHHOLDING_TAX_RATE).toBe(10);
      expect(invoice.TOTAL_AMOUNT).toBe('116000.00');
      expect(invoice.NET_AMOUNT_DUE).toBe('106000.00');
      expect(invoice.STATUS).toBe('PENDING');
      expect(invoice.INVOICE_NUMBER).toBeDefined();
    });

    test('should use custom tax rates if provided', async () => {
      const invoiceData = {
        TENANT_ID: 'T001',
        INVOICE_DATE: '2024-02-01',
        DUE_DATE: '2024-03-01',
        AMOUNT: 100000,
        VAT_RATE: 18,
        WITHHOLDING_TAX_RATE: 5
      };

      const invoice = await financialService.createInvoice(invoiceData);

      expect(invoice.VAT_AMOUNT).toBe('18000.00');
      expect(invoice.VAT_RATE).toBe(18);
      expect(invoice.WITHHOLDING_TAX_AMOUNT).toBe('5000.00');
      expect(invoice.WITHHOLDING_TAX_RATE).toBe(5);
    });
  });

  describe('enrich', () => {
    test('should enrich invoice with tenant, lease, and property data', async () => {
      const enriched = await financialService.enrich(mockInvoices[0]);

      expect(enriched.TENANT_NAME).toBe('Safaricom Ltd');
      expect(enriched.TENANT_CODE).toBe('SAF001');
      expect(enriched.TENANT_EMAIL).toBe('info@safaricom.co.ke');
      expect(enriched.TENANT_PHONE).toBe('+254-700-000-000');
      expect(enriched.LEASE_NUMBER).toBe('LSE-2024-001');
      expect(enriched.PROPERTY_NAME).toBe('Westlands Tower');
      expect(enriched.PROPERTY_CODE).toBe('WT001');
    });

    test('should calculate days overdue and collection status', async () => {
      const enriched = await financialService.enrich(mockInvoices[0]);

      expect(enriched.DAYS_OVERDUE).toBeGreaterThan(0);
      expect(enriched.COLLECTION_STATUS).toBeDefined();
    });

    test('should calculate payment totals and balance', async () => {
      const enriched = await financialService.enrich(mockInvoices[2]);

      expect(enriched.TOTAL_PAID).toBe('87000.00');
      expect(enriched.BALANCE).toBe('0.00');
      expect(enriched.PAYMENT_COUNT).toBe(1);
    });
  });

  describe('getStatistics', () => {
    test('should calculate invoice statistics', async () => {
      const stats = await financialService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.paid).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.overdue).toBeGreaterThan(0);
    });

    test('should calculate amounts', async () => {
      const stats = await financialService.getStatistics();

      expect(parseFloat(stats.totalAmount)).toBeGreaterThan(0);
      expect(parseFloat(stats.paidAmount)).toBeGreaterThan(0);
      expect(parseFloat(stats.pendingAmount)).toBeGreaterThan(0);
    });

    test('should calculate collection aging', async () => {
      const stats = await financialService.getStatistics();

      expect(stats.aging).toBeDefined();
      expect(stats.aging.current).toBeDefined();
      expect(stats.aging['1-30']).toBeDefined();
      expect(stats.aging['31-60']).toBeDefined();
      expect(stats.aging['61-90']).toBeDefined();
      expect(stats.aging['90+']).toBeDefined();
    });
  });
});

