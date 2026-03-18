-- Sample Data for Property Pro Application
-- For Development and Testing

-- ============================================
-- PROPERTIES
-- ============================================

INSERT INTO properties (
    property_code, property_name, property_type, status,
    address_line1, city, state, country, postal_code,
    total_area, total_units, year_built, ownership_type,
    acquisition_date, acquisition_cost, current_value
) VALUES (
    'PROP-001', 'Downtown Plaza', 'COMMERCIAL', 'ACTIVE',
    '123 Main Street', 'New York', 'NY', 'USA', '10001',
    50000, 25, 2015, 'OWNED',
    TO_DATE('2015-06-15', 'YYYY-MM-DD'), 15000000, 18000000
);

INSERT INTO properties (
    property_code, property_name, property_type, status,
    address_line1, city, state, country, postal_code,
    total_area, total_units, year_built, ownership_type,
    acquisition_date, acquisition_cost, current_value
) VALUES (
    'PROP-002', 'Riverside Tower', 'COMMERCIAL', 'ACTIVE',
    '456 River Road', 'Chicago', 'IL', 'USA', '60601',
    75000, 40, 2018, 'OWNED',
    TO_DATE('2018-03-20', 'YYYY-MM-DD'), 25000000, 30000000
);

INSERT INTO properties (
    property_code, property_name, property_type, status,
    address_line1, city, state, country, postal_code,
    total_area, total_units, year_built, ownership_type,
    acquisition_date, acquisition_cost, current_value
) VALUES (
    'PROP-003', 'Tech Park Building A', 'INDUSTRIAL', 'ACTIVE',
    '789 Innovation Drive', 'San Francisco', 'CA', 'USA', '94102',
    100000, 15, 2020, 'LEASED',
    TO_DATE('2020-01-10', 'YYYY-MM-DD'), 35000000, 40000000
);

-- ============================================
-- TENANTS
-- ============================================

INSERT INTO tenants (
    tenant_code, tenant_name, tenant_type,
    contact_person, contact_email, contact_phone,
    business_registration_number, tax_id, status
) VALUES (
    'TEN-001', 'Acme Corporation', 'CORPORATE',
    'John Smith', 'john.smith@acme.com', '+1-555-0101',
    'BRN-123456', 'TAX-789012', 'ACTIVE'
);

INSERT INTO tenants (
    tenant_code, tenant_name, tenant_type,
    contact_person, contact_email, contact_phone,
    business_registration_number, tax_id, status
) VALUES (
    'TEN-002', 'Tech Solutions Inc', 'CORPORATE',
    'Jane Doe', 'jane.doe@techsolutions.com', '+1-555-0102',
    'BRN-234567', 'TAX-890123', 'ACTIVE'
);

INSERT INTO tenants (
    tenant_code, tenant_name, tenant_type,
    contact_person, contact_email, contact_phone,
    business_registration_number, tax_id, status
) VALUES (
    'TEN-003', 'Global Enterprises', 'CORPORATE',
    'Bob Johnson', 'bob.johnson@globalent.com', '+1-555-0103',
    'BRN-345678', 'TAX-901234', 'ACTIVE'
);

-- ============================================
-- LEASES
-- ============================================

INSERT INTO leases (
    lease_number, property_id, tenant_id, unit_number,
    lease_start_date, lease_end_date,
    base_rent, rent_amount, security_deposit, payment_frequency,
    lease_type, lease_category, status,
    escalation_rate, escalation_type, escalation_frequency
) VALUES (
    'LSE-20240101-1000', 1, 1, 'UNIT-101',
    TO_DATE('2024-01-01', 'YYYY-MM-DD'), TO_DATE('2026-12-31', 'YYYY-MM-DD'),
    15000, 15000, 45000, 'MONTHLY',
    'COMMERCIAL', 'GROSS', 'ACTIVE',
    3.5, 'FIXED', 'ANNUAL'
);

INSERT INTO leases (
    lease_number, property_id, tenant_id, unit_number,
    lease_start_date, lease_end_date,
    base_rent, rent_amount, security_deposit, payment_frequency,
    lease_type, lease_category, status,
    escalation_rate, escalation_type, escalation_frequency
) VALUES (
    'LSE-20240115-1001', 2, 2, 'UNIT-201',
    TO_DATE('2024-01-15', 'YYYY-MM-DD'), TO_DATE('2027-01-14', 'YYYY-MM-DD'),
    25000, 25000, 75000, 'MONTHLY',
    'OFFICE', 'GROSS', 'ACTIVE',
    4.0, 'FIXED', 'ANNUAL'
);

INSERT INTO leases (
    lease_number, property_id, tenant_id, unit_number,
    lease_start_date, lease_end_date,
    base_rent, rent_amount, security_deposit, payment_frequency,
    lease_type, lease_category, status,
    escalation_rate, escalation_type, escalation_frequency
) VALUES (
    'LSE-20240201-1002', 3, 3, 'UNIT-A1',
    TO_DATE('2024-02-01', 'YYYY-MM-DD'), TO_DATE('2029-01-31', 'YYYY-MM-DD'),
    50000, 50000, 150000, 'MONTHLY',
    'INDUSTRIAL', 'TRIPLE_NET', 'ACTIVE',
    3.0, 'FIXED', 'ANNUAL'
);

-- ============================================
-- VENDORS
-- ============================================

INSERT INTO vendors (
    vendor_code, vendor_name, vendor_type,
    contact_person, contact_email, contact_phone,
    address, status, rating
) VALUES (
    'VEN-001', 'ABC Maintenance Services', 'MAINTENANCE',
    'Mike Wilson', 'mike@abcmaint.com', '+1-555-0201',
    '100 Service Lane, New York, NY 10002', 'ACTIVE', 4.5
);

INSERT INTO vendors (
    vendor_code, vendor_name, vendor_type,
    contact_person, contact_email, contact_phone,
    address, status, rating
) VALUES (
    'VEN-002', 'XYZ HVAC Solutions', 'HVAC',
    'Sarah Brown', 'sarah@xyzhvac.com', '+1-555-0202',
    '200 Tech Street, Chicago, IL 60602', 'ACTIVE', 4.8
);

COMMIT;

