const express = require('express');
const router = express.Router();
const { DOCUMENTS, PROPERTIES, TENANTS, LEASES } = require('../data/kenyaProductionData');

// GET /api/documents/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDocuments = DOCUMENTS.length;
    const active = DOCUMENTS.filter(d => d.STATUS === 'ACTIVE').length;
    const expiringSoon = DOCUMENTS.filter(d => {
      if (!d.EXPIRY_DATE) return false;
      const expiryDate = new Date(d.EXPIRY_DATE);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    // Documents by category
    const categoryGroups = DOCUMENTS.reduce((acc, d) => {
      if (!acc[d.DOCUMENT_TYPE]) acc[d.DOCUMENT_TYPE] = 0;
      acc[d.DOCUMENT_TYPE]++;
      return acc;
    }, {});

    const documentsByCategory = Object.entries(categoryGroups).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / totalDocuments) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        kpis: { totalDocuments, active, expiringSoon },
        documentsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch document stats' });
  }
});

// GET /api/documents - Get all records
router.get('/', async (req, res) => {
  try {
    const { type, status, property_id, page = 1, limit = 20 } = req.query;

    let filteredDocuments = [...DOCUMENTS];

    if (type) {
      filteredDocuments = filteredDocuments.filter(d => d.DOCUMENT_TYPE === type);
    }
    if (status) {
      filteredDocuments = filteredDocuments.filter(d => d.STATUS === status);
    }
    if (property_id) {
      filteredDocuments = filteredDocuments.filter(d => d.PROPERTY_ID === property_id);
    }

    // Enrich with property and tenant data
    const enrichedDocuments = filteredDocuments.map(doc => {
      const property = doc.PROPERTY_ID ? PROPERTIES.find(p => p.PROPERTY_ID === doc.PROPERTY_ID) : null;
      const tenant = doc.TENANT_ID ? TENANTS.find(t => t.TENANT_ID === doc.TENANT_ID) : null;

      return {
        ...doc,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null
      };
    });

    // Pagination
    const total = enrichedDocuments.length;
    const offset = (page - 1) * limit;
    const paginatedDocuments = enrichedDocuments.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedDocuments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = DOCUMENTS.find(d => d.DOCUMENT_ID === req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const property = document.PROPERTY_ID ? PROPERTIES.find(p => p.PROPERTY_ID === document.PROPERTY_ID) : null;
    const tenant = document.TENANT_ID ? TENANTS.find(t => t.TENANT_ID === document.TENANT_ID) : null;
    const lease = document.LEASE_ID ? LEASES.find(l => l.LEASE_ID === document.LEASE_ID) : null;

    res.json({
      success: true,
      data: {
        ...document,
        PROPERTY_NAME: property ? property.PROPERTY_NAME : null,
        TENANT_NAME: tenant ? tenant.TENANT_NAME : null,
        LEASE_CODE: lease ? lease.LEASE_CODE : null
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch document' });
  }
});

module.exports = router;
