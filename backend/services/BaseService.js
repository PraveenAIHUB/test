/**
 * BaseService - Abstract base class for all service classes
 * Provides common patterns for data access, validation, and error handling
 */

class BaseService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Get all records with optional filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options {page, limit}
   * @returns {Object} {data, total, page, limit}
   */
  async getAll(filters = {}, pagination = {}) {
    try {
      let data = [...this.dataSource];

      // Apply filters
      data = this.applyFilters(data, filters);

      const total = data.length;
      const page = pagination.page ? parseInt(pagination.page) : 1;
      const limit = pagination.limit ? parseInt(pagination.limit) : 20;

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        data = data.slice(startIndex, endIndex);
      }

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw this.handleError(error, 'getAll');
    }
  }

  /**
   * Get a single record by ID
   * @param {String|Number} id - Record ID
   * @returns {Object} Record object or null if not found
   */
  async getById(id) {
    try {
      const record = this.dataSource.find(item => {
        const itemId = item[this.getIdField()];
        // Handle both string and numeric IDs
        return itemId === id || itemId === parseInt(id) || String(itemId) === String(id);
      });

      return record || null;
    } catch (error) {
      throw this.handleError(error, 'getById');
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Object} Created record
   */
  async create(data) {
    try {
      // Validate data
      this.validate(data);

      // Generate new ID
      const newId = this.generateId();
      const newRecord = {
        [this.getIdField()]: newId,
        ...data,
        CREATED_DATE: new Date().toISOString(),
        CREATED_BY: 'SYSTEM' // TODO: Get from auth context
      };

      this.dataSource.push(newRecord);
      return newRecord;
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  /**
   * Update an existing record
   * @param {String|Number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Object} Updated record or null if not found
   */
  async update(id, data) {
    try {
      const index = this.dataSource.findIndex(item => {
        const itemId = item[this.getIdField()];
        return itemId === id || itemId === parseInt(id) || String(itemId) === String(id);
      });

      if (index === -1) {
        return null;
      }

      // Validate data
      this.validate(data, true);

      const updatedRecord = {
        ...this.dataSource[index],
        ...data,
        UPDATED_DATE: new Date().toISOString(),
        UPDATED_BY: 'SYSTEM' // TODO: Get from auth context
      };

      this.dataSource[index] = updatedRecord;
      return updatedRecord;
    } catch (error) {
      throw this.handleError(error, 'update');
    }
  }

  /**
   * Delete a record
   * @param {String|Number} id - Record ID
   * @returns {Boolean} Success status (true if deleted, false if not found)
   */
  async delete(id) {
    try {
      const index = this.dataSource.findIndex(item => {
        const itemId = item[this.getIdField()];
        return itemId === id || itemId === parseInt(id) || String(itemId) === String(id);
      });

      if (index === -1) {
        return false;
      }

      this.dataSource.splice(index, 1);
      return true;
    } catch (error) {
      throw this.handleError(error, 'delete');
    }
  }

  /**
   * Apply filters to data array
   * @param {Array} data - Data array
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered data
   */
  applyFilters(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.keys(filters).every(key => {
        const filterValue = filters[key];
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return true;
        }

        const itemValue = item[key];

        // Exact match for non-string values
        if (typeof itemValue !== 'string') {
          return itemValue === filterValue;
        }

        // For strings, check if it's a search query (contains) or exact match
        // If filter value contains wildcards or is lowercase, use contains
        // Otherwise use exact match
        if (typeof filterValue === 'string') {
          return itemValue === filterValue;
        }

        return itemValue === filterValue;
      });
    });
  }

  /**
   * Generate new ID for record
   * @returns {String|Number} New ID
   */
  generateId() {
    const idField = this.getIdField();

    if (this.dataSource.length === 0) {
      // Try to infer ID format from field name
      // e.g., TEST_ID -> T001, PROPERTY_ID -> 1
      const match = idField.match(/^([A-Z]+)_ID$/);
      if (match) {
        const prefix = match[1].charAt(0); // First letter of prefix
        return `${prefix}001`;
      }
      return 1;
    }

    const ids = this.dataSource.map(item => item[idField]);

    // Check if IDs are numeric
    const numericIds = ids.filter(id => typeof id === 'number' || !isNaN(parseInt(id)));
    if (numericIds.length === ids.length && typeof ids[0] === 'number') {
      const maxId = Math.max(...ids.map(id => typeof id === 'number' ? id : parseInt(id)));
      return maxId + 1;
    }

    // For string IDs with pattern like 'T001', extract prefix and number
    const stringIds = ids.filter(id => typeof id === 'string');
    if (stringIds.length > 0) {
      const match = stringIds[0].match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numbers = stringIds.map(id => {
          const m = id.match(/^[A-Z]+(\d+)$/);
          return m ? parseInt(m[1]) : 0;
        });
        const maxNum = Math.max(...numbers);
        const nextNum = String(maxNum + 1).padStart(match[2].length, '0');
        return `${prefix}${nextNum}`;
      }
    }

    // Fallback: return next number
    return ids.length + 1;
  }

  /**
   * Get the ID field name for this entity
   * Must be overridden by child classes
   * @returns {String} ID field name
   */
  getIdField() {
    throw new Error('getIdField() must be implemented by child class');
  }

  /**
   * Validate record data
   * Can be overridden by child classes for custom validation
   * @param {Object} data - Data to validate
   * @param {Boolean} isUpdate - Whether this is an update operation
   */
  validate(data, isUpdate = false) {
    // Base validation - can be overridden
    if (!isUpdate && !data) {
      throw new Error('Data is required');
    }
  }

  /**
   * Handle errors consistently
   * @param {Error} error - Error object
   * @param {String} operation - Operation name
   * @throws {Error} Formatted error
   */
  handleError(error, operation) {
    console.error(`Error in ${this.constructor.name}.${operation}:`, error);
    throw error;
  }

  /**
   * Enrich record with related data
   * Can be overridden by child classes
   * @param {Object} record - Record to enrich
   * @returns {Object} Enriched record
   */
  async enrich(record) {
    return record;
  }

  /**
   * Enrich multiple records
   * @param {Array} records - Records to enrich
   * @returns {Array} Enriched records
   */
  async enrichMany(records) {
    return Promise.all(records.map(record => this.enrich(record)));
  }

  /**
   * Calculate statistics
   * Can be overridden by child classes
   * @returns {Object} Statistics object
   */
  async getStatistics() {
    return {};
  }
}

module.exports = BaseService;

