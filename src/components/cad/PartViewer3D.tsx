import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box } from '@mui/material';
import type { CadPart, Sketch, ExtrudeFeature } from './types';
import { partColor } from './cadUtils';
import { loopSig } from './SketchEditor';

type V2 = { x: number; y: number };

// ── Point-in-polygon ──────────────────────────────────────────────────────────
function pip(px: number, py: number, poly: V2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── Minimum distance from point to segment ────────────────────────────────────
function distPtSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ── Circle overlaps polygon ───────────────────────────────────────────────────
function circleOverlapsPoly(cx: number, cy: number, r: number, pts: V2[]): boolean {
  if (pip(cx, cy, pts)) return true;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++)
    if (distPtSeg(cx, cy, pts[j].x, pts[j].y, pts[i].x, pts[i].y) < r) return true;
  return false;
}

// ── Two polygons overlap ──────────────────────────────────────────────────────
function polysOverlap(a: V2[], b: V2[]): boolean {
  if (pip(a[0].x, a[0].y, b) || pip(b[0].x, b[0].y, a)) return true;
  for (let i = 0, pi = a.length - 1; i < a.length; pi = i++)
    for (let j = 0, pj = b.length - 1; j < b.length; pj = j++) {
      const ax = a[pi].x, ay = a[pi].y, bx = a[i].x, by = a[i].y;
      const cx = b[pj].x, cy = b[pj].y, dx = b[j].x, dy = b[j].y;
      const abx = bx-ax, aby = by-ay, cdx = dx-cx, cdy = dy-cy;
      const d1 = cdx*(ay-cy)-cdy*(ax-cx), d2 = cdx*(by-cy)-cdy*(bx-cx);
      const d3 = abx*(cy-ay)-aby*(cx-ax), d4 = abx*(dy-ay)-aby*(dx-ax);
      if (d1*d2 < 0 && d3*d4 < 0) return true;
    }
  return false;
}

// ── Segment-circle intersections ─────────────────────────────────────────────
function segCircleXs(p1: V2, p2: V2, cx: number, cy: number, r: number): { t: number; pt: V2 }[] {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const fx = p1.x - cx, fy = p1.y - cy;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return [];
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const sq = Math.sqrt(disc);
  return ([-1, 1] as const)
    .map(s => (-b + s * sq) / (2 * a))
    .filter(t => t > 1e-9 && t < 1 - 1e-9)
    .sort((a, b) => a - b)
    .map(t => ({ t, pt: { x: p1.x + t * dx, y: p1.y + t * dy } }));
}

