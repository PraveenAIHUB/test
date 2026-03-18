# Property Pro – Property Hierarchy Requirements & Current Application Mapping

This document maps the **required** real estate property hierarchy (Building → Floors → Units → Rooms → Amenities) and related features to the **current** Property Pro application, and identifies gaps and recommended implementation steps.

---

## 1. Required Hierarchy (from specification)

The system must support this **core hierarchy**:

```
Property / Building (Tower)
    → Floors
        → Units (apartments, office spaces)
            → Rooms (living, bedroom, kitchen, etc.)
                → Room Dimensions (length, width, area)
    → Amenities & Shared Spaces (property- or floor-level)
```

---

## 2. Mapping: Requirement ↔ Current Application

### 2.1 Property / Building

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Create property/building first | ✅ Implemented | Properties module, PropertyForm, `POST /api/properties` | — |
| Property name | ✅ | `properties.property_name` | — |
| Project name | ❌ Missing | — | Add `project_name` to properties table and form |
| Address, location | ✅ Partial | `address_line1`, `city`, `state`, `country`, `postal_code` | Add **county** if needed (some data uses COUNTY) |
| Property type (apartment, commercial, mixed-use) | ✅ | `property_type`: COMMERCIAL, RESIDENTIAL, INDUSTRIAL, MIXED_USE | — |
| Total number of floors | ⚠️ Partial | DB has `total_units`; prod data has `FLOORS` | Add explicit `total_floors` (or use `FLOORS`) and expose in UI |
| Map integration: search/select location, auto-fill address (country, city, county, lat/long) | ❌ Missing | — | Integrate Google Maps / Mapbox; add `latitude`, `longitude`, `county` to schema and form |

**Current schema (properties):** `property_id`, `property_code`, `property_name`, `property_type`, `status`, `address_line1`, `address_line2`, `city`, `state`, `country`, `postal_code`, `total_area`, `total_units`, `year_built`, `ownership_type`, `acquisition_date`, `acquisition_cost`, `current_value`, audit fields.

---

### 2.2 Floors

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Add floors to the building | ⚠️ Partial | Floors exist only as **floor_number** on `spaces` | Introduce **floors** table: floor_id, property_id, floor_number, floor_name |
| Floor number, floor name | ⚠️ Partial | `spaces.floor_number` (no floor name) | Add floor name in floors table |
| Floor plan layout / image upload | ⚠️ Partial | FloorPlans.jsx has “Upload Floor Plan” but no backend | Add `floor_plan_image_url` (or path) to floors table; implement upload and display |
| Define units within each floor | ⚠️ Partial | Units are modeled as **spaces** with `floor_number` and `unit_number` | Keep spaces as rentable units; link to floor via `floor_id` when floors table exists |

**Current schema:** No dedicated `floors` table. `spaces` has `floor_number VARCHAR2(20)`, `unit_number VARCHAR2(50)`.

---

### 2.3 Units

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Create multiple units per floor (apartments, offices) | ✅ Conceptual | Spaces represent rentable units; have `property_id`, `floor_number`, `unit_number` | Optionally add explicit **units** table (unit_id, floor_id, …) or keep spaces as units |
| Unit number, unit type, size, price, availability, icon/identifier | ⚠️ Partial | Spaces: `space_code`, `space_name`, `space_type`, `area`; no price/availability/icon on schema | Add to spaces (or units): `unit_type`, `price`, `availability_status`, `unit_icon` / identifier |
| Visual grid layout of floor with clickable units | ⚠️ Partial | FloorPlans.jsx has building/floor dropdown and placeholder for plan | Implement grid/visual floor map with clickable cells linking to space/unit detail |

**Current schema (spaces):** `space_id`, `space_code`, `property_id`, `space_name`, `space_type`, `floor_number`, `unit_number`, `area`, `area_unit`, `occupancy_status`.

---

### 2.4 Rooms

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Define rooms inside each unit | ❌ Missing | — | Add **rooms** table: room_id, unit_id (or space_id), room_type, name |
| Room types: living, bedroom, kitchen, bathroom, balcony, office, custom | ❌ Missing | — | Add `room_type` enum and optional custom name |
| Dimensions per room (length, width, calculated area) | ❌ Missing | — | Add `length`, `width`, `area` (or computed) to rooms table |

**Current schema:** No `rooms` table.

---

### 2.5 Room Dimensions

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Store length, width, calculated area per room | ❌ Missing | — | Implement in rooms table (see 2.4) |

---

### 2.6 Amenities & Shared Spaces

| Requirement | Current state | Location | Gap / action |
|-------------|---------------|----------|--------------|
| Building amenities not tied to a unit (meeting room, gym, parking, cafeteria, common hall, etc.) | ❌ Missing | — | Add **amenities** (or **shared_spaces**) table: property_id, floor_id (optional), name, type, area, etc. |

