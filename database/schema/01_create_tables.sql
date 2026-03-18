-- Property Pro Database Schema
-- Oracle Database DDL Scripts
-- Version 1.0

-- ============================================
-- PROPERTIES MODULE
-- ============================================

-- Properties Table
CREATE TABLE properties (
    property_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_code VARCHAR2(50) UNIQUE NOT NULL,
    property_name VARCHAR2(200) NOT NULL,
    property_type VARCHAR2(50) CHECK (property_type IN ('COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE')),
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'SOLD')),
    
    -- Address Information
    address_line1 VARCHAR2(200) NOT NULL,
    address_line2 VARCHAR2(200),
    city VARCHAR2(100) NOT NULL,
    state VARCHAR2(100) NOT NULL,
    country VARCHAR2(100) NOT NULL,
    postal_code VARCHAR2(20) NOT NULL,
    
    -- Property Details
    total_area NUMBER(12,2),
    total_units NUMBER,
    year_built NUMBER(4),
    ownership_type VARCHAR2(50),
    
    -- Financial Information
    acquisition_date DATE,
    acquisition_cost NUMBER(15,2),
    current_value NUMBER(15,2),
    
    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE
);

-- ============================================
-- TENANTS MODULE
-- ============================================

CREATE TABLE tenants (
    tenant_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_code VARCHAR2(50) UNIQUE NOT NULL,
    tenant_name VARCHAR2(200) NOT NULL,
    tenant_type VARCHAR2(50) CHECK (tenant_type IN ('INDIVIDUAL', 'CORPORATE', 'GOVERNMENT')),
    
    -- Contact Information
    contact_person VARCHAR2(200),
    contact_email VARCHAR2(200),
    contact_phone VARCHAR2(50),
    
    -- Business Information
    business_registration_number VARCHAR2(100),
    tax_id VARCHAR2(100),
    
    -- Status
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
    
    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE
);

-- ============================================
-- LEASES MODULE
-- ============================================

CREATE SEQUENCE lease_seq START WITH 1000 INCREMENT BY 1;