// ── Polygon minus circle ──────────────────────────────────────────────────────
// Returns:
//  - V2[]          : contour with circular notch(es) cut in (single closed polygon, no holes needed)
//  - 'fully-inside': circle is fully inside polygon (caller should use Shape.holes)
//  - null          : all polygon vertices inside circle → nothing to render
function polyMinusCircle(poly: V2[], cx: number, cy: number, r: number): V2[] | 'fully-inside' | null {
  // Normalize to CCW
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    area += poly[j].x * poly[i].y - poly[i].x * poly[j].y;
  const p = area >= 0 ? poly : [...poly].reverse();

  if (p.every(v => Math.hypot(v.x - cx, v.y - cy) <= r + 1e-9)) return null;

  // If p[0] is inside the circle, rotate to start from an outside vertex so
  // that inCircle starts as false and entryAngle is always set before first use.
  if (Math.hypot(p[0].x - cx, p[0].y - cy) < r) {
    const outsideIdx = p.findIndex(v => Math.hypot(v.x - cx, v.y - cy) >= r - 1e-9);
    const rotated = [...p.slice(outsideIdx), ...p.slice(0, outsideIdx)];
    return polyMinusCircle(rotated, cx, cy, r);
  }

  const events: { i: number; t: number; pt: V2 }[] = [];
  for (let i = 0; i < p.length; i++)
    for (const ix of segCircleXs(p[i], p[(i + 1) % p.length], cx, cy, r))
      events.push({ i, t: ix.t, pt: ix.pt });

  if (events.length === 0)
    return pip(cx, cy, p) ? 'fully-inside' : p;

  events.sort((a, b) => a.i - b.i || a.t - b.t);

  let inCircle = false; // guaranteed: p[0] is outside the circle
  const result: V2[] = [];
  let entryAngle = 0;

  for (let i = 0; i < p.length; i++) {
    if (!inCircle) result.push(p[i]);
    for (const { pt } of events.filter(e => e.i === i)) {
      if (!inCircle) {
        result.push(pt);
        entryAngle = Math.atan2(pt.y - cy, pt.x - cx);
        inCircle = true;
      } else {
        const exitAngle = Math.atan2(pt.y - cy, pt.x - cx);
        // Pick the arc whose midpoint lies inside the polygon
        let cwEnd = exitAngle;
        while (cwEnd >= entryAngle) cwEnd -= Math.PI * 2;
        let ccwEnd = exitAngle;
        while (ccwEnd <= entryAngle) ccwEnd += Math.PI * 2;
        const cwMid = entryAngle + (cwEnd - entryAngle) / 2;
        const useCW = pip(cx + r * Math.cos(cwMid), cy + r * Math.sin(cwMid), p);
        const end = useCW ? cwEnd : ccwEnd;
        const steps = Math.max(2, Math.round(Math.abs(end - entryAngle) / (Math.PI * 2) * 64));
        for (let k = 1; k < steps; k++) {
          const ang = entryAngle + (end - entryAngle) * k / steps;
          result.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
        }
        result.push(pt);
        inCircle = false;
      }
    }
  }

  return result.length >= 3 ? result : null;
}

