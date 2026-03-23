import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Sketch, SketchPoint, SketchLine, SketchCircle, ClosedLoop, Plane } from './types';
import { tokens } from '../../theme/theme';

let _eid = 0;
const eid = () => `sk-${++_eid}`;

// ── Closed loop detection ─────────────────────────────────────────────────────
export function findClosedLoops(lines: SketchLine[]): ClosedLoop[] {
  const adj = new Map<string, Set<string>>();
  for (const l of lines) {
    if (!adj.has(l.p1)) adj.set(l.p1, new Set());
    if (!adj.has(l.p2)) adj.set(l.p2, new Set());
    adj.get(l.p1)!.add(l.p2);
    adj.get(l.p2)!.add(l.p1);
  }

  const allLoops: ClosedLoop[] = [];
  const seenKeys = new Set<string>();

  function dfs(start: string, cur: string, path: string[], parent: string | null) {
    for (const nb of adj.get(cur) ?? []) {
      if (nb === parent) continue;
      if (nb === start && path.length >= 3) {
        const key = [...path].sort().join(',');
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allLoops.push([...path]);
        }
      } else if (!path.includes(nb)) {
        path.push(nb);
        dfs(start, nb, path, cur);
        path.pop();
      }
    }
  }

  for (const pid of adj.keys()) {
    dfs(pid, pid, [pid], null);
  }
  return allLoops;
}

export function hasExtrudable(sketch: Sketch | null): boolean {
  if (!sketch) return false;
  if (sketch.circles.filter((c) => !c.isHole).length > 0) return true;
  const holeSigs = new Set(sketch.holeLoopSigs ?? []);
  return findClosedLoops(sketch.lines).some((l) => !holeSigs.has(loopSig(l)));
}

// ── Loop signature (sorted point IDs) ────────────────────────────────────────
export const loopSig = (loop: ClosedLoop): string => [...loop].sort().join(',');

