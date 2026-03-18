-- Create FLOORS table and link SPACES to floors (Oracle)
-- Run in SQL*Plus, SQL Developer, or any Oracle client.
-- Floors belong to a property; units/spaces can reference a floor via floor_id and/or property_id + floor_number.

-- 1) Create FLOORS table (Oracle uppercases unquoted identifiers: floors -> FLOORS)
CREATE TABLE floors (
  floor_id          VARCHAR2(64)   NOT NULL PRIMARY KEY,
  property_id       VARCHAR2(64)   NOT NULL,
  floor_number      NUMBER(10,0)   NOT NULL,
  floor_name        VARCHAR2(128),
  floor_plan_image_url VARCHAR2(512),
  floor_plan_layout CLOB,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_floors_property FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

CREATE INDEX idx_floors_property ON floors(property_id);
CREATE UNIQUE INDEX idx_floors_property_floor ON floors(property_id, floor_number);

COMMENT ON TABLE floors IS 'Floors per property; units and spaces are linked to a floor';
COMMENT ON COLUMN floors.floor_id IS 'Primary key (e.g. FLR-123)';
COMMENT ON COLUMN floors.property_id IS 'References properties.property_id';
COMMENT ON COLUMN floors.floor_number IS 'Logical floor number (1, 2, 3...)';
COMMENT ON COLUMN floors.floor_name IS 'Display name, e.g. Floor 2';

-- 2) Add FLOOR_ID to SPACES so spaces can reference a floor row (optional; app can still use property_id + floor_number)
-- Skip if column already exists.
ALTER TABLE spaces ADD (floor_id VARCHAR2(64));
COMMENT ON COLUMN spaces.floor_id IS 'Optional FK to floors.floor_id; can also use property_id + floor_number';

-- Optional: add FK (uncomment if you want referential integrity)
-- ALTER TABLE spaces ADD CONSTRAINT fk_spaces_floor FOREIGN KEY (floor_id) REFERENCES floors(floor_id);
-- CREATE INDEX idx_spaces_floor ON spaces(floor_id);

COMMIT;
