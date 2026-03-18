# Database migrations

Run these SQL scripts against your Oracle database when adding or changing schema.

## Add property location columns

Adds `total_floors`, `latitude`, and `longitude` to the `properties` table so that:
- **Total Floors** is saved when editing a property
- Property locations can be shown on the Portfolio & Map page

### How to run

**Option 1 – SQL*Plus**
```bash
sqlplus your_user/your_password@your_service @add_property_location_columns.sql
```

**Option 2 – SQL Developer / DBeaver**
1. Open the script `add_property_location_columns.sql`
2. Execute it against your Property Pro schema

**Option 3 – If your table is in a specific schema**
If you use a schema prefix (e.g. `MYSCHEMA.PROPERTIES`), edit the script and use:
```sql
ALTER TABLE myschema.properties ADD (
  total_floors NUMBER(5,0),
  latitude      NUMBER(10,7),
  longitude     NUMBER(10,7)
);
```

### If a column already exists

If you see "column already exists", that column was added earlier. You can run each `ALTER TABLE ... ADD` line separately and skip the ones that already exist.

---

## Add space category and property mapping

Adds `category` (SPACE/UNIT) to the `spaces` table so that:
- **Category** appears in unit details and in the space/units layout.
- Creating spaces/units from All Floors correctly maps to the selected **property** (backend accepts `property_id` / `PROPERTY_ID` and returns both in GET).

**Script:** `add_space_category_and_property.sql`

Run the same way as above (SQL*Plus or SQL Developer). If your app uses in-memory data only (no DB), this migration is not required; the backend already supports category and property mapping in code.

---

## Create lease_requests table

Creates the **lease_requests** table for customer lease/rent/room requests (admin approval workflow).

**Script:** `create_lease_requests_table.sql`

Columns include: request_number, requested_by_user_id/username/name, property_id, floor_id, space_ids, selection_type, requested_area_sqm, unit_type_preference, notes, **request_type** (LEASE | RENT | ROOMS), **lease_type**, **preferred_start_date**, **preferred_end_date**, **term_months**, **budget_or_rent_notes**, **contact_phone**, **contact_email**; for room requests: **room_request_type**, **room_date_from**, **room_date_to**, **duration_hours**, **capacity**, **amenities_required**, **room_notes**; status, approved_by, approved_date, rejection_reason, created_date, last_updated_date.

Run the same way as other migrations. The app currently uses in-memory storage for lease requests; run this migration when you switch the backend to persist lease requests in Oracle.

---

## Create floors table and link spaces

Adds a **floors** table linked to **properties**, and optionally links **spaces** to floors.

**Script:** `create_floors_table_and_link_spaces.sql`

- **floors** table: `floor_id` (PK), `property_id` (FK to `properties`), `floor_number`, `floor_name`, `floor_plan_image_url`, `floor_plan_layout`, `created_at`. Unique on `(property_id, floor_number)`.
- **spaces** table: adds `floor_id` (optional FK to `floors`). The app can continue to use `property_id` + `floor_number`; `floor_id` allows a direct link to the floor row when using the DB.

Run the same way as other migrations (SQL*Plus or SQL Developer). If you use file-based persistence only (`floors.json` / `spaces.json`), this migration is optional until you switch the backend to Oracle for floors/spaces.

---

## Floors and spaces persistence (file-based)

**Floors and spaces are now saved to disk** so they survive server restarts and browser refresh.

- **Where:** `backend/data/floors.json` and `backend/data/spaces.json`
- **When:** On every create (POST floor, POST space) and delete (DELETE floor, DELETE space). The first time you add a floor or space, the backend writes the current list (seed + new) to the file. After a restart, the API loads from these files instead of only the in-memory seed.
- **No database required** for this; the JSON files are created and updated automatically. For production you can later add Oracle tables and switch the routes to use the DB instead of these files.