CREATE TABLE leases (
    lease_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lease_number VARCHAR2(50) UNIQUE NOT NULL,
    property_id NUMBER NOT NULL,
    tenant_id NUMBER NOT NULL,
    space_id NUMBER,
    unit_number VARCHAR2(50),

    -- Lease Period
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    rent_commencement_date DATE,
    free_rent_period_months NUMBER(3),
    term_months NUMBER(4),

    -- Financial Terms - ENHANCED
    base_rent NUMBER(15,2) NOT NULL,
    cam_charges NUMBER(15,2) DEFAULT 0,
    service_charge NUMBER(15,2) DEFAULT 0,
    parking_fee NUMBER(15,2) DEFAULT 0,
    rent_amount NUMBER(15,2) NOT NULL, -- Total rent (base + CAM + service + parking)

    -- Security Deposit
    security_deposit NUMBER(15,2),
    security_deposit_type VARCHAR2(50) CHECK (security_deposit_type IN ('CASH', 'BANK_GUARANTEE', 'INSURANCE_BOND')),
    advance_rent_months NUMBER(2),

    -- Payment Terms
    payment_frequency VARCHAR2(50) CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')),
    payment_day NUMBER(2),

    -- Lease Details
    lease_type VARCHAR2(50) CHECK (lease_type IN ('COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'RETAIL', 'OFFICE')),
    lease_category VARCHAR2(50) CHECK (lease_category IN ('GROSS', 'NET', 'TRIPLE_NET', 'MODIFIED_GROSS')),
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED')),

    -- Parking
    parking_spaces_allocated NUMBER(3),

    -- Escalation - ENHANCED
    escalation_rate NUMBER(5,2),
    escalation_type VARCHAR2(50) CHECK (escalation_type IN ('FIXED', 'CPI_BASED', 'MARKET_BASED')),
    escalation_frequency VARCHAR2(50) CHECK (escalation_frequency IN ('ANNUAL', 'BIENNIAL', 'QUARTERLY')),
    next_escalation_date DATE,

    -- Lease Conditions
    renewal_option NUMBER(1) DEFAULT 0, -- Boolean: 0=No, 1=Yes
    renewal_notice_days NUMBER(3),
    notice_period_days NUMBER(3),
    sublease_allowed NUMBER(1) DEFAULT 0, -- Boolean: 0=No, 1=Yes
    assignment_allowed NUMBER(1) DEFAULT 0, -- Boolean: 0=No, 1=Yes
    utility_charges_included NUMBER(1) DEFAULT 0, -- Boolean: 0=No, 1=Yes

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,

    -- Foreign Keys
    CONSTRAINT fk_lease_property FOREIGN KEY (property_id) REFERENCES properties(property_id),
    CONSTRAINT fk_lease_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- Rent Schedule Table
CREATE TABLE rent_schedule (
    schedule_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lease_id NUMBER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMBER(15,2) NOT NULL,
    status VARCHAR2(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'WAIVED')),
    payment_date DATE,
    payment_reference VARCHAR2(100),
    
    -- Audit Fields
    created_date DATE DEFAULT SYSDATE,
    
    CONSTRAINT fk_rent_lease FOREIGN KEY (lease_id) REFERENCES leases(lease_id)
);

-- ============================================
-- ASSETS MODULE
-- ============================================

CREATE TABLE assets (
    asset_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    asset_code VARCHAR2(50) UNIQUE NOT NULL,
    asset_name VARCHAR2(200) NOT NULL,
    property_id NUMBER NOT NULL,
    asset_category VARCHAR2(100),
    asset_type VARCHAR2(100),
    
    -- Asset Details
    manufacturer VARCHAR2(200),
    model_number VARCHAR2(100),
    serial_number VARCHAR2(100),
    purchase_date DATE,
    purchase_cost NUMBER(15,2),
    warranty_expiry_date DATE,
    
    -- Status
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'RETIRED')),
    
    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,
    
    CONSTRAINT fk_asset_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

-- ============================================
-- WORK ORDERS MODULE
-- ============================================

CREATE SEQUENCE wo_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE work_orders (
    work_order_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_order_number VARCHAR2(50) UNIQUE NOT NULL,
    property_id NUMBER NOT NULL,
    asset_id NUMBER,

    -- Work Order Details
    title VARCHAR2(200) NOT NULL,
    description CLOB,
    work_order_type VARCHAR2(50) CHECK (work_order_type IN ('CORRECTIVE', 'PREVENTIVE', 'INSPECTION', 'PROJECT')),
    priority VARCHAR2(50) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- Assignment
    assigned_to VARCHAR2(100),
    vendor_id NUMBER,

    -- Dates
    reported_date DATE DEFAULT SYSDATE,
    scheduled_date DATE,
    completed_date DATE,

    -- Status
    status VARCHAR2(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),

    -- Cost
    estimated_cost NUMBER(15,2),
    actual_cost NUMBER(15,2),

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,

    CONSTRAINT fk_wo_property FOREIGN KEY (property_id) REFERENCES properties(property_id),
    CONSTRAINT fk_wo_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);

-- ============================================
-- VENDORS MODULE
-- ============================================

CREATE TABLE vendors (
    vendor_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vendor_code VARCHAR2(50) UNIQUE NOT NULL,
    vendor_name VARCHAR2(200) NOT NULL,
    vendor_type VARCHAR2(100),

    -- Contact Information
    contact_person VARCHAR2(200),
    contact_email VARCHAR2(200),
    contact_phone VARCHAR2(50),
    address VARCHAR2(500),

    -- Business Information
    business_registration_number VARCHAR2(100),
    tax_id VARCHAR2(100),

    -- Status
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
    rating NUMBER(2,1),

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE
);

-- ============================================
-- FINANCIAL MODULE - ENHANCED
-- ============================================

-- Tenant Invoices Table
CREATE TABLE tenant_invoices (
    invoice_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number VARCHAR2(50) UNIQUE NOT NULL,
    tenant_id NUMBER NOT NULL,
    lease_id NUMBER,
    property_id NUMBER NOT NULL,

    -- Invoice Details
    invoice_type VARCHAR2(50) CHECK (invoice_type IN ('RENT', 'CAM', 'UTILITIES', 'PARKING', 'LATE_FEE', 'OTHER')),
    invoice_date DATE DEFAULT SYSDATE,
    due_date DATE NOT NULL,

    -- Billing Period
    billing_period_start DATE,
    billing_period_end DATE,

    -- Amounts
    amount NUMBER(15,2) NOT NULL,

    -- Tax Calculations - KENYA SPECIFIC
    vat_rate NUMBER(5,2) DEFAULT 16.00, -- Kenya VAT 16%
    vat_amount NUMBER(15,2) DEFAULT 0,
    withholding_tax_rate NUMBER(5,2) DEFAULT 10.00, -- Kenya WHT 10%
    withholding_tax_amount NUMBER(15,2) DEFAULT 0,

    -- Total Amounts
    total_amount NUMBER(15,2) NOT NULL, -- Amount + VAT
    net_amount_due NUMBER(15,2), -- Total - WHT

    -- Payment Information
    amount_paid NUMBER(15,2) DEFAULT 0,
    balance NUMBER(15,2),
    payment_method VARCHAR2(50) CHECK (payment_method IN ('BANK_TRANSFER', 'M_PESA', 'CHEQUE', 'CASH', 'CARD')),
    payment_reference VARCHAR2(100),

    -- Status
    status VARCHAR2(50) DEFAULT 'PENDING' CHECK (status IN ('DRAFT', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')),
    payment_date DATE,

    -- Collection Tracking
    days_overdue NUMBER(5),
    collection_status VARCHAR2(50) CHECK (collection_status IN ('CURRENT', '1_30_DAYS', '31_60_DAYS', '61_90_DAYS', '90_PLUS_DAYS')),

    -- GL Integration
    gl_account_code VARCHAR2(50),

    -- Oracle ERP Integration
    erp_invoice_number VARCHAR2(100),
    erp_sync_status VARCHAR2(50) CHECK (erp_sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    erp_sync_date DATE,
    erp_error_message VARCHAR2(500),

    -- Description
    description VARCHAR2(500),
    notes CLOB,

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,

    -- Foreign Keys
    CONSTRAINT fk_invoice_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
    CONSTRAINT fk_invoice_lease FOREIGN KEY (lease_id) REFERENCES leases(lease_id),
    CONSTRAINT fk_invoice_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

-- Payment Receipts Table - NEW
CREATE TABLE payment_receipts (
    receipt_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    receipt_number VARCHAR2(50) UNIQUE NOT NULL,
    invoice_id NUMBER NOT NULL,
    tenant_id NUMBER NOT NULL,

    -- Payment Details
    payment_date DATE DEFAULT SYSDATE,
    amount_paid NUMBER(15,2) NOT NULL,

    -- Payment Method
    payment_method VARCHAR2(50) CHECK (payment_method IN ('BANK_TRANSFER', 'M_PESA', 'CHEQUE', 'CASH', 'CARD')),
    payment_reference VARCHAR2(100), -- Bank ref, M-Pesa code, Cheque number
    bank_name VARCHAR2(200),

    -- Processing
    processed_by VARCHAR2(100),
    processing_date DATE DEFAULT SYSDATE,

    -- Oracle ERP Integration
    erp_receipt_number VARCHAR2(100),
    erp_sync_status VARCHAR2(50) CHECK (erp_sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    erp_sync_date DATE,

    -- Notes
    notes VARCHAR2(500),

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,

    -- Foreign Keys
    CONSTRAINT fk_receipt_invoice FOREIGN KEY (invoice_id) REFERENCES tenant_invoices(invoice_id),
    CONSTRAINT fk_receipt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- Credit Notes Table - NEW
CREATE TABLE credit_notes (
    credit_note_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    credit_note_number VARCHAR2(50) UNIQUE NOT NULL,
    invoice_id NUMBER NOT NULL,
    tenant_id NUMBER NOT NULL,

    -- Credit Note Details
    credit_date DATE DEFAULT SYSDATE,
    amount NUMBER(15,2) NOT NULL,
    reason VARCHAR2(500),

    -- Status
    status VARCHAR2(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'APPLIED', 'CANCELLED')),

    -- Oracle ERP Integration
    erp_credit_note_number VARCHAR2(100),
    erp_sync_status VARCHAR2(50) CHECK (erp_sync_status IN ('PENDING', 'SYNCED', 'FAILED')),

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    approved_by VARCHAR2(100),
    approved_date DATE,

    -- Foreign Keys
    CONSTRAINT fk_cn_invoice FOREIGN KEY (invoice_id) REFERENCES tenant_invoices(invoice_id),
    CONSTRAINT fk_cn_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- ============================================
-- SPACES MODULE - NEW
-- ============================================

CREATE TABLE spaces (
    space_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    space_code VARCHAR2(50) UNIQUE NOT NULL,
    property_id NUMBER NOT NULL,

    -- Space Details
    space_name VARCHAR2(200) NOT NULL,
    space_type VARCHAR2(50) CHECK (space_type IN ('OFFICE', 'RETAIL', 'WAREHOUSE', 'PARKING', 'COMMON_AREA')),
    floor_number VARCHAR2(20),
    unit_number VARCHAR2(50),

    -- Area
    area NUMBER(12,2),
    area_unit VARCHAR2(20) DEFAULT 'SQM',

    -- Status
    occupancy_status VARCHAR2(50) DEFAULT 'VACANT' CHECK (occupancy_status IN ('VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,

    -- Foreign Keys
    CONSTRAINT fk_space_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

-- ============================================
-- COMPLIANCE MODULE - NEW
-- ============================================

CREATE TABLE compliance_records (
    compliance_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    compliance_code VARCHAR2(50) UNIQUE NOT NULL,
    property_id NUMBER NOT NULL,

    -- Compliance Details
    compliance_type VARCHAR2(100) NOT NULL, -- NEMA_EIA, COUNTY_SBP, FIRE_CERTIFICATE, etc.
    compliance_category VARCHAR2(50) CHECK (compliance_category IN ('NEMA', 'COUNTY', 'FIRE', 'DOSH', 'WATER', 'ENERGY', 'KRA', 'HEALTH', 'INSURANCE', 'SECURITY')),
    compliance_name VARCHAR2(200) NOT NULL,
    issuing_authority VARCHAR2(200),

    -- Dates
    issue_date DATE,
    expiry_date DATE,
    due_date DATE,
    completion_date DATE,
    next_due_date DATE,

    -- Frequency
    frequency VARCHAR2(50) CHECK (frequency IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL')),

    -- Status
    status VARCHAR2(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    risk_level VARCHAR2(50) CHECK (risk_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),

    -- Cost
    cost NUMBER(15,2),

    -- Documents
    certificate_number VARCHAR2(100),
    document_path VARCHAR2(500),

    -- Notes
    description VARCHAR2(500),
    notes CLOB,

    -- Audit Fields
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,

    -- Foreign Keys
    CONSTRAINT fk_compliance_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

-- ============================================
-- USERS (Authentication)
-- ============================================

CREATE TABLE users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR2(100) UNIQUE NOT NULL,
    email VARCHAR2(200) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    full_name VARCHAR2(200),
    role VARCHAR2(50) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MANAGER', 'USER')),
    status VARCHAR2(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    created_date DATE DEFAULT SYSDATE,
    last_login_date DATE
);

CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

COMMENT ON TABLE users IS 'Application users for login and API authentication';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Properties
CREATE INDEX idx_property_status ON properties(status);
CREATE INDEX idx_property_type ON properties(property_type);
CREATE INDEX idx_property_city ON properties(city);

-- Tenants
CREATE INDEX idx_tenant_status ON tenants(status);
CREATE INDEX idx_tenant_type ON tenants(tenant_type);

-- Leases
CREATE INDEX idx_lease_property ON leases(property_id);
CREATE INDEX idx_lease_tenant ON leases(tenant_id);
CREATE INDEX idx_lease_space ON leases(space_id);
CREATE INDEX idx_lease_status ON leases(status);
CREATE INDEX idx_lease_end_date ON leases(lease_end_date);
CREATE INDEX idx_lease_next_escalation ON leases(next_escalation_date);

-- Spaces
CREATE INDEX idx_space_property ON spaces(property_id);
CREATE INDEX idx_space_status ON spaces(occupancy_status);

-- Assets
CREATE INDEX idx_asset_property ON assets(property_id);
CREATE INDEX idx_asset_status ON assets(status);

-- Work Orders
CREATE INDEX idx_wo_property ON work_orders(property_id);
CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_priority ON work_orders(priority);

-- Invoices
CREATE INDEX idx_invoice_tenant ON tenant_invoices(tenant_id);
CREATE INDEX idx_invoice_lease ON tenant_invoices(lease_id);
CREATE INDEX idx_invoice_property ON tenant_invoices(property_id);
CREATE INDEX idx_invoice_status ON tenant_invoices(status);
CREATE INDEX idx_invoice_due_date ON tenant_invoices(due_date);
CREATE INDEX idx_invoice_collection ON tenant_invoices(collection_status);

-- Payment Receipts
CREATE INDEX idx_receipt_invoice ON payment_receipts(invoice_id);
CREATE INDEX idx_receipt_tenant ON payment_receipts(tenant_id);
CREATE INDEX idx_receipt_date ON payment_receipts(payment_date);

-- Compliance
CREATE INDEX idx_compliance_property ON compliance_records(property_id);
CREATE INDEX idx_compliance_status ON compliance_records(status);
CREATE INDEX idx_compliance_category ON compliance_records(compliance_category);
CREATE INDEX idx_compliance_due_date ON compliance_records(due_date);
CREATE INDEX idx_compliance_risk ON compliance_records(risk_level);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE properties IS 'Master table for all properties in the portfolio';
COMMENT ON TABLE tenants IS 'Master table for all tenants';
COMMENT ON TABLE leases IS 'Enhanced lease agreements with CAM charges, parking, and escalation tracking';
COMMENT ON TABLE spaces IS 'Individual spaces/units within properties';
COMMENT ON TABLE assets IS 'Property assets and equipment';
COMMENT ON TABLE work_orders IS 'Maintenance and work order requests';
COMMENT ON TABLE vendors IS 'Vendor and contractor information';
COMMENT ON TABLE tenant_invoices IS 'Tenant invoices with Kenya tax calculations (VAT, WHT)';
COMMENT ON TABLE payment_receipts IS 'Payment receipts with M-Pesa and bank transfer support';
COMMENT ON TABLE credit_notes IS 'Credit notes for refunds and adjustments';
COMMENT ON TABLE compliance_records IS 'Compliance tracking with 52 Kenya-specific types';

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE invoice_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE receipt_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE credit_note_seq START WITH 1 INCREMENT BY 1;

