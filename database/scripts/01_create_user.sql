-- Create Property Pro application user
-- Run this script as SYSTEM (local XE) or ADMIN (Oracle Cloud)
-- Replace YourPassword123 with a strong password

CREATE USER propertypro IDENTIFIED BY "propertypro@2026";

GRANT CONNECT, RESOURCE TO propertypro;
GRANT CREATE SESSION TO propertypro;
GRANT CREATE TABLE TO propertypro;
GRANT CREATE SEQUENCE TO propertypro;
GRANT CREATE VIEW TO propertypro;
GRANT UNLIMITED TABLESPACE TO propertypro;

-- For Oracle Cloud Autonomous Database, you may also need:
-- GRANT DWROLE TO propertypro;
-- GRANT DATA_SUMMARY TO propertypro;
