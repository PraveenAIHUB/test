const BaseService = require('./BaseService');

/**
 * AssetService
 * Business logic for Asset management
 */
class AssetService extends BaseService {
  constructor(assetData, propertyData, workOrderData) {
    super(assetData);
    this.propertyData = propertyData || [];
    this.workOrderData = workOrderData || [];
  }

  /**
   * Get the ID field name for assets
   */
  getIdField() {
    return 'ASSET_ID';
  }

  /**
   * Validate asset data
   */
  validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      if (!data.ASSET_NAME) errors.push('Asset name is required');
      if (!data.ASSET_CODE) errors.push('Asset code is required');
      if (!data.CATEGORY) errors.push('Category is required');
      if (!data.PROPERTY_ID) errors.push('Property ID is required');
    }

    // Validate category
    const validCategories = ['HVAC', 'ELEVATOR', 'GENERATOR', 'FIRE_SAFETY', 'PLUMBING', 'ELECTRICAL', 'SECURITY', 'OTHER'];
    if (data.CATEGORY && !validCategories.includes(data.CATEGORY)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'];
    if (data.STATUS && !validStatuses.includes(data.STATUS)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate numeric fields
    if (data.PURCHASE_COST && (isNaN(data.PURCHASE_COST) || data.PURCHASE_COST < 0)) {
      errors.push('Purchase cost must be a non-negative number');
    }

    if (data.USEFUL_LIFE_YEARS && (isNaN(data.USEFUL_LIFE_YEARS) || data.USEFUL_LIFE_YEARS <= 0)) {
      errors.push('Useful life must be a positive number');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }

  /**
   * Enrich asset with related data
   */
  async enrich(asset) {
    // Get property data
    const property = this.propertyData.find(p => p.PROPERTY_ID === asset.PROPERTY_ID);

    // Get work orders for this asset
    const assetWorkOrders = this.workOrderData.filter(wo => wo.ASSET_ID === asset.ASSET_ID);
    const openWorkOrders = assetWorkOrders.filter(wo => wo.STATUS === 'OPEN' || wo.STATUS === 'IN_PROGRESS');

    // Calculate days since last maintenance
    let daysSinceLastMaintenance = null;
    if (asset.LAST_MAINTENANCE_DATE) {
      const lastMaintenance = new Date(asset.LAST_MAINTENANCE_DATE);
      const today = new Date();
      daysSinceLastMaintenance = Math.floor((today - lastMaintenance) / (1000 * 60 * 60 * 24));
    }

    // Calculate days until next maintenance
    let daysUntilNextMaintenance = null;
    if (asset.NEXT_MAINTENANCE_DATE) {
      const nextMaintenance = new Date(asset.NEXT_MAINTENANCE_DATE);
      const today = new Date();
      daysUntilNextMaintenance = Math.floor((nextMaintenance - today) / (1000 * 60 * 60 * 24));
    }

    // Calculate depreciation
    let currentValue = asset.PURCHASE_COST || 0;
    let depreciationRate = 0;
    if (asset.PURCHASE_COST && asset.USEFUL_LIFE_YEARS && asset.PURCHASE_DATE) {
      const purchaseDate = new Date(asset.PURCHASE_DATE);
      const today = new Date();
      const yearsElapsed = (today - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      depreciationRate = Math.min(yearsElapsed / asset.USEFUL_LIFE_YEARS, 1);
      currentValue = asset.PURCHASE_COST * (1 - depreciationRate);
    }

    return {
      ...asset,
      PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
      PROPERTY_CODE: property ? property.PROPERTY_CODE : null,
      WORK_ORDER_COUNT: assetWorkOrders.length,
      OPEN_WORK_ORDER_COUNT: openWorkOrders.length,
      DAYS_SINCE_LAST_MAINTENANCE: daysSinceLastMaintenance,
      DAYS_UNTIL_NEXT_MAINTENANCE: daysUntilNextMaintenance,
      CURRENT_VALUE: Math.round(currentValue),
      DEPRECIATION_RATE: parseFloat((depreciationRate * 100).toFixed(1))
    };
  }

  /**
   * Get statistics for assets
   */
  async getStatistics() {
    const assets = this.dataSource;

    const total = assets.length;
    const operational = assets.filter(a => a.STATUS === 'OPERATIONAL').length;
    const underMaintenance = assets.filter(a => a.STATUS === 'UNDER_MAINTENANCE').length;
    const outOfService = assets.filter(a => a.STATUS === 'OUT_OF_SERVICE').length;

    // Calculate total value
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.PURCHASE_COST || 0), 0);

    // Assets by category
    const byCategory = assets.reduce((acc, a) => {
      const category = a.CATEGORY || 'UNKNOWN';
      if (!acc[category]) acc[category] = 0;
      acc[category]++;
      return acc;
    }, {});

    // Enrich assets for additional stats
    const enrichedAssets = await this.enrichMany(assets);

    // Calculate total current value (after depreciation)
    const totalCurrentValue = enrichedAssets.reduce((sum, a) => sum + (a.CURRENT_VALUE || 0), 0);

    // Get assets needing maintenance soon (within 30 days)
    const maintenanceDueSoon = enrichedAssets.filter(a => 
      a.DAYS_UNTIL_NEXT_MAINTENANCE !== null && 
      a.DAYS_UNTIL_NEXT_MAINTENANCE >= 0 && 
      a.DAYS_UNTIL_NEXT_MAINTENANCE <= 30
    ).length;

    return {
      total,
      operational,
      underMaintenance,
      outOfService,
      totalPurchaseValue,
      totalCurrentValue,
      byCategory,
      maintenanceDueSoon
    };
  }
}

module.exports = AssetService;

