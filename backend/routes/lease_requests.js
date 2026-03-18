/**
 * Lease Requests API - Customer requests for space, Admin approval
 */
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getUserDisplayName } = require('../data/userLookup');

let LEASE_REQUESTS = [];
function nextLrId() {
  return 'LR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

router.get('/', verifyToken, async (req, res) => {
  try {
    let list = [...LEASE_REQUESTS];
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'MANAGER');
    if (!isAdmin && req.user) {
      const uid = req.user.user_id;
      list = list.filter(lr => String(lr.requested_by_user_id) === String(uid));
    }
    list.sort((a, b) => new Date(b.created_date || b.createdDate) - new Date(a.created_date || a.createdDate));
    const enriched = await Promise.all(list.map(async (lr) => {
      const fromLookup = (lr.requested_by_user_id != null && lr.requested_by_user_id !== '')
        ? await getUserDisplayName(lr.requested_by_user_id)
        : null;
      const displayName = lr.requested_by_name || lr.requested_by_username || fromLookup
        || (lr.requested_by_user_id != null && lr.requested_by_user_id !== '' ? 'User #' + lr.requested_by_user_id : null);
      return { ...lr, requested_by_display_name: displayName };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  try {
    const lr = LEASE_REQUESTS.find(l => l.lease_request_id === req.params.id || l.request_number === req.params.id);
    if (!lr) return res.status(404).json({ success: false, error: 'Lease request not found' });
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'MANAGER');
    if (!isAdmin && req.user && String(lr.requested_by_user_id) !== String(req.user.user_id)) {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }
    res.json({ success: true, data: lr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', verifyToken, (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ success: false, error: 'Login required' });

    const request_number = body.request_number || nextLrId();
    const request_type = body.request_type || body.requestType || 'LEASE'; // LEASE | RENT | ROOMS
    const record = {
      lease_request_id: nextLrId(),
      request_number,
      requested_by_user_id: userId,
      requested_by_username: req.user?.username || null,
      requested_by_name: req.user?.full_name || req.user?.username || null,
      property_id: body.property_id,
      floor_id: body.floor_id || null,
      space_ids: Array.isArray(body.space_ids) ? body.space_ids.join(',') : (body.space_ids || ''),
      selection_type: body.selection_type || 'UNITS',
      requested_area_sqm: body.requested_area_sqm != null ? Number(body.requested_area_sqm) : null,
      unit_type_preference: body.unit_type_preference || null,
      notes: body.notes || null,
      request_type,
      lease_type: body.lease_type || body.leaseType || null,
      preferred_start_date: body.preferred_start_date || body.preferredStartDate || null,
      preferred_end_date: body.preferred_end_date || body.preferredEndDate || null,
      term_months: body.term_months != null ? Number(body.term_months) : null,
      budget_or_rent_notes: body.budget_or_rent_notes || body.budgetOrRentNotes || null,
      contact_phone: body.contact_phone || body.contactPhone || null,
      contact_email: body.contact_email || body.contactEmail || null,
      room_request_type: body.room_request_type || body.roomRequestType || null,
      room_date_from: body.room_date_from || body.roomDateFrom || null,
      room_date_to: body.room_date_to || body.roomDateTo || null,
      duration_hours: body.duration_hours != null ? Number(body.duration_hours) : null,
      capacity: body.capacity != null ? Number(body.capacity) : null,
      amenities_required: body.amenities_required || body.amenitiesRequired || null,
      room_notes: body.room_notes || body.roomNotes || null,
      status: 'PENDING',
      selection_details: body.selection_details || null,
      created_date: new Date().toISOString(),
      last_updated_date: new Date().toISOString()
    };
    LEASE_REQUESTS.push(record);
    res.status(201).json({ success: true, data: record, message: 'Lease request submitted for admin approval' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/approve', verifyToken, requireRole('ADMIN', 'MANAGER'), (req, res) => {
  try {
    const lr = LEASE_REQUESTS.find(l => l.lease_request_id === req.params.id || l.request_number === req.params.id);
    if (!lr) return res.status(404).json({ success: false, error: 'Lease request not found' });
    lr.status = 'APPROVED';
    lr.approved_by = req.user?.username;
    lr.approved_date = new Date().toISOString();
    lr.rejection_reason = null;
    lr.last_updated_date = new Date().toISOString();
    res.json({ success: true, data: lr, message: 'Request approved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/reject', verifyToken, requireRole('ADMIN', 'MANAGER'), (req, res) => {
  try {
    const lr = LEASE_REQUESTS.find(l => l.lease_request_id === req.params.id || l.request_number === req.params.id);
    if (!lr) return res.status(404).json({ success: false, error: 'Lease request not found' });
    lr.status = 'REJECTED';
    lr.approved_by = null;
    lr.approved_date = null;
    lr.rejection_reason = (req.body || {}).reason || 'Rejected by admin';
    lr.last_updated_date = new Date().toISOString();
    res.json({ success: true, data: lr, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
