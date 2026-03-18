-- Property Pro - Property Hierarchy (Floors, Units, Rooms, Amenities)
-- Run after 01_create_tables.sql
-- Adds: floors table, rooms table, amenities table; extends properties and spaces

-- ============================================
-- EXTEND PROPERTIES (project_name, county, location, total_floors)
-- ============================================
ALTER TABLE properties ADD (project_name VARCHAR2(200));
ALTER TABLE properties ADD (county VARCHAR2(100));
ALTER TABLE properties ADD (latitude NUMBER(12,8));
ALTER TABLE properties ADD (longitude NUMBER(12,8));
ALTER TABLE properties ADD (total_floors NUMBER(4) DEFAULT 1);
ALTER TABLE properties ADD (image_url VARCHAR2(500));
ALTER TABLE properties ADD (description CLOB);

-- ============================================
-- FLOORS TABLE
-- ============================================
CREATE TABLE floors (
    floor_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id NUMBER NOT NULL,
    floor_number NUMBER(4) NOT NULL,
    floor_name VARCHAR2(100),
    floor_plan_image_url VARCHAR2(500),
    floor_plan_layout CLOB,
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_floor_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);
CREATE INDEX idx_floor_property ON floors(property_id);

-- ============================================
-- EXTEND SPACES (unit price, availability, icon, floor_id)
-- ============================================
ALTER TABLE spaces ADD (floor_id NUMBER);
ALTER TABLE spaces ADD (list_price NUMBER(15,2));
ALTER TABLE spaces ADD (availability_status VARCHAR2(50) DEFAULT 'AVAILABLE');
ALTER TABLE spaces ADD (unit_icon VARCHAR2(100));
ALTER TABLE spaces ADD (image_url VARCHAR2(500));
ALTER TABLE spaces ADD CONSTRAINT fk_space_floor FOREIGN KEY (floor_id) REFERENCES floors(floor_id);

-- ============================================
-- ROOMS TABLE (per unit/space)
-- ============================================
CREATE TABLE rooms (
    room_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    space_id NUMBER NOT NULL,
    room_type VARCHAR2(50) NOT NULL,
    room_name VARCHAR2(200),
    length_m NUMBER(8,2),
    width_m NUMBER(8,2),
    area_sqm NUMBER(10,2),
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_room_space FOREIGN KEY (space_id) REFERENCES spaces(space_id)
);
CREATE INDEX idx_room_space ON rooms(space_id);

-- ============================================
-- AMENITIES TABLE (property or floor level)
-- ============================================
CREATE TABLE amenities (
    amenity_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id NUMBER NOT NULL,
    floor_id NUMBER,
    amenity_name VARCHAR2(200) NOT NULL,
    amenity_type VARCHAR2(100),
    area_sqm NUMBER(10,2),
    description VARCHAR2(500),
    image_url VARCHAR2(500),
    created_by VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE,
    last_updated_by VARCHAR2(100),
    last_updated_date DATE DEFAULT SYSDATE,
    CONSTRAINT fk_amenity_property FOREIGN KEY (property_id) REFERENCES properties(property_id),
    CONSTRAINT fk_amenity_floor FOREIGN KEY (floor_id) REFERENCES floors(floor_id)
);
CREATE INDEX idx_amenity_property ON amenities(property_id);
CREATE INDEX idx_amenity_floor ON amenities(floor_id);

COMMENT ON TABLE floors IS 'Floors within a property; optional floor plan image and layout JSON';
COMMENT ON TABLE rooms IS 'Rooms within a unit/space with dimensions';
COMMENT ON TABLE amenities IS 'Building amenities and shared spaces (gym, meeting room, parking, etc.)';
