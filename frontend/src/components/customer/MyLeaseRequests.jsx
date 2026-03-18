import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const API = API_URL;

function RequestDetailsBlock({ lr, getPropertyName }) {
  const isRoom = lr.request_type === 'ROOMS';
  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 20px', fontSize: '13px', marginTop: '8px' }}>
      <div><strong>Request type</strong><br />{lr.request_type || 'LEASE'}</div>
      <div><strong>Property</strong><br />{getPropertyName(lr.property_id)}</div>
      <div><strong>Created</strong><br />{fmt(lr.created_date)}</div>
      {!isRoom && (
        <>
          <div><strong>Lease type</strong><br />{lr.lease_type || '—'}</div>
          <div><strong>Start date</strong><br />{fmt(lr.preferred_start_date)}</div>
          <div><strong>End date</strong><br />{fmt(lr.preferred_end_date)}</div>
          <div><strong>Term (months)</strong><br />{lr.term_months ?? '—'}</div>
          <div><strong>Budget notes</strong><br />{lr.budget_or_rent_notes || '—'}</div>
        </>
      )}
      {isRoom && (
        <>
          <div><strong>Room type</strong><br />{lr.room_request_type || '—'}</div>
          <div><strong>From</strong><br />{fmt(lr.room_date_from)}</div>
          <div><strong>To</strong><br />{fmt(lr.room_date_to)}</div>
          <div><strong>Duration (hrs)</strong><br />{lr.duration_hours ?? '—'}</div>
          <div><strong>Capacity</strong><br />{lr.capacity ?? '—'}</div>
          <div><strong>Amenities</strong><br />{lr.amenities_required || '—'}</div>
        </>
      )}
      <div style={{ gridColumn: '1 / -1' }}><strong>Notes</strong><br />{lr.notes || '—'}</div>
      {lr.rejection_reason && <div style={{ gridColumn: '1 / -1', color: 'var(--red-600)' }}><strong>Rejection reason</strong><br />{lr.rejection_reason}</div>}
    </div>
  );
}

export default function MyLeaseRequests() {
  const [list, setList] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsId, setDetailsId] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(API + '/lease-requests'),
      axios.get(API + '/properties').catch(() => ({ data: { data: [] } }))
    ]).then(([lrRes, propRes]) => {
      setList(Array.isArray(lrRes.data?.data) ? lrRes.data.data : []);
      setProperties(Array.isArray(propRes.data?.data) ? propRes.data.data : (Array.isArray(propRes.data) ? propRes.data : []));
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const getPropertyName = (propertyId) => {
    if (!propertyId) return '—';
    const p = properties.find(pr => String(pr.PROPERTY_ID ?? pr.property_id) === String(propertyId));
    return p ? (p.PROPERTY_NAME ?? p.property_name) : propertyId;
  };

  if (loading) return <div className="rw-loading"><div className="rw-spinner" /> Loading...</div>;

  return (
    <div className="rw-all-records-content">
      <div className="rw-section-header">
        <h2>My Lease Requests</h2>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '14px' }}>Track your commercial space requests</p>
      </div>
      {list.length === 0 ? (
        <div className="rw-card">
          <div className="rw-card-body" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--gray-600)' }}>No lease requests yet.</p>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Go to Select Space to choose units or request custom area and submit a lease/rent request.</p>
          </div>
        </div>
      ) : (
        <div className="rw-card">
          <div className="rw-card-body">
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Property name</th>
                  <th>Units / Area</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map(lr => (
                  <React.Fragment key={lr.lease_request_id || lr.request_number}>
                    <tr>
                      <td className="rw-code">{lr.request_number}</td>
                      <td>{getPropertyName(lr.property_id)}</td>
                      <td>
                        {lr.request_type === 'ROOMS' ? (lr.room_request_type || 'Room') : (lr.selection_type === 'CUSTOM_AREA' && lr.requested_area_sqm ? `Custom area: ${lr.requested_area_sqm} sqm` : (lr.space_ids ? lr.space_ids : (lr.requested_area_sqm ? lr.requested_area_sqm + ' sqm' : '—')))}
                      </td>
                      <td>
                        <span className={'rw-badge rw-badge-' + (lr.status === 'APPROVED' ? 'success' : lr.status === 'REJECTED' ? 'error' : 'warning')}>{lr.status}</span>
                        {lr.rejection_reason && <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px' }}>{lr.rejection_reason}</div>}
                      </td>
                      <td>
                        {lr.created_date ? new Date(lr.created_date).toLocaleDateString() : '—'}
                        <button type="button" className="rw-button rw-button-secondary" style={{ marginLeft: '8px', fontSize: '12px' }} onClick={() => setDetailsId(detailsId === (lr.lease_request_id || lr.request_number) ? null : (lr.lease_request_id || lr.request_number))}>
                          {detailsId === (lr.lease_request_id || lr.request_number) ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {detailsId === (lr.lease_request_id || lr.request_number) && (
                      <tr>
                        <td colSpan={5} style={{ padding: '12px 16px', background: 'var(--gray-50)', borderTop: 'none', verticalAlign: 'top' }}>
                          <RequestDetailsBlock lr={lr} getPropertyName={getPropertyName} />
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
