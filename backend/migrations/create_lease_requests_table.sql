-- Lease / rent / room requests table (Oracle)
-- Run in SQL*Plus, SQL Developer, or any Oracle client.
-- Stores customer requests for space (lease/rent) or room bookings; admin approves or rejects.
-- No FK to properties: run this even if PROPERTIES does not exist yet. Add FK later if needed.

-- Create LEASE_REQUESTS table (Oracle uppercases unquoted identifiers)
CREATE TABLE lease_requests (
  lease_request_id     VARCHAR2(64)   NOT NULL PRIMARY KEY,
  request_number       VARCHAR2(64)   NOT NULL,
  requested_by_user_id VARCHAR2(32)   NOT NULL,
  requested_by_username VARCHAR2(128),
  requested_by_name   VARCHAR2(256),
  property_id         VARCHAR2(64)   NOT NULL,
  floor_id            VARCHAR2(64),
  space_ids           VARCHAR2(1000),
  selection_type      VARCHAR2(32)   DEFAULT 'UNITS',
  requested_area_sqm  NUMBER(12,2),
  unit_type_preference VARCHAR2(64),
  notes               CLOB,
  request_type        VARCHAR2(32)   DEFAULT 'LEASE',
  lease_type          VARCHAR2(64),
  preferred_start_date DATE,
  preferred_end_date   DATE,
  term_months         NUMBER(5,0),
  budget_or_rent_notes CLOB,
  contact_phone       VARCHAR2(64),
  contact_email       VARCHAR2(256),
  room_request_type   VARCHAR2(64),
  room_date_from      DATE,
  room_date_to        DATE,
  duration_hours      NUMBER(6,2),
  capacity            NUMBER(5,0),
  amenities_required  VARCHAR2(500),
  room_notes          CLOB,
  status              VARCHAR2(32)   DEFAULT 'PENDING',
  approved_by         VARCHAR2(128),
  approved_date       TIMESTAMP,
  rejection_reason    CLOB,
  created_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lease_requests_user ON lease_requests(requested_by_user_id);
CREATE INDEX idx_lease_requests_property ON lease_requests(property_id);
CREATE INDEX idx_lease_requests_status ON lease_requests(status);
CREATE INDEX idx_lease_requests_created ON lease_requests(created_date);

COMMENT ON TABLE lease_requests IS 'Customer lease/rent/room requests; request_type: LEASE, RENT, or ROOMS';
COMMENT ON COLUMN lease_requests.request_type IS 'LEASE, RENT, or ROOMS';
COMMENT ON COLUMN lease_requests.room_request_type IS 'MEETING_ROOM, CONFERENCE, etc. when request_type=ROOMS';

COMMIT;

-- Optional: add FK to properties (run only when PROPERTIES table exists in this schema):
-- ALTER TABLE lease_requests ADD CONSTRAINT fk_lease_req_property FOREIGN KEY (property_id) REFERENCES properties(property_id);
-- COMMIT;

-- If lease_requests table already exists, add new columns instead (run only the ones you need):
-- ALTER TABLE lease_requests ADD (request_type VARCHAR2(32) DEFAULT 'LEASE');
-- ALTER TABLE lease_requests ADD (lease_type VARCHAR2(64));
-- ALTER TABLE lease_requests ADD (preferred_start_date DATE);
-- ALTER TABLE lease_requests ADD (preferred_end_date DATE);
-- ALTER TABLE lease_requests ADD (term_months NUMBER(5,0));
-- ALTER TABLE lease_requests ADD (budget_or_rent_notes CLOB);
-- ALTER TABLE lease_requests ADD (contact_phone VARCHAR2(64));
-- ALTER TABLE lease_requests ADD (contact_email VARCHAR2(256));
-- ALTER TABLE lease_requests ADD (room_request_type VARCHAR2(64));
-- ALTER TABLE lease_requests ADD (room_date_from DATE);
-- ALTER TABLE lease_requests ADD (room_date_to DATE);
-- ALTER TABLE lease_requests ADD (duration_hours NUMBER(6,2));
-- ALTER TABLE lease_requests ADD (capacity NUMBER(5,0));
-- ALTER TABLE lease_requests ADD (amenities_required VARCHAR2(500));
-- ALTER TABLE lease_requests ADD (room_notes CLOB);
-- COMMIT;
