const BaseService = require('./BaseService');

/**
 * WorkOrderService
 * Business logic for Work Order management
 */
class WorkOrderService extends BaseService {
  constructor(workOrderData, propertyData, assetData, vendorData) {
    super(workOrderData);
    this.propertyData = propertyData || [];
    this.assetData = assetData || [];
    this.vendorData = vendorData || [];
  }

  /**
   * Get the ID field name for work orders
   */
  getIdField() {
    return 'WORK_ORDER_ID';
  }

  /**
   * Validate work order data
   */
  validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      if (!data.WORK_ORDER_CODE) errors.push('Work order code is required');
      if (!data.TITLE) errors.push('Title is required');
      if (!data.PROPERTY_ID) errors.push('Property ID is required');
      if (!data.TYPE) errors.push('Type is required');
      if (!data.PRIORITY) errors.push('Priority is required');
    }

    // Validate type
    const validTypes = ['CORRECTIVE', 'PREVENTIVE', 'EMERGENCY', 'INSPECTION', 'PROJECT'];
    if (data.TYPE && !validTypes.includes(data.TYPE)) {
      errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (data.PRIORITY && !validPriorities.includes(data.PRIORITY)) {
      errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (data.STATUS && !validStatuses.includes(data.STATUS)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate numeric fields
    if (data.ESTIMATED_COST && (isNaN(data.ESTIMATED_COST) || data.ESTIMATED_COST < 0)) {
      errors.push('Estimated cost must be a non-negative number');
    }

    if (data.ACTUAL_COST && (isNaN(data.ACTUAL_COST) || data.ACTUAL_COST < 0)) {
      errors.push('Actual cost must be a non-negative number');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }

  /**
   * Enrich work order with related data
   */
  async enrich(workOrder) {
    // Get property data
    const property = this.propertyData.find(p => p.PROPERTY_ID === workOrder.PROPERTY_ID);

    // Get asset data
    const asset = workOrder.ASSET_ID 
      ? this.assetData.find(a => a.ASSET_ID === workOrder.ASSET_ID)
      : null;

    // Get vendor data
    const vendor = workOrder.VENDOR_ID
      ? this.vendorData.find(v => v.VENDOR_ID === workOrder.VENDOR_ID)
      : null;

    // Calculate days open
    let daysOpen = null;
    if (workOrder.CREATED_DATE) {
      const createdDate = new Date(workOrder.CREATED_DATE);
      const endDate = workOrder.COMPLETED_DATE ? new Date(workOrder.COMPLETED_DATE) : new Date();
      daysOpen = Math.floor((endDate - createdDate) / (1000 * 60 * 60 * 24));
    }

    // Calculate days until due
    let daysUntilDue = null;
    if (workOrder.DUE_DATE && workOrder.STATUS !== 'COMPLETED' && workOrder.STATUS !== 'CANCELLED') {
      const dueDate = new Date(workOrder.DUE_DATE);
      const today = new Date();
      daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    }

    // Determine if overdue
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

    return {
      ...workOrder,
      PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
      PROPERTY_CODE: property ? property.PROPERTY_CODE : null,
      ASSET_NAME: asset ? asset.ASSET_NAME : null,
      ASSET_CODE: asset ? asset.ASSET_CODE : null,
      VENDOR_NAME: vendor ? vendor.VENDOR_NAME : null,
      DAYS_OPEN: daysOpen,
      DAYS_UNTIL_DUE: daysUntilDue,
      IS_OVERDUE: isOverdue
    };
  }

  /**
   * Get statistics for work orders
   */
  async getStatistics() {
    const workOrders = this.dataSource;

    const total = workOrders.length;
    const open = workOrders.filter(wo => wo.STATUS === 'OPEN').length;
    const inProgress = workOrders.filter(wo => wo.STATUS === 'IN_PROGRESS').length;
    const completed = workOrders.filter(wo => wo.STATUS === 'COMPLETED').length;
    const cancelled = workOrders.filter(wo => wo.STATUS === 'CANCELLED').length;

    // Work orders by type
    const byType = workOrders.reduce((acc, wo) => {
      const type = wo.TYPE || 'UNKNOWN';
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});

    // Work orders by priority
    const byPriority = workOrders.reduce((acc, wo) => {
      const priority = wo.PRIORITY || 'UNKNOWN';
      if (!acc[priority]) acc[priority] = 0;
      acc[priority]++;
      return acc;
    }, {});

    // Enrich work orders for additional stats
    const enrichedWorkOrders = await this.enrichMany(workOrders);

    // Calculate average resolution time (for completed work orders)
    const completedWorkOrders = enrichedWorkOrders.filter(wo => wo.STATUS === 'COMPLETED' && wo.DAYS_OPEN !== null);
    const avgResolutionTime = completedWorkOrders.length > 0
      ? completedWorkOrders.reduce((sum, wo) => sum + wo.DAYS_OPEN, 0) / completedWorkOrders.length
      : 0;

    // Get overdue work orders
    const overdue = enrichedWorkOrders.filter(wo => wo.IS_OVERDUE).length;

    return {
      total,
      open,
      inProgress,
      completed,
      cancelled,
      overdue,
      byType,
      byPriority,
      avgResolutionTime: parseFloat(avgResolutionTime.toFixed(1))
    };
  }
}

module.exports = WorkOrderService;

