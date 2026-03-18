/**
 * Unit Tests for BaseService
 * Tests CRUD operations, filtering, pagination, validation, error handling
 */

const BaseService = require('../../services/BaseService');

// Create a concrete implementation of BaseService for testing
class TestService extends BaseService {
  constructor(data) {
    super(data);
  }

  getIdField() {
    return 'TEST_ID';
  }

  validate(data, isUpdate) {
    if (!isUpdate && !data.NAME) {
      throw new Error('NAME is required');
    }
    if (data.AGE && (data.AGE < 0 || data.AGE > 150)) {
      throw new Error('AGE must be between 0 and 150');
    }
    return true;
  }
}

describe('BaseService', () => {
  let testService;
  let mockData;

  beforeEach(() => {
    // Reset mock data before each test
    mockData = [
      { TEST_ID: 'T001', NAME: 'Alice', AGE: 30, STATUS: 'ACTIVE', CATEGORY: 'A' },
      { TEST_ID: 'T002', NAME: 'Bob', AGE: 25, STATUS: 'ACTIVE', CATEGORY: 'B' },
      { TEST_ID: 'T003', NAME: 'Charlie', AGE: 35, STATUS: 'INACTIVE', CATEGORY: 'A' },
      { TEST_ID: 'T004', NAME: 'David', AGE: 40, STATUS: 'ACTIVE', CATEGORY: 'C' },
      { TEST_ID: 'T005', NAME: 'Eve', AGE: 28, STATUS: 'INACTIVE', CATEGORY: 'B' }
    ];
    testService = new TestService(mockData);
  });

  describe('getAll', () => {
    test('should return all records without filters', async () => {
      const result = await testService.getAll();
      
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    test('should filter records by single field', async () => {
      const result = await testService.getAll({ STATUS: 'ACTIVE' });
      
      expect(result.data).toHaveLength(3);
      expect(result.data.every(r => r.STATUS === 'ACTIVE')).toBe(true);
    });

    test('should filter records by multiple fields', async () => {
      const result = await testService.getAll({ STATUS: 'ACTIVE', CATEGORY: 'A' });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].TEST_ID).toBe('T001');
    });

    test('should paginate results correctly', async () => {
      const result = await testService.getAll({}, { page: 1, limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    test('should return correct page 2', async () => {
      const result = await testService.getAll({}, { page: 2, limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(2);
      expect(result.data[0].TEST_ID).toBe('T003');
    });

    test('should return empty array for page beyond total pages', async () => {
      const result = await testService.getAll({}, { page: 10, limit: 2 });
      
      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(10);
    });

    test('should combine filters and pagination', async () => {
      const result = await testService.getAll({ STATUS: 'ACTIVE' }, { page: 1, limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getById', () => {
    test('should return a single record by ID', async () => {
      const record = await testService.getById('T001');
      
      expect(record).toBeDefined();
      expect(record.TEST_ID).toBe('T001');
      expect(record.NAME).toBe('Alice');
    });

    test('should return null for non-existent ID', async () => {
      const record = await testService.getById('T999');
      
      expect(record).toBeNull();
    });
  });

  describe('create', () => {
    test('should create a new record with auto-generated ID', async () => {
      const newData = { NAME: 'Frank', AGE: 32, STATUS: 'ACTIVE', CATEGORY: 'A' };
      const created = await testService.create(newData);
      
      expect(created).toBeDefined();
      expect(created.TEST_ID).toBe('T006');
      expect(created.NAME).toBe('Frank');
      expect(created.AGE).toBe(32);
      expect(created.CREATED_DATE).toBeDefined();
      expect(created.CREATED_BY).toBe('SYSTEM');
    });

    test('should add created record to data source', async () => {
      const newData = { NAME: 'Grace', AGE: 29, STATUS: 'ACTIVE', CATEGORY: 'B' };
      await testService.create(newData);
      
      const result = await testService.getAll();
      expect(result.total).toBe(6);
    });

    test('should throw error for invalid data', async () => {
      const invalidData = { AGE: 30 }; // Missing NAME
      
      await expect(testService.create(invalidData)).rejects.toThrow('NAME is required');
    });

    test('should throw error for invalid AGE', async () => {
      const invalidData = { NAME: 'Invalid', AGE: 200 };

      await expect(testService.create(invalidData)).rejects.toThrow('AGE must be between 0 and 150');
    });
  });

  describe('update', () => {
    test('should update an existing record', async () => {
      const updateData = { NAME: 'Alice Updated', AGE: 31 };
      const updated = await testService.update('T001', updateData);

      expect(updated).toBeDefined();
      expect(updated.TEST_ID).toBe('T001');
      expect(updated.NAME).toBe('Alice Updated');
      expect(updated.AGE).toBe(31);
      expect(updated.UPDATED_DATE).toBeDefined();
      expect(updated.UPDATED_BY).toBe('SYSTEM');
    });

    test('should preserve unchanged fields', async () => {
      const updateData = { NAME: 'Alice Updated' };
      const updated = await testService.update('T001', updateData);

      expect(updated.AGE).toBe(30); // Original value preserved
      expect(updated.STATUS).toBe('ACTIVE');
    });

    test('should return null for non-existent ID', async () => {
      const updateData = { NAME: 'Updated' };
      const updated = await testService.update('T999', updateData);

      expect(updated).toBeNull();
    });

    test('should throw error for invalid update data', async () => {
      const invalidData = { AGE: -5 };

      await expect(testService.update('T001', invalidData)).rejects.toThrow('AGE must be between 0 and 150');
    });

    test('should update record in data source', async () => {
      await testService.update('T001', { NAME: 'Alice Modified' });
      const record = await testService.getById('T001');

      expect(record.NAME).toBe('Alice Modified');
    });
  });

  describe('delete', () => {
    test('should delete an existing record', async () => {
      const deleted = await testService.delete('T001');

      expect(deleted).toBe(true);
    });

    test('should remove record from data source', async () => {
      await testService.delete('T001');
      const record = await testService.getById('T001');

      expect(record).toBeNull();
    });

    test('should reduce total count after deletion', async () => {
      await testService.delete('T001');
      const result = await testService.getAll();

      expect(result.total).toBe(4);
    });

    test('should return false for non-existent ID', async () => {
      const deleted = await testService.delete('T999');

      expect(deleted).toBe(false);
    });
  });

  describe('applyFilters', () => {
    test('should return all records with empty filters', () => {
      const filtered = testService.applyFilters(mockData, {});

      expect(filtered).toHaveLength(5);
    });

    test('should filter by exact match', () => {
      const filtered = testService.applyFilters(mockData, { STATUS: 'ACTIVE' });

      expect(filtered).toHaveLength(3);
      expect(filtered.every(r => r.STATUS === 'ACTIVE')).toBe(true);
    });

    test('should filter by multiple fields', () => {
      const filtered = testService.applyFilters(mockData, { STATUS: 'ACTIVE', CATEGORY: 'A' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].TEST_ID).toBe('T001');
    });

    test('should return empty array when no matches', () => {
      const filtered = testService.applyFilters(mockData, { STATUS: 'DELETED' });

      expect(filtered).toHaveLength(0);
    });
  });

  describe('generateId', () => {
    test('should generate next ID based on current data', () => {
      const id1 = testService.generateId();
      expect(id1).toBe('T006');

      // Add a record to data source
      testService.dataSource.push({ TEST_ID: 'T006', NAME: 'Test' });

      const id2 = testService.generateId();
      expect(id2).toBe('T007');
    });

    test('should handle empty data source', () => {
      const emptyService = new TestService([]);
      const id = emptyService.generateId();

      expect(id).toBe('T001');
    });
  });

  describe('enrich and enrichMany', () => {
    test('should enrich a single record (default implementation)', async () => {
      const record = mockData[0];
      const enriched = await testService.enrich(record);

      expect(enriched).toEqual(record); // Default implementation returns as-is
    });

    test('should enrich multiple records', async () => {
      const records = [mockData[0], mockData[1]];
      const enriched = await testService.enrichMany(records);

      expect(enriched).toHaveLength(2);
      expect(enriched).toEqual(records);
    });
  });

  describe('getStatistics', () => {
    test('should return empty object (default implementation)', async () => {
      const stats = await testService.getStatistics();

      expect(stats).toEqual({});
    });
  });

  describe('handleError', () => {
    test('should throw error with operation context', () => {
      const error = new Error('Test error');

      expect(() => testService.handleError(error, 'test operation')).toThrow('Test error');
    });
  });
});

