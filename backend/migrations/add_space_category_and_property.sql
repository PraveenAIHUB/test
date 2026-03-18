-- Add CATEGORY to spaces table and ensure property mapping columns exist (Oracle)
-- Run in SQL*Plus, SQL Developer, or any Oracle client.
-- Ensures: spaces have category (SPACE/UNIT) and property_id mapping works.

-- 1) Add CATEGORY column (SPACE or UNIT)
ALTER TABLE spaces ADD (
  category VARCHAR2(20) DEFAULT 'SPACE'
);
COMMENT ON COLUMN spaces.category IS 'SPACE or UNIT';

-- 2) If your table uses PROPERTY_ID (Oracle default uppercase), no change needed.
--    If you use lowercase property_id and it is not mapping, add a column or sync:
--    Option A – add property_id as synonym (if you only have PROPERTY_ID):
-- ALTER TABLE spaces ADD (property_id VARCHAR2(32));
-- UPDATE spaces SET property_id = PROPERTY_ID WHERE property_id IS NULL;
-- COMMIT;

-- 3) Optional: ensure floor and other common columns exist (skip if already present)
-- ALTER TABLE spaces ADD (floor_number NUMBER(10,0));
-- UPDATE spaces SET floor_number = FLOOR WHERE floor_number IS NULL;
-- COMMIT;

-- If column already exists (e.g. "ORA-01430: column being added already exists"), skip that statement.
