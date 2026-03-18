-- Add TOTAL_FLOORS, LATITUDE, LONGITUDE to properties table (Oracle)
-- Run this in SQL*Plus, SQL Developer, or any Oracle client connected to your schema.
-- Example: sqlplus user/pass@service @add_property_location_columns.sql

-- Add columns (Oracle stores unquoted names in uppercase: total_floors -> TOTAL_FLOORS)
ALTER TABLE properties ADD (
  total_floors NUMBER(5,0),
  latitude      NUMBER(10,7),
  longitude     NUMBER(10,7)
);

-- Optional: add comments for documentation
COMMENT ON COLUMN properties.total_floors IS 'Total number of floors in the building';
COMMENT ON COLUMN properties.latitude IS 'Latitude coordinate (e.g. -1.2921)';
COMMENT ON COLUMN properties.longitude IS 'Longitude coordinate (e.g. 36.8219)';