**Current schema:** No amenities table. `space_type` includes `COMMON_AREA` but there is no dedicated amenity entity.

---

## 3. Additional Features Mapping

| Feature | Current state | Gap / action |
|---------|---------------|--------------|
| **Map integration** (location search, address auto-fill, lat/long) | ❌ | Add Google Maps/Mapbox; backend fields: latitude, longitude, county; frontend: place search + auto-fill |
| **Visual floor layout** (grid, clickable units) | ⚠️ Placeholder in FloorPlans.jsx | Backend: floors + units/spaces per floor; frontend: grid or canvas with click → unit/space detail |
| **Drag-and-drop layout builder** (floor plans and rooms) | ❌ | New feature: floor/room designer (e.g. canvas or grid builder) |
| **Image upload** (properties, units, floor plans) | ❌ | File upload API + storage; link URLs in properties, floors, spaces/units |
| **Import/export** (CSV/JSON) property data | ⚠️ Possible ad hoc | Add dedicated import/export endpoints and UI (CSV/JSON) for properties (and hierarchy) |
| **AI-powered**: floor layout suggestions, auto property description, price recommendations, listing details | ❌ | New AI service (e.g. OpenAI); integrate in property/unit creation and listing flows |
| **Modern, responsive, card-based UI** | ✅ | Dashboard and module layouts already card-based and responsive |

---

## 4. Recommended Data Model Additions (to align with hierarchy)

- **properties**  
  - Add: `project_name`, `county`, `latitude`, `longitude`, `total_floors` (if not using existing FLOORS from prod).

- **floors** (new)  
  - `floor_id`, `property_id`, `floor_number`, `floor_name`, `floor_plan_image_url` (or path), audit fields.

- **spaces** (current “units”)  
  - Add (if not in units table): `unit_type`, `list_price`, `availability_status`, `unit_icon` (or identifier).  
  - Optionally add `floor_id` when floors table exists.

- **units** (optional)  
  - If you want a separate entity from “space”: `unit_id`, `floor_id`, `unit_number`, `unit_type`, `size`, `price`, `availability_status`, `icon/identifier`. Then leases link to unit_id and/or space_id as needed.

- **rooms** (new)  
  - `room_id`, `space_id` (or `unit_id`), `room_type`, `room_name`, `length`, `width`, `area`, audit fields.

- **amenities** (new)  
  - `amenity_id`, `property_id`, `floor_id` (nullable), `name`, `amenity_type`, `area`, `description`, audit fields.

---

## 5. Application Flow Mapping (current vs required)

| Required flow | Current application flow |
|---------------|---------------------------|
| 1. Create property/building (name, project, address, type, total floors, location/map) | Properties → Create Property (no project name, no map, no total floors in form) |
| 2. Add floors (number, name, floor plan upload) | No “Add floor” step; floors only as floor_number on spaces |
| 3. Define units per floor (number, type, size, price, availability, icon) | Space Management: spaces have floor_number, unit_number, type, area; no price/availability/icon in schema |
| 4. Define rooms per unit (type, dimensions) | Not implemented |
| 5. Define amenities (property/floor level) | Not implemented |
| 6. Visual floor map (grid, clickable units) | Floor Plans page: building/floor selector + placeholder; no real grid or click → unit |
| 7. Map integration on property | Not implemented |
| 8. AI suggestions (layout, description, price) | Not implemented |
| 9. Import/export property data | Not implemented as a dedicated feature |

---

## 6. Technology Stack (from specification)

| Component | Spec recommendation | Current |
|-----------|--------------------|--------|
| Maps | Google Maps API or Mapbox | Not integrated |
| AI | OpenAI API for smart suggestions | Not integrated |
| Architecture | Modular; separate services for property, floor, unit, AI | Backend has routes/services; no dedicated floor/unit/AI services |

---

## 7. Summary: What Exists vs What’s Missing

- **Implemented:**  
  Property/building creation (basic fields), property type, address (no map), spaces with floor_number/unit_number (units concept), space types, occupancy, basic floor plan page (placeholder).

- **Partial:**  
  Floors (only as floor_number on spaces), units (as spaces; missing price/availability/icon in schema), visual floor mapping (UI shell only), possible future import/export.

- **Missing:**  
  Project name and total floors on property; map integration; dedicated floors table and floor plan upload; rooms and room dimensions; amenities/shared spaces; drag-and-drop layout builder; image upload for property/unit/floor plan; AI features; dedicated import/export (CSV/JSON).

This document should be used as the single reference to map the “Property Pro Real Estate Property Hierarchy” flowchart and the written requirements to the current application and to plan the next implementation steps.