// ── Build extruded meshes respecting holes ────────────────────────────────────
export function buildExtrudeMeshes(
  sketch: Sketch,
  extrude: ExtrudeFeature,
  h: number,
  col: THREE.ColorRepresentation,
): THREE.Mesh[] {
  const pm = new Map(sketch.points.map((p) => [p.id, p]));
  const holeLoopSigs = new Set(sketch.holeLoopSigs ?? []);
  const mat = () =>
    new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide });

  const holeCircles = sketch.circles.filter((c) => c.isHole);
  const meshes: THREE.Mesh[] = [];

  // ── Solid circles (with hole circles) ────────────────────────────────────
  // Shape uses -cy so that after rotateX(-π/2): Z = +sketchY (matches edge bar positions)
  extrude.circleIds.forEach((cid) => {
    const c = sketch.circles.find((x) => x.id === cid);
    if (!c || c.isHole) return;

    const shape = new THREE.Shape();
    shape.absarc(c.cx, -c.cy, c.r, 0, Math.PI * 2, false);

    for (const hc of holeCircles) {
      const dist = Math.hypot(hc.cx - c.cx, hc.cy - c.cy);
      if (dist >= c.r + hc.r) continue;
      const hole = new THREE.Path();
      hole.absarc(hc.cx, -hc.cy, hc.r, 0, Math.PI * 2, false);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    meshes.push(new THREE.Mesh(geo, mat()));
  });

  // ── Solid loops ───────────────────────────────────────────────────────────
  extrude.loops.forEach((loop) => {
    if (holeLoopSigs.has(loopSig(loop))) return;
    const basePts = loop.map((pid) => pm.get(pid)).filter(Boolean) as V2[];
    if (basePts.length < 3) return;

    // Normalize basePts to CCW (shoelace area >= 0 in Y-up coords)
    let bpArea = 0;
    for (let i = 0, j = basePts.length - 1; i < basePts.length; j = i++)
      bpArea += basePts[j].x * basePts[i].y - basePts[i].x * basePts[j].y;
    if (bpArea < 0) basePts.reverse();

    // Apply each hole circle via polyMinusCircle (builds actual contour, no Shape.holes needed)
    // fullyInside circles are collected separately for Shape.holes
    let currentPts: V2[] = basePts;
    const fullyInsideHoles: { cx: number; cy: number; r: number }[] = [];

    for (const hc of holeCircles) {
      if (!circleOverlapsPoly(hc.cx, hc.cy, hc.r, currentPts)) continue;
      const result = polyMinusCircle(currentPts, hc.cx, hc.cy, hc.r);
      if (result === null) return; // entire polygon gone
      if (result === 'fully-inside') {
        fullyInsideHoles.push({ cx: hc.cx, cy: hc.cy, r: hc.r });
      } else {
        currentPts = result;
      }
    }

    // Negate Y so rotateX(-π/2) maps sketchY → +3D_Z; reverse to restore CCW winding
    const shapePts = currentPts.map(p => new THREE.Vector2(p.x, -p.y));
    shapePts.reverse();
    const shape = new THREE.Shape(shapePts);

    // Hole loops fully inside this solid loop
    for (const hloop of extrude.loops) {
      if (!holeLoopSigs.has(loopSig(hloop))) continue;
      const hpts = hloop.map((pid) => pm.get(pid)).filter(Boolean) as V2[];
      if (hpts.length < 3) continue;
      if (polysOverlap(currentPts, hpts)) {
        shape.holes.push(new THREE.Path(hpts.map(p => new THREE.Vector2(p.x, -p.y))));
      }
    }

    // Hole circles fully inside (no edge crossings)
    for (const { cx, cy, r } of fullyInsideHoles) {
      const hole = new THREE.Path();
      hole.absarc(cx, -cy, r, 0, Math.PI * 2, false);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    meshes.push(new THREE.Mesh(geo, mat()));
  });

  return meshes;
}

// ── Geometry builder (reused for live height update) ─────────────────────────
export function buildPartGroup(part: CadPart, heightOverride?: number): THREE.Group {
  const group = new THREE.Group();
  if (!part.extrude || !part.sketch) return group;

  const { extrude, sketch } = part;
  const h = heightOverride !== undefined ? Math.max(heightOverride, 1) : extrude.height;
  const col = partColor(part.id);

  // Add extruded body meshes (with hole support)
  for (const mesh of buildExtrudeMeshes(sketch, extrude, h, col)) {
    group.add(mesh);
  }

  // Torus rings on all extruded circles — solid outer edge + hole inner edge
  // Z = +sketchY (matches solid mesh after buildExtrudeMeshes uses -cy in Shape + rotateX)
  extrude.circleIds.forEach((cid) => {
    const c = sketch.circles.find((x) => x.id === cid);
    if (!c) return;
    for (const yPos of [0, h]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(c.r, 1.5, 6, 72),
        new THREE.MeshBasicMaterial({ color: col }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(c.cx, yPos, c.cy);
      group.add(ring);
    }
  });

  // Edge lines on solid polygon loops (top + bottom of each edge)
  const pm = new Map(sketch.points.map((p) => [p.id, p]));
  const holeLoopSigs = new Set(sketch.holeLoopSigs ?? []);
  const edgeMat = new THREE.MeshBasicMaterial({ color: col });

  extrude.loops.forEach((loop) => {
    if (holeLoopSigs.has(loopSig(loop))) return;
    for (let ei = 0; ei < loop.length; ei++) {
      const p1 = pm.get(loop[ei]);
      const p2 = pm.get(loop[(ei + 1) % loop.length]);
      if (!p1 || !p2) continue;
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mx = (p1.x + p2.x) / 2;
      const mz = (p1.y + p2.y) / 2; // Z = +sketchY
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      for (const yPos of [0, h]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 2, 2), edgeMat);
        bar.position.set(mx, yPos, mz);
        bar.rotation.y = -angle;
        group.add(bar);
      }
      const vert = new THREE.Mesh(new THREE.BoxGeometry(2, h, 2), edgeMat);
      vert.position.set(p1.x, h / 2, p1.y);
      group.add(vert);
    }
  });

  // Torus rings for hole circle inner edges (concentric circles or holes in loops)
  const holeCircles = sketch.circles.filter((c) => c.isHole);

  for (const hc of holeCircles) {
    const insideSolidCircle = extrude.circleIds.some((cid) => {
      const c = sketch.circles.find((x) => x.id === cid);
      if (!c || c.isHole) return false;
      return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) + hc.r <= c.r + 0.1;
    });

    const insideSolidLoop = extrude.loops.some((loop) => {
      if (holeLoopSigs.has(loopSig(loop))) return false;
      const pts = loop.map((pid) => pm.get(pid)).filter(Boolean) as { x: number; y: number }[];
      if (pts.length < 3) return false;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
        if ((yi > hc.cy) !== (yj > hc.cy) && hc.cx < ((xj - xi) * (hc.cy - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    });

    if (!insideSolidCircle && !insideSolidLoop) continue;

    for (const yPos of [0, h]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(hc.r, 1.5, 6, 72),
        new THREE.MeshBasicMaterial({ color: col }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(hc.cx, yPos, hc.cy);
      group.add(ring);
    }
  }

  return group;
}

// ── Internal Three.js context ─────────────────────────────────────────────────
interface ThreeCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  partGroup: THREE.Group | null;
  animId: number;
  ro: ResizeObserver;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PartViewer3D({
  part,
  isDark,
  previewHeight,
}: {
  part: CadPart;
  isDark: boolean;
  previewHeight?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<ThreeCtx | null>(null);
  const lastPartIdRef = useRef<string | null>(null);

  // ── Create renderer / scene / controls (once per isDark) ─────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(isDark ? 0x0f172a : 0xf1f5f9);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 20000);
    camera.position.set(400, 400, 500);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(400, 600, 400);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    const ro = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    ctxRef.current = { renderer, scene, camera, controls, partGroup: null, animId, ro };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      ctxRef.current = null;
    };
  }, [isDark]);

  // ── Rebuild geometry on part / previewHeight change ───────────────────────
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const effectiveH = previewHeight !== undefined ? previewHeight : (part.extrude?.height ?? 0);

    // Dispose old group
    if (ctx.partGroup) {
      ctx.scene.remove(ctx.partGroup);
      ctx.partGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      ctx.partGroup = null;
    }

    // Remove previous helpers
    ctx.scene.children
      .filter((c) => c instanceof THREE.GridHelper || c instanceof THREE.AxesHelper)
      .forEach((c) => ctx.scene.remove(c));

    if (!part.extrude || !part.sketch || effectiveH <= 0) return;

    const group = buildPartGroup(part, effectiveH);
    ctx.scene.add(group);
    ctx.partGroup = group;

    // Bounding info for camera & grid
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 80);

    // Grid + axes
    ctx.scene.add(new THREE.GridHelper(maxDim * 3, 12,
      isDark ? 0x334155 : 0xcbd5e1, isDark ? 0x1e293b : 0xe2e8f0));
    ctx.scene.add(new THREE.AxesHelper(maxDim * 0.8));

    // Update camera frustum
    ctx.camera.near = 1;
    ctx.camera.far = maxDim * 30;
    ctx.camera.updateProjectionMatrix();

    // Reposition camera only when the part changes (not when height is tweaked)
    const isNewPart = lastPartIdRef.current !== part.id;
    if (isNewPart) {
      ctx.camera.position.set(
        center.x + maxDim * 1.5,
        center.y + maxDim * 1.2,
        center.z + maxDim * 1.5,
      );
      ctx.controls.target.copy(center);
      ctx.controls.update();
      lastPartIdRef.current = part.id;
    }
  }, [part, previewHeight, isDark]);

  return (
    <Box ref={mountRef} data-tut="part-3d-canvas" sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Axis legend */}
      <Box sx={{
        position: 'absolute', bottom: 10, right: 10, zIndex: 10,
        bgcolor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
        borderRadius: 1, px: '8px', py: '5px',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {[['X', '#FF4444'], ['Y', '#44FF44'], ['Z', '#4488FF']].map(([axis, color]) => (
          <Box key={axis} sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Box sx={{ width: 14, height: 2, bgcolor: color, borderRadius: 1 }} />
            <Box component="span" sx={{ fontSize: 9, fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B' }}>
              {axis}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
