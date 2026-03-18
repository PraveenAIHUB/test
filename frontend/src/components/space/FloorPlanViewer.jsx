/**
 * Shared floor plan diagram: one component for admin and user.
 * - Layout persisted from API (same positions on refresh).
 * - Units: full selection only (click, multi-select in user mode).
 * - Spaces: full or partial (snip); snip only for type === 'space'.
 * - Zoom, pan, selection overlay for admin.
 */
import { useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';

const SQFT_TO_SQM = 0.09290304;

function FloorPlanViewer({
  layout = null,
  mode = 'user',
  selectedUnitIds = [],
  selectedSpaces = [],
  selectionOverlay = [],
  onSelectUnits = () => {},
  onSelectSpaces = () => {},
  onSelectBlock = null,
  width = 800,
  height = 600,
  selectableStatuses = ['VACANT']
}) {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState(null);
  const [snipMode, setSnipMode] = useState(false);
  const [snipStart, setSnipStart] = useState(null);
  const [snipCurrent, setSnipCurrent] = useState(null);
  const [snipSpaceId, setSnipSpaceId] = useState(null);

  const cw = layout?.canvasWidth || 800;
  const ch = layout?.canvasHeight || 600;

  const pointerToContent = useCallback((screenX, screenY) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const s = stage.scaleX();
    const tx = stage.x();
    const ty = stage.y();
    return { x: (screenX - tx) / s, y: (screenY - ty) / s };
  }, []);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const s = Math.max(0.3, Math.min(2, newScale));
    setScale(s);
    setStagePos({ x: pointer.x - mousePointTo.x * s, y: pointer.y - mousePointTo.y * s });
  }, []);

  const handleStageDragEnd = useCallback((e) => {
    setStagePos({ x: e.target.x(), y: e.target.y() });
  }, []);

  const canSelect = (block) => {
    const status = (block.status || 'VACANT').toUpperCase();
    return selectableStatuses.map((s) => s.toUpperCase()).includes(status);
  };

  const handleUnitClick = useCallback((block, e) => {
    e.cancelBubble = true;
    if (mode === 'admin' && onSelectBlock) {
      onSelectBlock(block);
      return;
    }
    if (!canSelect(block)) return;
    const id = block.id;
    const next = selectedUnitIds.includes(id) ? selectedUnitIds.filter((i) => i !== id) : [...selectedUnitIds, id];
    onSelectUnits(next);
  }, [mode, selectedUnitIds, onSelectUnits, onSelectBlock]);

  const handleSpaceClick = useCallback((block, e) => {
    e.cancelBubble = true;
    if (mode === 'admin' && onSelectBlock) {
      onSelectBlock(block);
      return;
    }
    if (!canSelect(block)) return;
    if (snipMode) return;
    const id = block.id;
    const existing = selectedSpaces.find((s) => s.spaceId === id);
    const next = existing
      ? selectedSpaces.filter((s) => s.spaceId !== id)
      : [...selectedSpaces, { spaceId: id, full: true, area_sqft: block.size, dimensions: null }];
    onSelectSpaces(next);
  }, [mode, snipMode, selectedSpaces, onSelectSpaces, onSelectBlock]);

  const handleSpaceMouseDown = useCallback((block, e) => {
    if (mode !== 'user' || !snipMode || block.type !== 'space' || !canSelect(block)) return;
    e.cancelBubble = true;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const content = pointerToContent(pos.x, pos.y);
    setSnipSpaceId(block.id);
    setSnipStart(content);
    setSnipCurrent(content);
  }, [mode, snipMode, pointerToContent]);

  const handleMouseMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (snipStart && snipSpaceId) {
      const pos = stage.getPointerPosition();
      if (pos) setSnipCurrent(pointerToContent(pos.x, pos.y));
      return;
    }
    setHoverId(null);
  }, [snipStart, snipSpaceId, pointerToContent]);

  const handleMouseUp = useCallback(() => {
    if (snipStart && snipCurrent && snipSpaceId && layout) {
      const block = (layout.layout || []).find((b) => b.id === snipSpaceId);
      if (block && block.type === 'space') {
        const x1 = Math.min(snipStart.x, snipCurrent.x);
        const y1 = Math.min(snipStart.y, snipCurrent.y);
        const x2 = Math.max(snipStart.x, snipCurrent.x);
        const y2 = Math.max(snipStart.y, snipCurrent.y);
        const bx = block.x;
        const by = block.y;
        const bw = block.width;
        const bh = block.height;
        const ix = Math.max(0, Math.min(x2, bx + bw) - Math.max(x1, bx));
        const iy = Math.max(0, Math.min(y2, by + bh) - Math.max(y1, by));
        const drawnArea = ix * iy;
        const totalPx = bw * bh;
        const ratio = totalPx > 0 ? drawnArea / totalPx : 0;
        const area_sqft = Math.round(block.size * ratio);
        if (area_sqft > 0) {
          const aspect = ix > 0 ? iy / ix : 1;
          const length_ft = Math.sqrt(area_sqft / aspect);
          const width_ft = area_sqft / length_ft;
          const dimensions = { length: Math.round(length_ft * 10) / 10, width: Math.round(width_ft * 10) / 10 };
          const without = selectedSpaces.filter((s) => s.spaceId !== snipSpaceId);
          onSelectSpaces([...without, {
            spaceId: snipSpaceId,
            full: false,
            area_sqft,
            dimensions,
            coordinates: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
          }]);
        }
      }
      setSnipStart(null);
      setSnipCurrent(null);
      setSnipSpaceId(null);
    }
  }, [snipStart, snipCurrent, snipSpaceId, layout, selectedSpaces, onSelectSpaces]);
  const handleMouseLeave = useCallback(() => {
    if (snipStart && snipSpaceId) handleMouseUp();
  }, [snipStart, snipSpaceId]);

  if (!layout || !Array.isArray(layout.layout)) {
    return (
      <div style={{ width, height, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
        <span>No floor plan layout.</span>
      </div>
    );
  }

  const core = layout.core || { x: 280, y: 180, width: 240, height: 240, label: 'ELEV', subtitle: 'RESTROOMS' };
  const units = (layout.layout || []).filter((b) => b.type === 'unit');
  const spaces = (layout.layout || []).filter((b) => b.type === 'space');

  return (
    <div style={{ position: 'relative' }}>
      {mode === 'user' && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={snipMode} onChange={(e) => setSnipMode(e.target.checked)} />
            <span>Draw partial space (snip) — spaces only</span>
          </label>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        draggable
        onDragEnd={handleStageDragEnd}
        style={{ background: '#f5f5f5', borderRadius: 8, border: '1px solid #ccc' }}
      >
        <Layer>
          <Rect x={0} y={0} width={cw} height={ch} fill="#fafafa" listening={false} />
          <Rect x={core.x} y={core.y} width={core.width} height={core.height} fill="#ddd" stroke="#888" strokeWidth={2} listening={false} />
          <Text x={core.x + 12} y={core.y + core.height / 2 - 20} text={core.label || 'ELEV'} fontSize={14} fontStyle="bold" listening={false} />
          <Text x={core.x + 12} y={core.y + core.height / 2} text={core.subtitle || 'RESTROOMS'} fontSize={12} listening={false} />
          {units.map((block) => {
            const selected = selectedUnitIds.includes(block.id);
            const overlay = selectionOverlay.find((o) => o.id === block.id && o.selectionMode === 'full');
            const isHover = hoverId === block.id;
            return (
              <Group
                key={block.id}
                onMouseEnter={() => setHoverId(block.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => handleUnitClick(block, e)}
              >
                <Rect
                  x={block.x}
                  y={block.y}
                  width={block.width}
                  height={block.height}
                  fill={block.color || '#eee'}
                  stroke={overlay ? '#1a73e8' : selected ? '#1a73e8' : isHover ? '#666' : '#555'}
                  strokeWidth={selected || overlay ? 3 : 1}
                  listening={canSelect(block)}
                />
                <Text x={block.x + 4} y={block.y + 4} text={block.code || block.id} fontSize={11} listening={false} />
                <Text x={block.x + 4} y={block.y + block.height - 18} text={`${block.size} sqft`} fontSize={10} listening={false} />
              </Group>
            );
          })}
          {spaces.map((block) => {
            const sel = selectedSpaces.find((s) => s.spaceId === block.id);
            const overlay = selectionOverlay.find((o) => o.id === block.id);
            const selected = !!sel;
            const isHover = hoverId === block.id;
            return (
              <Group
                key={block.id}
                onMouseEnter={() => setHoverId(block.id)}
                onMouseLeave={() => setHoverId(null)}
                onMouseDown={(e) => handleSpaceMouseDown(block, e)}
                onClick={(e) => handleSpaceClick(block, e)}
              >
                <Rect
                  x={block.x}
                  y={block.y}
                  width={block.width}
                  height={block.height}
                  fill={block.color || '#e8f5e9'}
                  stroke={overlay ? '#1a73e8' : selected ? '#1a73e8' : isHover ? '#666' : '#555'}
                  strokeWidth={selected || overlay ? 3 : 1}
                  listening={canSelect(block)}
                  dash={[4, 4]}
                />
                <Text x={block.x + 4} y={block.y + 4} text={block.code || block.id} fontSize={11} listening={false} />
                <Text x={block.x + 4} y={block.y + block.height - 18} text={`${block.size} sqft`} fontSize={10} listening={false} />
              </Group>
            );
          })}
          {selectionOverlay.filter((o) => o.selectionMode === 'partial' && o.coordinates).map((o, i) => (
            <Rect
              key={`overlay-${o.id}-${i}`}
              x={o.coordinates.x}
              y={o.coordinates.y}
              width={o.coordinates.width}
              height={o.coordinates.height}
              fill="rgba(26,115,232,0.25)"
              stroke="#1a73e8"
              strokeWidth={2}
              listening={false}
            />
          ))}
          {snipStart && snipCurrent && (
            <Rect
              x={Math.min(snipStart.x, snipCurrent.x)}
              y={Math.min(snipStart.y, snipCurrent.y)}
              width={Math.max(2, Math.abs(snipCurrent.x - snipStart.x))}
              height={Math.max(2, Math.abs(snipCurrent.y - snipStart.y))}
              stroke="#c62828"
              strokeWidth={2}
              dash={[6, 4]}
              fill="rgba(198,40,40,0.2)"
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

export default FloorPlanViewer;
export { SQFT_TO_SQM };
