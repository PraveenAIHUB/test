const express = require('express');
const router = express.Router();
const { COMPLIANCE, PROPERTIES } = require('../data/kenyaProductionData');
const ComplianceService = require('../services/ComplianceService');

// Initialize ComplianceService with production data
const complianceService = new ComplianceService(COMPLIANCE, PROPERTIES);

/**
 * GET /api/compliance/types
 * Get all available compliance types
 */
router.get('/types', async (req, res) => {
  try {
    const { category } = req.query;

    if (category) {
      const types = ComplianceService.getComplianceTypesByCategory(category);
      return res.json({ success: true, data: types });
    }

    const allTypes = ComplianceService.getAllComplianceTypes();
    res.json({ success: true, data: allTypes });
  } catch (error) {
    console.error('Error fetching compliance types:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance types' });
  }
});

/**
 * GET /api/compliance/stats
 * Get compliance statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await complianceService.getStatistics();
    const upcomingCompliance = await complianceService.getUpcomingCompliance(30);

    res.json({
      success: true,
      data: {
        kpis: {
          totalCompliance: stats.total,
          compliant: stats.completed,
          dueSoon: upcomingCompliance.length,
          overdue: stats.overdue
        },
        complianceByCategory: stats.byCategory,
        complianceByAuthority: stats.byAuthority,
        riskDistribution: stats.riskDistribution,
        completionRate: stats.completionRate
      }
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance stats' });
  }
});

/**
 * GET /api/compliance/overdue
 * Get overdue compliance records
 */
router.get('/overdue', async (req, res) => {
  try {
    const overdueCompliance = await complianceService.getOverdueCompliance();
    res.json({ success: true, data: overdueCompliance });
  } catch (error) {
    console.error('Error fetching overdue compliance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overdue compliance' });
  }
});

/**
 * GET /api/compliance/upcoming
 * Get upcoming compliance records
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const upcomingCompliance = await complianceService.getUpcomingCompliance(parseInt(days));
    res.json({ success: true, data: upcomingCompliance });
  } catch (error) {
    console.error('Error fetching upcoming compliance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming compliance' });
  }
});

/**
 * GET /api/compliance
 * Get all compliance records with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, category, property_id, page = 1, limit = 20 } = req.query;

    // Build filters
    const filters = {};
    if (type) filters.COMPLIANCE_TYPE = type;
    if (status) filters.STATUS = status;
    if (category) filters.COMPLIANCE_CATEGORY = category;
    if (property_id) filters.PROPERTY_ID = property_id;

    // Get compliance records using service
    const result = await complianceService.getAll(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance records' });
  }
});

/**
 * GET /api/compliance/:id
 * Get a single compliance record by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const compliance = await complianceService.getById(req.params.id);

    if (!compliance) {
      return res.status(404).json({ success: false, error: 'Compliance record not found' });
    }

    res.json({ success: true, data: compliance });
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance record' });
  }
});

/**
 * POST /api/compliance
 * Create a new compliance record
 */
router.post('/', async (req, res) => {
  try {
    const newCompliance = await complianceService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Compliance record created successfully',
      data: newCompliance
    });
  } catch (error) {
    console.error('Error creating compliance record:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create compliance record'
    });
  }
});

/**
 * POST /api/compliance/:id/complete
 * Mark a compliance record as completed
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const result = await complianceService.completeCompliance(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Compliance marked as completed',
      data: result
    });
  } catch (error) {
    console.error('Error completing compliance:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to complete compliance'
    });
  }
});

/**
 * PUT /api/compliance/:id
 * Update a compliance record
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedCompliance = await complianceService.update(req.params.id, req.body);

    if (!updatedCompliance) {
      return res.status(404).json({ success: false, error: 'Compliance record not found' });
    }

    res.json({
      success: true,
      message: 'Compliance record updated successfully',
      data: updatedCompliance
    });
  } catch (error) {
    console.error('Error updating compliance record:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update compliance record'
    });
  }
});

/**
 * DELETE /api/compliance/:id
 * Delete a compliance record
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await complianceService.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Compliance record not found' });
    }

    res.json({
      success: true,
      message: 'Compliance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete compliance record' });
  }
});

module.exports = router;
