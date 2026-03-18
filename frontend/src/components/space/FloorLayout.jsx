/**
 * BookMyShow-style floor layout: grid of spaces/units with status colors.
 * Used in All Floors (admin) and Browse & Request (user) for click-to-book.
 */
import './FloorLayout.css';

const STATUS_CONFIG = {
  VACANT:   { label: 'Vacant',   color: 'var(--floor-layout-vacant, #e8e8e8)', bgClass: 'floor-layout__seat--vacant' },
  RESERVED: { label: 'Reserved', color: 'var(--floor-layout-reserved, #fff3e0)', bgClass: 'floor-layout__seat--reserved' },
  OCCUPIED: { label: 'Occupied', color: 'var(--floor-layout-occupied, #e8f5e9)', bgClass: 'floor-layout__seat--occupied' },
  LEASED:   { label: 'Leased',   color: 'var(--floor-layout-leased, #e3f2fd)', bgClass: 'floor-layout__seat--leased' },
  RENTED:   { label: 'Rented',   color: 'var(--floor-layout-leased, #e3f2fd)', bgClass: 'floor-layout__seat--leased' }
};

function getStatusConfig(status) {
  const s = (status || 'VACANT').toUpperCase();
  return STATUS_CONFIG[s] || STATUS_CONFIG.VACANT;
}

export default function FloorLayout({
  spaces = [],
  selectedSpaceId = null,
  selectedSpaceIds = [],
  onSelectSpace,
  selectableStatuses = ['VACANT'],
  showLegend = true,
  columns = 4,
  compact = false,
  emptyMessage = 'No spaces or units on this floor.'
}) {
  const sorted = [...spaces].sort((a, b) => {
    const codeA = (a.SPACE_CODE || a.space_code || '').toString();
    const codeB = (b.SPACE_CODE || b.space_code || '').toString();
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });

  const canSelect = (space) => {
    if (!onSelectSpace) return false;
    const status = (space.STATUS || space.occupancy_status || 'VACANT').toUpperCase();
    return selectableStatuses.map((x) => x.toUpperCase()).includes(status);
  };

  const isSelected = (space) => {
    const id = space.SPACE_ID || space.space_id;
    if (selectedSpaceId !== null && selectedSpaceId !== undefined) return id === selectedSpaceId;
    return Array.isArray(selectedSpaceIds) && selectedSpaceIds.includes(id);
  };

  return (
    <div className="floor-layout">
      {showLegend && (
        <div className="floor-layout__legend">
          {Object.entries(STATUS_CONFIG)
            .filter(([k]) => k !== 'RENTED')
            .map(([key, cfg]) => (
              <div key={key} className="floor-layout__legend-item">
                <span className="floor-layout__legend-swatch" style={{ background: cfg.color }} aria-hidden />
                <span>{cfg.label}</span>
              </div>
            ))}
        </div>
      )}
      {sorted.length === 0 ? (
        <div className="floor-layout__empty">{emptyMessage}</div>
      ) : (
        <div
          className={`floor-layout__grid ${compact ? 'floor-layout__grid--compact' : ''}`}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {sorted.map((space) => {
            const status = (space.STATUS || space.occupancy_status || 'VACANT').toUpperCase();
            const cfg = getStatusConfig(status);
            const sid = space.SPACE_ID || space.space_id;
            const code = space.SPACE_CODE || space.space_code;
            const clickable = canSelect(space);
            const selected = isSelected(space);
            const category = space.CATEGORY || space.category || (String(code).includes('-U-') ? 'Unit' : 'Space');
            return (
              <button
                type="button"
                key={sid}
                className={`floor-layout__seat ${cfg.bgClass} ${clickable ? 'floor-layout__seat--clickable' : ''} ${selected ? 'floor-layout__seat--selected' : ''}`}
                style={{ backgroundColor: cfg.color }}
                onClick={() => clickable && onSelectSpace(space)}
                disabled={!clickable}
                title={clickable ? `Select ${code}` : `${code} – ${category} – ${cfg.label}`}
              >
                <span className="floor-layout__seat-code">{code}</span>
                {!compact && (
                  <span className="floor-layout__seat-meta">
                    {category}{(space.AREA || space.area) ? ` · ${space.AREA || space.area} sqm` : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { STATUS_CONFIG, getStatusConfig };
