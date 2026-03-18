import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import FloorPlanViewer from '../space/FloorPlanViewer';

const API = API_URL;

function RequestDetails({ lr, getPropertyName, getRequesterName, floors }) {
  const isRoom = lr.request_type === 'ROOMS';
  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const selectionDetails = lr.selection_details;
  const hasSelectionOverlay = !isRoom && selectionDetails?.floorId && Array.isArray(selectionDetails.selections) && selectionDetails.selections.length > 0;
  const [floorPlanLayout, setFloorPlanLayout] = useState(null);
  const [floorPlanLoading, setFloorPlanLoading] = useState(false);

  useEffect(() => {
    if (!hasSelectionOverlay || !lr.property_id) {
      setFloorPlanLayout(null);
      return;
    }
    const floor = (floors || []).find(
      (f) => String(f.FLOOR_ID ?? f.floor_id) === String(lr.floor_id)
    );
    const floorNumber = floor != null ? (floor.FLOOR_NUMBER ?? floor.floor_number) : null;
    if (floorNumber == null) {
      setFloorPlanLayout(null);
      return;
    }
    setFloorPlanLoading(true);
    axios
      .get(`${API}/floors/floor-plan`, { params: { property_id: lr.property_id, floor_number: floorNumber } })
      .then((r) => setFloorPlanLayout(r.data?.data || null))
      .catch(() => setFloorPlanLayout(null))
      .finally(() => setFloorPlanLoading(false));
  }, [hasSelectionOverlay, lr.property_id, lr.floor_id, floors]);

  const selectionOverlay = hasSelectionOverlay
    ? selectionDetails.selections.map((s) => ({
        id: s.id,
        selectionMode: s.selectionMode || (s.coordinates ? 'partial' : 'full'),
        coordinates: s.coordinates || undefined
      }))
    : [];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: '14px' }}>
        <div><strong>Request #</strong><br />{lr.request_number}</div>
        <div><strong>Request type</strong><br />{lr.request_type || 'LEASE'}</div>
        <div><strong>Requested by</strong><br />{getRequesterName(lr)}</div>
        <div><strong>Property</strong><br />{getPropertyName(lr.property_id)}</div>
        <div><strong>Status</strong><br />{lr.status}</div>
        <div><strong>Created</strong><br />{fmt(lr.created_date)}</div>
        {!isRoom && (
          <>
            <div><strong>Lease type</strong><br />{lr.lease_type || '—'}</div>
            <div><strong>Preferred start</strong><br />{fmt(lr.preferred_start_date)}</div>
            <div><strong>Preferred end</strong><br />{fmt(lr.preferred_end_date)}</div>
            <div><strong>Term (months)</strong><br />{lr.term_months ?? '—'}</div>
            <div><strong>Units / Area</strong><br />{lr.space_ids || (lr.requested_area_sqm ? lr.requested_area_sqm + ' sqm' : '—')}</div>
            <div><strong>Budget / rent notes</strong><br />{lr.budget_or_rent_notes || '—'}</div>
          </>
        )}
        {isRoom && (
          <>
            <div><strong>Room type</strong><br />{lr.room_request_type || '—'}</div>
            <div><strong>Date from</strong><br />{fmt(lr.room_date_from)}</div>
            <div><strong>Date to</strong><br />{fmt(lr.room_date_to)}</div>
            <div><strong>Duration (hours)</strong><br />{lr.duration_hours ?? '—'}</div>
            <div><strong>Capacity</strong><br />{lr.capacity ?? '—'}</div>
            <div><strong>Amenities</strong><br />{lr.amenities_required || '—'}</div>
            <div><strong>Room notes</strong><br />{lr.room_notes || '—'}</div>
          </>
        )}
        <div style={{ gridColumn: '1 / -1' }}><strong>Contact</strong><br />{[lr.contact_phone, lr.contact_email].filter(Boolean).join(' · ') || '—'}</div>
        <div style={{ gridColumn: '1 / -1' }}><strong>Notes</strong><br />{lr.notes || '—'}</div>
        {lr.rejection_reason && <div style={{ gridColumn: '1 / -1', color: 'var(--red-600)' }}><strong>Rejection reason</strong><br />{lr.rejection_reason}</div>}
      </div>
      {hasSelectionOverlay && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Customer selection on floor plan</h4>
          {floorPlanLoading ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Loading floor plan…</p>
          ) : floorPlanLayout?.layout?.length > 0 ? (
            <FloorPlanViewer
              layout={floorPlanLayout}
              mode="admin"
              selectionOverlay={selectionOverlay}
              width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 120 : 800)}
              height={450}
            />
          ) : (
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Floor plan not available for this floor.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeaseRequestManagement() {
  const [list, setList] = useState([]);
  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsId, setDetailsId] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(API + '/lease-requests'),
      axios.get(API + '/properties').catch(() => ({ data: { data: [] } })),
      axios.get(API + '/floors').catch(() => ({ data: { data: [] } })),
      axios.get(API + '/auth/users').catch(() => ({ data: { data: [] } }))
    ]).then(([lrRes, propRes, floorsRes, usersRes]) => {
      setList(Array.isArray(lrRes.data?.data) ? lrRes.data.data : []);
      setProperties(Array.isArray(propRes.data?.data) ? propRes.data.data : (Array.isArray(propRes.data) ? propRes.data : []));
      setFloors(Array.isArray(floorsRes.data?.data) ? floorsRes.data.data : (Array.isArray(floorsRes.data) ? floorsRes.data : []));
      setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const getPropertyName = (propertyId) => {
    if (!propertyId) return '—';
    const p = properties.find(pr => String(pr.PROPERTY_ID ?? pr.property_id) === String(propertyId));
    return p ? (p.PROPERTY_NAME ?? p.property_name) : propertyId;
  };
  const getRequesterName = (lr) => {
    const name = lr.requested_by_display_name || lr.requested_by_name || lr.requested_by_username;
    if (name) return name;
    const uid = lr.requested_by_user_id;
    if (uid != null && uid !== '') {
      const u = users.find(us => String(us.user_id ?? us.USER_ID) === String(uid));
      if (u) return u.full_name ?? u.FULL_NAME ?? u.username ?? u.USERNAME;
      return 'User #' + uid;
    }
    return '—';
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(API + '/lease-requests/' + id + '/approve');
      setList(prev => prev.map(lr => (lr.lease_request_id === id || lr.request_number === id) ? { ...lr, status: 'APPROVED' } : lr));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Rejected by admin';
    try {
      await axios.patch(API + '/lease-requests/' + id + '/reject', { reason });
      setList(prev => prev.map(lr => (lr.lease_request_id === id || lr.request_number === id) ? { ...lr, status: 'REJECTED', rejection_reason: reason } : lr));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to reject');
    }
  };

  if (loading) return <div className="rw-loading"><div className="rw-spinner" /> Loading...</div>;

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>Lease Request Management</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>Approve or reject customer lease requests</p>
      </div>
      {list.length === 0 ? (
        <div className="rw-card">
          <div className="rw-card-body" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--gray-600)' }}>No lease requests.</p>
          </div>
        </div>
      ) : (
        <div className="rw-card">
          <div className="rw-card-body">
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Requested by</th>
                  <th>Property</th>
                  <th>Units / Area</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((lr) => (
                  <React.Fragment key={lr.lease_request_id || lr.request_number}>
                    <tr>
                      <td className="rw-code">{lr.request_number}</td>
                      <td>{getRequesterName(lr)}</td>
                      <td>{getPropertyName(lr.property_id)}</td>
                      <td>{lr.request_type === 'ROOMS' ? (lr.room_request_type || 'Room') : (lr.space_ids ? lr.space_ids : (lr.requested_area_sqm ? lr.requested_area_sqm + ' sqm' : '—'))}</td>
                      <td>
                        <span className={'rw-badge rw-badge-' + (lr.status === 'APPROVED' ? 'success' : lr.status === 'REJECTED' ? 'error' : 'warning')}>{lr.status}</span>
                      </td>
                      <td>{lr.created_date ? new Date(lr.created_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <button type="button" className="rw-button rw-button-secondary" style={{ marginRight: '8px', fontSize: '12px' }} onClick={() => setDetailsId(detailsId === (lr.lease_request_id || lr.request_number) ? null : (lr.lease_request_id || lr.request_number))}>
                          {detailsId === (lr.lease_request_id || lr.request_number) ? 'Hide details' : 'View details'}
                        </button>
                        {lr.status === 'PENDING' && (
                          <>
                            <button type="button" className="rw-button rw-button-primary" style={{ marginRight: '8px' }} onClick={() => handleApprove(lr.lease_request_id || lr.request_number)}>Approve</button>
                            <button type="button" className="rw-button rw-button-secondary" onClick={() => handleReject(lr.lease_request_id || lr.request_number)}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                    {detailsId === (lr.lease_request_id || lr.request_number) && (
                      <tr key={lr.lease_request_id + '-detail'}>
                        <td colSpan={7} style={{ padding: '16px', background: 'var(--gray-50)', borderTop: 'none', verticalAlign: 'top' }}>
                          <RequestDetails lr={lr} getPropertyName={getPropertyName} getRequesterName={getRequesterName} floors={floors} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
