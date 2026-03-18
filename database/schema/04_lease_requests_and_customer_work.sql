-- Lease requests (customer requests for space → admin approval) and customer work requests
-- Run after 02_property_hierarchy.sql

-- ============================================
-- LEASE REQUESTS (Customer requests unit(s) → Admin approves → becomes lease)
-- ============================================
CREATE TABLE lease_requests (
    lease_request_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_number VARCHAR2(50) UNIQUE NOT NULL,
    requested_by_user_id NUMBER NOT NULL,
    property_id NUMBER NOT NULL,
    floor_id NUMBER,
    -- Selection: comma-separated space_ids, or JSON for area selection
    space_ids VARCHAR2(1000),
    selection_type VARCHAR2(20) DEFAULT 'UNITS' CHECK (selection_type IN ('UNITS', 'AREA')),
    requested_area_sqm NUMBER(12,2),
    unit_type_preference VARCHAR2(100),
    notes CLOB,
    status VARCHAR2(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
    approved_by VARCHAR2(100),
    approved_date DATE,
    rejection_reason VARCHAR2(500),
    lease_id NUMBER,
    created_date DATE DEFAULT SYSDATE,
    last_updated_date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_lr_user FOREIGN KEY (requested_by_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_lr_property FOREIGN KEY (property_id) REFERENCES properties(property_id),
    CONSTRAINT fk_lr_floor FOREIGN KEY (floor_id) REFERENCES floors(floor_id),
    CONSTRAINT fk_lr_lease FOREIGN KEY (lease_id) REFERENCES leases(lease_id)
);
CREATE INDEX idx_lease_request_user ON lease_requests(requested_by_user_id);
CREATE INDEX idx_lease_request_property ON lease_requests(property_id);
CREATE INDEX idx_lease_request_status ON lease_requests(status);

-- ============================================
-- EXTEND WORK_ORDERS (customer-originated requests: requested_by_user_id, space_id, floor_id)
-- ============================================
ALTER TABLE work_orders ADD (requested_by_user_id NUMBER REFERENCES users(user_id));
ALTER TABLE work_orders ADD (space_id NUMBER REFERENCES spaces(space_id));
ALTER TABLE work_orders ADD (floor_id NUMBER REFERENCES floors(floor_id));
CREATE INDEX idx_wo_requested_by ON work_orders(requested_by_user_id);
CREATE INDEX idx_wo_space ON work_orders(space_id);

-- ============================================
-- EXTEND SPACES (unit_type for office, retail, meeting space)
-- ============================================
-- space_type already exists (OFFICE, RETAIL, etc.). Add MEETING_SPACE to check if needed:
-- ALTER TABLE spaces DROP CONSTRAINT ... ; ALTER TABLE spaces ADD CONSTRAINT ... CHECK (space_type IN ('OFFICE', 'RETAIL', 'WAREHOUSE', 'PARKING', 'COMMON_AREA', 'MEETING_SPACE'));
-- Or use existing space_type; application can use OFFICE, RETAIL, MEETING_SPACE as unit types.

COMMENT ON TABLE lease_requests IS 'Customer requests for commercial space; admin approves to create lease';