// ── Point-in-polygon (ray casting) ───────────────────────────────────────────
function pointInPolygon(px: number, py: number, pts: SketchPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y;
    const xj = pts[j].x, yj = pts[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
const SZ = 600;      // SVG viewBox size
const RANGE = 300;   // sketch coordinate range (-300..300) — 1 SVG unit = 1 sketch unit
const SNAP_PX = 14;  // point-snap distance in SVG units
const GRID_SNAP = 10; // snap to every 10 sketch units
const GRID_MINOR = 10; // minor grid spacing (sketch units = SVG units)
const GRID_MAJOR = 50; // major grid spacing

const sk2svg = (x: number, y: number) => ({ sx: x + RANGE, sy: -y + RANGE });
const svg2sk = (sx: number, sy: number) => ({ x: sx - RANGE, y: -(sy - RANGE) });

function snapGrid(x: number, y: number) {
  return {
    x: Math.round(x / GRID_SNAP) * GRID_SNAP,
    y: Math.round(y / GRID_SNAP) * GRID_SNAP,
  };
}

function snapToPoint(sx: number, sy: number, points: SketchPoint[]): SketchPoint | null {
  for (const p of points) {
    const { sx: px, sy: py } = sk2svg(p.x, p.y);
    if (Math.hypot(px - sx, py - sy) < SNAP_PX) return p;
  }
  return null;
}

// ── Plane labels ──────────────────────────────────────────────────────────────
const PLANE_AXES: Record<Plane, [string, string]> = {
  xy: ['X', 'Y'],
  xz: ['X', 'Z'],
  yz: ['Y', 'Z'],
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  sketch: Sketch;
  onChange: (s: Sketch) => void;
  onExtrude: (loops: ClosedLoop[], circleIds: string[]) => void;
}

type DrawMode = 'line' | 'circle' | 'hole' | 'erase';

export default function SketchEditor({ sketch, onChange, onExtrude }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = theme.palette.tokens.color;

  const svgRef = useRef<SVGSVGElement>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('line');
  const [lineChain, setLineChain] = useState<string[]>([]);
  const [circleCenter, setCircleCenter] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const loops = findClosedLoops(sketch.lines);
  const holeLoopSigSet = new Set(sketch.holeLoopSigs ?? []);
  const [axH, axV] = PLANE_AXES[sketch.plane];

  const getSVGPos = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): { sx: number; sy: number } => {
      const svg = svgRef.current!;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      return { sx: p.x, sy: p.y };
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLineChain([]);
        setCircleCenter(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleModeChange = (_: unknown, val: DrawMode | null) => {
    if (!val) return;
    setDrawMode(val);
    setLineChain([]);
    setCircleCenter(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const { sx, sy } = getSVGPos(e);
    const snap = snapToPoint(sx, sy, sketch.points);
    if (snap) {
      setCursor({ x: snap.x, y: snap.y });
    } else {
      const raw = svg2sk(sx, sy);
      setCursor(snapGrid(raw.x, raw.y));
    }
  };

  const handleMouseLeave = () => setCursor(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const { sx, sy } = getSVGPos(e);
    const raw = svg2sk(sx, sy);

    if (drawMode === 'erase') {
      // Smallest circle containing the click point first
      const hit = sketch.circles
        .filter((c) => Math.hypot(raw.x - c.cx, raw.y - c.cy) <= c.r + 8)
        .sort((a, b) => a.r - b.r)[0];
      if (hit) {
        handleCircleDelete(hit.id, e);
        return;
      }
      // Nearest line to the click point
      const THRESH = 8;
      let nearest: { id: string; dist: number } | null = null;
      for (const l of sketch.lines) {
        const p1 = pointMap.get(l.p1), p2 = pointMap.get(l.p2);
        if (!p1 || !p2) continue;
        const dx = p2.x - p1.x, dy = p2.y - p1.y, lenSq = dx * dx + dy * dy;
        const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((raw.x - p1.x) * dx + (raw.y - p1.y) * dy) / lenSq));
        const dist = Math.hypot(raw.x - (p1.x + t * dx), raw.y - (p1.y + t * dy));
        if (dist <= THRESH && (!nearest || dist < nearest.dist)) nearest = { id: l.id, dist };
      }
      if (nearest) { handleLineDelete(nearest.id, e); return; }
      // Point hit → delete point + all connected lines + circles centered there
      const hitPt = sketch.points
        .filter((p) => Math.hypot(raw.x - p.x, raw.y - p.y) < SNAP_PX)
        .sort((a, b) => Math.hypot(raw.x - a.x, raw.y - a.y) - Math.hypot(raw.x - b.x, raw.y - b.y))[0];
      if (hitPt) {
        const newLines = sketch.lines.filter((l) => l.p1 !== hitPt.id && l.p2 !== hitPt.id);
        const usedPts = new Set(newLines.flatMap((l) => [l.p1, l.p2]));
        const removedPts = sketch.points.filter((p) => !usedPts.has(p.id));
        const newPoints = sketch.points.filter((p) => usedPts.has(p.id));
        const validSigs = new Set(findClosedLoops(newLines).map(loopSig));
        const newHoleLoopSigs = (sketch.holeLoopSigs ?? []).filter((s) => validSigs.has(s));
        const newCircles = sketch.circles.filter(
          (c) => !removedPts.some((p) => Math.hypot(c.cx - p.x, c.cy - p.y) < SNAP_PX),
        );
        onChange({ ...sketch, points: newPoints, lines: newLines, circles: newCircles, holeLoopSigs: newHoleLoopSigs });
        setLineChain([]);
      }
      return;
    }

    const snap = snapToPoint(sx, sy, sketch.points);
    const skPos = snap ? { x: snap.x, y: snap.y } : snapGrid(raw.x, raw.y);

    if (drawMode === 'line') handleLineClick(snap, skPos);
    else if (drawMode === 'circle') handleCircleClick(skPos);
    else handleHoleClick(raw);
  };

  const handleLineClick = (snap: SketchPoint | null, pos: { x: number; y: number }) => {
    if (lineChain.length === 0) {
      if (snap) {
        setLineChain([snap.id]);
      } else {
        const np: SketchPoint = { id: eid(), x: pos.x, y: pos.y };
        onChange({ ...sketch, points: [...sketch.points, np] });
        setLineChain([np.id]);
      }
      return;
    }

    const lastId = lineChain[lineChain.length - 1];
    const firstId = lineChain[0];

    if (snap) {
      if (snap.id === lastId) return;
      const nl: SketchLine = { id: eid(), p1: lastId, p2: snap.id };
      onChange({ ...sketch, lines: [...sketch.lines, nl] });
      if (snap.id === firstId || lineChain.includes(snap.id)) {
        setLineChain([]);
      } else {
        setLineChain([...lineChain, snap.id]);
      }
    } else {
      const np: SketchPoint = { id: eid(), x: pos.x, y: pos.y };
      const nl: SketchLine = { id: eid(), p1: lastId, p2: np.id };
      onChange({ ...sketch, points: [...sketch.points, np], lines: [...sketch.lines, nl] });
      setLineChain([...lineChain, np.id]);
    }
  };

  const handleCircleClick = (pos: { x: number; y: number }) => {
    if (!circleCenter) {
      setCircleCenter(pos);
    } else {
      const r = Math.hypot(pos.x - circleCenter.x, pos.y - circleCenter.y);
      if (r > 2) {
        const nc: SketchCircle = { id: eid(), cx: circleCenter.x, cy: circleCenter.y, r };
        onChange({ ...sketch, circles: [...sketch.circles, nc] });
      }
      setCircleCenter(null);
    }
  };

  const handleHoleClick = (skPos: { x: number; y: number }) => {
    const pointMap = new Map(sketch.points.map((p) => [p.id, p]));

    // Collect all circles the click lands inside, pick the smallest (innermost)
    const hitCircles = sketch.circles
      .filter((c) => Math.hypot(skPos.x - c.cx, skPos.y - c.cy) <= c.r + 8)
      .sort((a, b) => a.r - b.r);

    if (hitCircles.length > 0) {
      const c = hitCircles[0];
      const updated = sketch.circles.map((ci) =>
        ci.id === c.id ? { ...ci, isHole: !ci.isHole } : ci,
      );
      onChange({ ...sketch, circles: updated });
      return;
    }

    // Check if clicking inside a closed loop
    for (const loop of loops) {
      const pts = loop.map((id) => pointMap.get(id)).filter(Boolean) as SketchPoint[];
      if (pts.length < 3) continue;
      if (pointInPolygon(skPos.x, skPos.y, pts)) {
        const sig = loopSig(loop);
        const existing = sketch.holeLoopSigs ?? [];
        const newSigs = existing.includes(sig)
          ? existing.filter((s) => s !== sig)
          : [...existing, sig];
        onChange({ ...sketch, holeLoopSigs: newSigs });
        return;
      }
    }
  };

  const handleLineDelete = (lineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLines = sketch.lines.filter((l) => l.id !== lineId);
    const usedPts = new Set(newLines.flatMap((l) => [l.p1, l.p2]));
    const removedPts = sketch.points.filter((p) => !usedPts.has(p.id));
    const newPoints = sketch.points.filter((p) => usedPts.has(p.id));
    const validSigs = new Set(findClosedLoops(newLines).map(loopSig));
    const newHoleLoopSigs = (sketch.holeLoopSigs ?? []).filter((s) => validSigs.has(s));
    const newCircles = sketch.circles.filter(
      (c) => !removedPts.some((p) => Math.hypot(c.cx - p.x, c.cy - p.y) < SNAP_PX),
    );
    onChange({ ...sketch, points: newPoints, lines: newLines, circles: newCircles, holeLoopSigs: newHoleLoopSigs });
    setLineChain([]);
  };

  const handleCircleDelete = (circleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...sketch, circles: sketch.circles.filter((c) => c.id !== circleId) });
  };

  const handleExtrude = () => {
    const solidCircleIds = sketch.circles.filter((c) => !c.isHole).map((c) => c.id);
    const solidLoops = loops.filter((l) => !holeLoopSigSet.has(loopSig(l)));
    onExtrude(solidLoops, solidCircleIds);
  };

  // ── Colors ──
  const gridMinorColor = isDark ? 'rgba(51,65,85,0.6)' : 'rgba(203,213,225,0.7)';
  const gridMajorColor = isDark ? '#334155' : '#CBD5E1';
  const axisColor = isDark ? '#475569' : '#94A3B8';
  const pointColor = isDark ? '#94A3B8' : '#64748B';
  const lineColor = isDark ? '#94A3B8' : '#475569';
  const circleEdgeColor = isDark ? '#60A5FA' : '#3B82F6';
  const closedFill = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)';
  const closedStroke = '#3B82F6';
  const holeFill = isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
  const holeStroke = '#EF4444';
  const previewColor = '#F59E0B';
  const snapColor = '#22C55E';
  const gridPatternId = `cad-grid-${sketch.plane}`;

  const pointMap = new Map(sketch.points.map((p) => [p.id, p]));

  const loopPaths = loops.map((loop) => {
    const pts = loop.map((id) => pointMap.get(id)).filter(Boolean) as SketchPoint[];
    if (pts.length < 3) return null;
    return (
      pts
        .map((p, i) => {
          const { sx, sy } = sk2svg(p.x, p.y);
          return `${i === 0 ? 'M' : 'L'}${sx},${sy}`;
        })
        .join(' ') + ' Z'
    );
  });

  const snapHit = cursor
    ? snapToPoint(
        sk2svg(cursor.x, cursor.y).sx,
        sk2svg(cursor.x, cursor.y).sy,
        sketch.points,
      )
    : null;

  const circleRPreview =
    cursor && circleCenter
      ? Math.hypot(cursor.x - circleCenter.x, cursor.y - circleCenter.y)
      : 0;

  const solidCircleCount = sketch.circles.filter((c) => !c.isHole).length;
  const holeCircleCount = sketch.circles.filter((c) => c.isHole).length;
  const solidLoopCount = loops.filter((l) => !holeLoopSigSet.has(loopSig(l))).length;
  const holeLoopCount = holeLoopSigSet.size;
  const canExtrude = solidCircleCount > 0 || solidLoopCount > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: `${tokens.spacing[8]}px` }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${tokens.spacing[8]}px`, flexShrink: 0 }}>
        <ToggleButtonGroup data-tut="sketch-tools" value={drawMode} exclusive onChange={handleModeChange} size="small">
          <ToggleButton value="line" sx={{ fontSize: 11, px: '10px', py: '4px', textTransform: 'none' }}>
            직선
          </ToggleButton>
          <ToggleButton value="circle" sx={{ fontSize: 11, px: '10px', py: '4px', textTransform: 'none' }}>
            원형
          </ToggleButton>
          <ToggleButton
            value="hole"
            sx={{
              fontSize: 11, px: '10px', py: '4px', textTransform: 'none',
              '&.Mui-selected': { color: holeStroke, borderColor: holeStroke },
            }}
          >
            구멍
          </ToggleButton>
          <ToggleButton
            value="erase"
            sx={{
              fontSize: 11, px: '10px', py: '4px', textTransform: 'none',
              '&.Mui-selected': { color: '#EF4444', borderColor: '#EF4444' },
            }}
          >
            삭제
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: `${tokens.spacing[4]}px`, ml: 'auto', alignItems: 'center' }}>
          {canExtrude && (
            <Button
              size="small"
              variant="contained"
              onClick={handleExtrude}
              sx={{ fontSize: 11, py: '3px', px: '10px', textTransform: 'none' }}
            >
              돌출(Extrude)
            </Button>
          )}
          <Button
            size="small"
            onClick={() => {
              onChange({ ...sketch, points: [], lines: [], circles: [], holeLoopSigs: [] });
              setLineChain([]);
              setCircleCenter(null);
            }}
            sx={{ fontSize: 11, py: '3px', px: '8px', textTransform: 'none', color: t.textTertiary }}
          >
            초기화
          </Button>
        </Box>
      </Box>

      {/* Plane info */}
      <Typography sx={{ fontSize: 10, color: t.textTertiary, flexShrink: 0 }}>
        평면: {sketch.plane.toUpperCase()} ({axH}축 가로 · {axV}축 세로) · 10단위 스냅 · ESC로 취소
        {drawMode === 'hole' && ' · 구멍 모드: 원/다각형 클릭으로 구멍 지정'}
      </Typography>

      {/* SVG canvas */}
      <Box
        sx={{
          flex: 1, position: 'relative',
          border: `1px solid ${t.borderDefault}`,
          borderRadius: `${tokens.radius.sm}px`,
          overflow: 'hidden', minHeight: 300,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SZ} ${SZ}`}
          style={{ width: '100%', height: '100%', cursor: drawMode === 'erase' ? 'default' : drawMode === 'hole' ? 'pointer' : 'crosshair', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <defs>
            <pattern
              id={`${gridPatternId}-minor`}
              width={GRID_MINOR}
              height={GRID_MINOR}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_MINOR} 0 L 0 0 0 ${GRID_MINOR}`}
                fill="none"
                stroke={gridMinorColor}
                strokeWidth={0.3}
              />
            </pattern>
            <pattern
              id={`${gridPatternId}-major`}
              width={GRID_MAJOR}
              height={GRID_MAJOR}
              patternUnits="userSpaceOnUse"
            >
              <rect width={GRID_MAJOR} height={GRID_MAJOR} fill={`url(#${gridPatternId}-minor)`} />
              <path
                d={`M ${GRID_MAJOR} 0 L 0 0 0 ${GRID_MAJOR}`}
                fill="none"
                stroke={gridMajorColor}
                strokeWidth={0.6}
              />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width={SZ} height={SZ} fill={`url(#${gridPatternId}-major)`} />

          {/* Axes */}
          <line x1={RANGE} y1={0} x2={RANGE} y2={SZ} stroke={axisColor} strokeWidth={1} />
          <line x1={0} y1={RANGE} x2={SZ} y2={RANGE} stroke={axisColor} strokeWidth={1} />
          <text x={RANGE + 4} y={14} fill={axisColor} fontSize={9} fontFamily="monospace">{axV}↑</text>
          <text x={SZ - 4} y={RANGE - 4} fill={axisColor} fontSize={9} fontFamily="monospace" textAnchor="end">{axH}→</text>
          <text x={RANGE + 3} y={RANGE + 10} fill={axisColor} fontSize={8} fontFamily="monospace">0</text>

          {/* Drawn shapes group — data-tut for tutorial spotlight */}
          <g data-tut="sketch-shapes">
          {/* Closed loop fills */}
          {loopPaths.map((d, i) => {
            if (!d) return null;
            const isHoleLoop = holeLoopSigSet.has(loopSig(loops[i]));
            return (
              <path
                key={i}
                d={d}
                fill={isHoleLoop ? holeFill : closedFill}
                stroke={isHoleLoop ? holeStroke : closedStroke}
                strokeWidth={1.5}
                strokeDasharray={isHoleLoop ? '5,3' : undefined}
              />
            );
          })}

          {/* Sketch lines */}
          {sketch.lines.map((l) => {
            const p1 = pointMap.get(l.p1);
            const p2 = pointMap.get(l.p2);
            if (!p1 || !p2) return null;
            const a = sk2svg(p1.x, p1.y);
            const b = sk2svg(p2.x, p2.y);
            return (
              <line key={l.id} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                stroke={drawMode === 'erase' ? '#EF4444' : lineColor} strokeWidth={1.5} />
            );
          })}

          {/* Sketch circles */}
          {sketch.circles.map((c) => {
            const { sx, sy } = sk2svg(c.cx, c.cy);
            const isHole = c.isHole;
            return (
              <g key={c.id}>
                <circle
                  cx={sx} cy={sy} r={c.r}
                  fill={isHole ? holeFill : closedFill}
                  stroke={drawMode === 'erase' ? '#EF4444' : isHole ? holeStroke : circleEdgeColor}
                  strokeWidth={drawMode === 'erase' ? 2 : 1.5}
                  strokeDasharray={isHole ? '5,3' : undefined}
                />
                <circle cx={sx} cy={sy} r={3} fill={isHole ? holeStroke : circleEdgeColor} />
                {isHole && (
                  <text x={sx} y={sy + 4} fill={holeStroke} fontSize={8} fontFamily="monospace" textAnchor="middle">
                    구멍
                  </text>
                )}
              </g>
            );
          })}

          {/* Sketch points */}
          {sketch.points.map((p) => {
            const { sx, sy } = sk2svg(p.x, p.y);
            return <circle key={p.id} cx={sx} cy={sy} r={4} fill={pointColor} />;
          })}
          </g>{/* end sketch-shapes */}

          {/* Chain start highlight */}
          {lineChain.length > 0 && (() => {
            const sp = pointMap.get(lineChain[0]);
            if (!sp) return null;
            const { sx, sy } = sk2svg(sp.x, sp.y);
            return <circle cx={sx} cy={sy} r={7} fill="none" stroke={previewColor} strokeWidth={2} />;
          })()}

          {/* Preview: drawing line */}
          {cursor && drawMode === 'line' && lineChain.length > 0 && (() => {
            const lp = pointMap.get(lineChain[lineChain.length - 1]);
            if (!lp) return null;
            const { sx: lsx, sy: lsy } = sk2svg(lp.x, lp.y);
            const { sx: curSx, sy: curSy } = sk2svg(cursor.x, cursor.y);
            return (
              <line x1={lsx} y1={lsy} x2={curSx} y2={curSy}
                stroke={previewColor} strokeWidth={1.5} strokeDasharray="5,3" />
            );
          })()}

          {/* Preview: circle center */}
          {cursor && drawMode === 'circle' && circleCenter && (() => {
            const { sx: ccx, sy: ccy } = sk2svg(circleCenter.x, circleCenter.y);
            return (
              <>
                <circle cx={ccx} cy={ccy} r={circleRPreview}
                  fill="rgba(251,191,36,0.08)" stroke={previewColor} strokeWidth={1.5} strokeDasharray="5,3" />
                <circle cx={ccx} cy={ccy} r={4} fill={previewColor} />
              </>
            );
          })()}

          {/* Snap indicator (existing point) */}
          {snapHit && (() => {
            const { sx, sy } = sk2svg(snapHit.x, snapHit.y);
            return <circle cx={sx} cy={sy} r={9} fill="none" stroke={snapColor} strokeWidth={2} />;
          })()}

          {/* Cursor: crosshair + center dot + coordinates (not in hole/erase mode) */}
          {cursor && drawMode !== 'hole' && drawMode !== 'erase' && (() => {
            const { sx, sy } = sk2svg(cursor.x, cursor.y);
            return (
              <g>
                <line x1={sx - 7} y1={sy} x2={sx + 7} y2={sy} stroke={previewColor} strokeWidth={1} />
                <line x1={sx} y1={sy - 7} x2={sx} y2={sy + 7} stroke={previewColor} strokeWidth={1} />
                <circle cx={sx} cy={sy} r={2.5} fill={previewColor} />
                <text x={sx + 9} y={sy - 5} fill={previewColor} fontSize={9} fontFamily="monospace">
                  {cursor.x},{cursor.y}
                </text>
              </g>
            );
          })()}
        </svg>
      </Box>

      {/* Status */}
      <Typography sx={{ fontSize: 10, color: t.textTertiary, flexShrink: 0 }}>
        {drawMode === 'line' && lineChain.length === 0 && '클릭으로 점 추가 · 기존 점 클릭으로 체인 시작'}
        {drawMode === 'line' && lineChain.length > 0 && `연결 중 (${lineChain.length}점) · 시작점 클릭으로 닫기`}
        {drawMode === 'circle' && !circleCenter && '중심 클릭'}
        {drawMode === 'circle' && circleCenter && `중심 (${circleCenter.x},${circleCenter.y}) · 반지름 클릭`}
        {drawMode === 'hole' && '원 또는 다각형 영역 클릭으로 구멍 지정/해제'}
        {drawMode === 'erase' && '선 또는 원 클릭으로 삭제'}
        {solidLoopCount > 0 && ` · 솔리드 루프 ${solidLoopCount}개`}
        {holeLoopCount > 0 && ` · 구멍 루프 ${holeLoopCount}개`}
        {solidCircleCount > 0 && ` · 원 ${solidCircleCount}개`}
        {holeCircleCount > 0 && ` · 구멍 원 ${holeCircleCount}개`}
      </Typography>
    </Box>
  );
}
