import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box } from "@mui/material";
import type { CadPart, PlacedInstance, EdgeInfo } from "./types";
import { buildExtrudeMeshes } from "./PartViewer3D";
import { partColor, partColorCSS } from "./cadUtils";

export { partColor, partColorCSS };

// ── Edge ring helpers ─────────────────────────────────────────────────────────
const C_DEFAULT = 0x888888;
const C_HOVER = 0xfbbf24;
const C_SEL1 = 0x3b82f6;
const C_SEL2 = 0x22c55e;
const C_ASSEMBLED = 0xf97316;

function makeCircleEdge(r: number, cx: number, cz: number, y: number) {
  const line = new THREE.Mesh(
    new THREE.TorusGeometry(r, 2, 6, 72),
    new THREE.MeshBasicMaterial({ color: C_DEFAULT }),
  );
  line.rotation.x = Math.PI / 2;
  line.position.set(cx, y, cz);

  const hitR = Math.max(r * 0.08, 6);
  const hit = new THREE.Mesh(
    new THREE.TorusGeometry(r, hitR, 6, 64),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hit.rotation.x = Math.PI / 2;
  hit.position.set(cx, y, cz);

  return { line, hit };
}

// ── Compute EdgeInfo for a part ───────────────────────────────────────────────
export function computeEdges(part: CadPart): EdgeInfo[] {
  if (!part.extrude || !part.sketch) return [];
  const { extrude, sketch } = part;
  const h = extrude.height;
  const pm = new Map(sketch.points.map((p) => [p.id, p]));
  const edges: EdgeInfo[] = [];

  extrude.circleIds.forEach((cid, ci) => {
    const c = sketch.circles.find((x) => x.id === cid);
    if (!c) return;
    for (const side of ["top", "bottom"] as const) {
      edges.push({
        id: `circ-${ci}-${side}`,
        kind: "circle",
        metric: c.r,
        localY: side === "top" ? h : 0,
        side,
        cx: c.cx,
        cz: c.cy,
      });
    }
  });

  // Hole circle inner rims (inside solid shapes)
  const holeCircles = sketch.circles.filter((c) => c.isHole);
  holeCircles.forEach((hc, hci) => {
    const insideSolid =
      extrude.circleIds.some((cid) => {
        const c = sketch.circles.find((x) => x.id === cid);
        if (!c || c.isHole) return false;
        return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) + hc.r <= c.r + 0.1;
      }) ||
      extrude.loops.some((loop) => {
        const pts = loop.map((pid) => pm.get(pid)).filter(Boolean) as {
          x: number;
          y: number;
        }[];
        if (pts.length < 3) return false;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x,
            yi = pts[i].y,
            xj = pts[j].x,
            yj = pts[j].y;
          if (
            yi > hc.cy !== yj > hc.cy &&
            hc.cx < ((xj - xi) * (hc.cy - yi)) / (yj - yi) + xi
          )
            inside = !inside;
        }
        return inside;
      });
    if (!insideSolid) return;
    for (const side of ["top", "bottom"] as const) {
      edges.push({
        id: `hole-${hci}-${side}`,
        kind: "circle",
        metric: hc.r,
        localY: side === "top" ? h : 0,
        side,
        cx: hc.cx,
        cz: hc.cy,
      });
    }
  });

  extrude.loops.forEach((loop, li) => {
    for (const side of ["top", "bottom"] as const) {
      const y = side === "top" ? h : 0;
      for (let ei = 0; ei < loop.length; ei++) {
        const p1 = pm.get(loop[ei]);
        const p2 = pm.get(loop[(ei + 1) % loop.length]);
        if (!p1 || !p2) continue;
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        edges.push({
          id: `poly-${li}-${side}-${ei}`,
          kind: "polygon-edge",
          metric: len,
          localY: y,
          side,
        });
      }
    }
  });

  return edges;
}

// ── Build Three.js group for a part ──────────────────────────────────────────
export interface PartObj {
  instanceId: string;
  group: THREE.Group;
  bodyMeshes: THREE.Mesh[];
  edgeObjs: { edgeId: string; line: THREE.Mesh; hit: THREE.Mesh }[];
  edges: EdgeInfo[];
}

export function buildPartObj(inst: PlacedInstance, part: CadPart): PartObj {
  const group = new THREE.Group();
  const bodyMeshes: THREE.Mesh[] = [];
  const edgeObjs: PartObj["edgeObjs"] = [];

  const col = partColor(part.id);

  if (part.extrude && part.sketch) {
    const { extrude, sketch } = part;
    const h = extrude.height;
    const pm = new Map(sketch.points.map((p) => [p.id, p]));

    // Body meshes (hole-aware)
    for (const mesh of buildExtrudeMeshes(sketch, extrude, h, col)) {
      bodyMeshes.push(mesh);
      group.add(mesh);
    }

    // Edge objects for interaction (circles — solid and hole inner rim)
    extrude.circleIds.forEach((cid, ci) => {
      const c = sketch.circles.find((x) => x.id === cid);
      if (!c) return;
      for (const side of ["top", "bottom"] as const) {
        const y = side === "top" ? h : 0;
        const edgeId = `circ-${ci}-${side}`;
        const { line, hit } = makeCircleEdge(c.r, c.cx, c.cy, y);
        group.add(line);
        group.add(hit);
        edgeObjs.push({ edgeId, line, hit });
      }
    });

    // Hole circle inner rim edges
    const holeSketchCircles = sketch.circles.filter((c) => c.isHole);
    holeSketchCircles.forEach((hc, hci) => {
      const insideSolid =
        extrude.circleIds.some((cid) => {
          const c = sketch.circles.find((x) => x.id === cid);
          if (!c || c.isHole) return false;
          return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) + hc.r <= c.r + 0.1;
        }) ||
        extrude.loops.some((loop) => {
          const pts = loop.map((pid) => pm.get(pid)).filter(Boolean) as {
            x: number;
            y: number;
          }[];
          if (pts.length < 3) return false;
          let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x,
              yi = pts[i].y,
              xj = pts[j].x,
              yj = pts[j].y;
            if (
              yi > hc.cy !== yj > hc.cy &&
              hc.cx < ((xj - xi) * (hc.cy - yi)) / (yj - yi) + xi
            )
              inside = !inside;
          }
          return inside;
        });
      if (!insideSolid) return;
      for (const side of ["top", "bottom"] as const) {
        const y = side === "top" ? h : 0;
        const edgeId = `hole-${hci}-${side}`;
        const { line, hit } = makeCircleEdge(hc.r, hc.cx, hc.cy, y);
        group.add(line);
        group.add(hit);
        edgeObjs.push({ edgeId, line, hit });
      }
    });

    // Edge objects for interaction (polygon loops)
    extrude.loops.forEach((loop, li) => {
      for (const side of ["top", "bottom"] as const) {
        const y = side === "top" ? h : 0;
        for (let ei = 0; ei < loop.length; ei++) {
          const p1 = pm.get(loop[ei]);
          const p2 = pm.get(loop[(ei + 1) % loop.length]);
          if (!p1 || !p2) continue;
          const edgeId = `poly-${li}-${side}-${ei}`;
          const mx = (p1.x + p2.x) / 2;
          const mz = (p1.y + p2.y) / 2;
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          const line = new THREE.Mesh(
            new THREE.BoxGeometry(len, 3, 3),
            new THREE.MeshBasicMaterial({ color: C_DEFAULT }),
          );
          line.position.set(mx, y, mz);
          line.rotation.y = -angle;
          group.add(line);

          const hit = new THREE.Mesh(
            new THREE.BoxGeometry(len, 12, 12),
            new THREE.MeshBasicMaterial({
              transparent: true,
              opacity: 0,
              depthWrite: false,
            }),
          );
          hit.position.set(mx, y, mz);
          hit.rotation.y = -angle;
          group.add(hit);

          edgeObjs.push({ edgeId, line, hit });
        }
      }
    });
  }

  const [px, py, pz] = inst.position;
  group.position.set(px, py, pz);
  group.rotation.x = inst.rotX;

  const edges = computeEdges(part);
  return { instanceId: inst.instanceId, group, bodyMeshes, edgeObjs, edges };
}

// ── Scene state ───────────────────────────────────────────────────────────────
interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  partObjs: Map<string, PartObj>;
  hoveredEdge: { instanceId: string; edgeId: string } | null;
  selectedEdges: { instanceId: string; edgeId: string }[];
  assembledEdges: Set<string>;
  ghostPartId: string | null;
  ghostGroup: THREE.Group | null;
  animId: number;
  ro: ResizeObserver;
  cleanup: () => void;
}

export interface AssemblyCallbacks {
  onSelectionChange: (edges: { instanceId: string; edgeId: string }[]) => void;
  onInstanceClick: (instanceId: string) => void;
  onGhostPlace: (partId: string, pos: [number, number, number]) => void;
}

// ── Init scene ────────────────────────────────────────────────────────────────
export function initAssemblyScene(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  isDark: boolean,
  instances: PlacedInstance[],
  parts: CadPart[],
  assembledEdgeSet: Set<string>,
  cb: AssemblyCallbacks,
): SceneState {
  const w = container.clientWidth || 700;
  const h = container.clientHeight || 500;

  // Use the provided canvas — React owns the DOM node, do NOT appendChild/removeChild
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h, false); // false = don't override CSS; canvas fills container via CSS
  renderer.setClearColor(isDark ? 0x0f172a : 0xf1f5f9);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 1, 8000);
  camera.position.set(350, 400, 750);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
  dir1.position.set(300, 500, 300);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
  dir2.position.set(-200, 100, -200);
  scene.add(dir2);

  scene.add(
    new THREE.GridHelper(
      1400,
      28,
      isDark ? 0x334155 : 0xcbd5e1,
      isDark ? 0x1e293b : 0xe2e8f0,
    ),
  );
  scene.add(new THREE.AxesHelper(160));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0, 0);

  const raycaster = new THREE.Raycaster();
  const partObjs = new Map<string, PartObj>();

  for (const inst of instances) {
    const part = parts.find((p) => p.id === inst.partId);
    if (!part) continue;
    const obj = buildPartObj(inst, part);
    obj.edgeObjs.forEach(({ edgeId, hit }) => {
      hit.userData = { instanceId: inst.instanceId, edgeId };
    });
    scene.add(obj.group);
    partObjs.set(inst.instanceId, obj);
  }

  const state: SceneState = {
    renderer,
    scene,
    camera,
    controls,
    raycaster,
    partObjs,
    hoveredEdge: null,
    selectedEdges: [],
    assembledEdges: new Set(assembledEdgeSet),
    ghostPartId: null,
    ghostGroup: null,
    animId: 0,
    ro: new ResizeObserver(() => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      if (rw === 0 || rh === 0) return;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
    }),
    cleanup: () => {},
  };

  const allHitMeshes = () =>
    [...partObjs.values()].flatMap((o) => o.edgeObjs.map((e) => e.hit));

  const allBodyMeshes = () =>
    [...partObjs.values()].flatMap((o) => o.bodyMeshes);

  const updateEdgeColors = () => {
    for (const [, obj] of partObjs) {
      for (const { edgeId, line } of obj.edgeObjs) {
        const key = `${obj.instanceId}:${edgeId}`;
        const mat = line.material as THREE.MeshBasicMaterial;
        const selIdx = state.selectedEdges.findIndex(
          (s) => s.instanceId === obj.instanceId && s.edgeId === edgeId,
        );
        if (selIdx === 0) mat.color.setHex(C_SEL1);
        else if (selIdx === 1) mat.color.setHex(C_SEL2);
        else if (
          state.hoveredEdge?.instanceId === obj.instanceId &&
          state.hoveredEdge?.edgeId === edgeId
        )
          mat.color.setHex(C_HOVER);
        else if (state.assembledEdges.has(key)) mat.color.setHex(C_ASSEMBLED);
        else mat.color.setHex(C_DEFAULT);
      }
    }
  };

  const getNDC = (e: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  };

  const getWorldXZ = (e: MouseEvent): [number, number] => {
    const ndc = getNDC(e);
    raycaster.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, pt);
    return hit ? [pt.x, pt.z] : [0, 0];
  };

  // ── Ghost mode ──
  const cancelGhost = () => {
    if (state.ghostGroup) {
      scene.remove(state.ghostGroup);
      state.ghostGroup = null;
    }
    state.ghostPartId = null;
    controls.enabled = true;
    renderer.domElement.style.cursor = "default";
  };

  const onMouseMove = (e: MouseEvent) => {
    if (state.ghostGroup) {
      const [wx, wz] = getWorldXZ(e);
      state.ghostGroup.position.set(wx, 0, wz);
      return;
    }

    raycaster.setFromCamera(getNDC(e), camera);
    const hits = raycaster.intersectObjects(allHitMeshes());
    const newHov =
      hits.length > 0
        ? (hits[0].object.userData as { instanceId: string; edgeId: string })
        : null;

    if (
      newHov?.instanceId !== state.hoveredEdge?.instanceId ||
      newHov?.edgeId !== state.hoveredEdge?.edgeId
    ) {
      state.hoveredEdge = newHov;
      updateEdgeColors();
    }
    renderer.domElement.style.cursor = newHov ? "pointer" : "default";
  };

  const onClick = (e: MouseEvent) => {
    // Ghost placement
    if (state.ghostPartId) {
      const [wx, wz] = getWorldXZ(e);
      const pid = state.ghostPartId;
      cancelGhost();
      cb.onGhostPlace(pid, [wx, 0, wz]);
      return;
    }

    raycaster.setFromCamera(getNDC(e), camera);

    // Edge selection
    const edgeHits = raycaster.intersectObjects(allHitMeshes());
    if (edgeHits.length > 0) {
      const ud = edgeHits[0].object.userData as {
        instanceId: string;
        edgeId: string;
      };
      const sel = state.selectedEdges;
      const idx = sel.findIndex(
        (s) => s.instanceId === ud.instanceId && s.edgeId === ud.edgeId,
      );
      if (idx >= 0) {
        state.selectedEdges = sel.filter((_, i) => i !== idx);
      } else {
        const filtered = sel.filter((s) => s.instanceId !== ud.instanceId);
        state.selectedEdges =
          filtered.length >= 2 ? [filtered[1], ud] : [...filtered, ud];
      }
      updateEdgeColors();
      cb.onSelectionChange([...state.selectedEdges]);
      return;
    }

    // Body click → instance selection
    const bodyHits = raycaster.intersectObjects(allBodyMeshes());
    if (bodyHits.length > 0) {
      for (const [iid, obj] of partObjs) {
        if (obj.bodyMeshes.includes(bodyHits[0].object as THREE.Mesh)) {
          cb.onInstanceClick(iid);
          return;
        }
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (state.ghostPartId) {
        cancelGhost();
        return;
      }
      state.selectedEdges = [];
      updateEdgeColors();
      cb.onSelectionChange([]);
    }
  };

  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);
  state.ro.observe(container);

  const animate = () => {
    state.animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  state.cleanup = () => {
    cancelAnimationFrame(state.animId);
    state.ro.disconnect();
    renderer.domElement.removeEventListener("mousemove", onMouseMove);
    renderer.domElement.removeEventListener("click", onClick);
    window.removeEventListener("keydown", onKeyDown);
    controls.dispose();
    renderer.dispose();
    // canvas is owned by React — do NOT removeChild
  };

  return state;
}

// ── SceneAPI ──────────────────────────────────────────────────────────────────
export interface SceneAPI {
  addInstance: (inst: PlacedInstance, part: CadPart) => void;
  removeInstance: (instanceId: string) => void;
  startGhost: (partId: string, part: CadPart) => void;
  cancelGhost: () => void;
  assemble: (
    aInstId: string,
    aEdgeId: string,
    bInstId: string,
    bEdgeId: string,
  ) => {
    success: boolean;
    error?: string;
    moverPos?: [number, number, number];
  };
  disassemble: (instanceId: string, initPos: [number, number, number]) => void;
  rotateAtEdge: (instanceId: string, edgeId: string, deg: number) => void;
  canAssemble: (
    aInstId: string,
    aEdgeId: string,
    bInstId: string,
    bEdgeId: string,
  ) => boolean;
  clearSelection: () => void;
  setCameraPosition: (
    pos: [number, number, number],
    target: [number, number, number],
  ) => void;
}

function fitCameraToScene(st: SceneState) {
  if (st.partObjs.size === 0) return;
  const box = new THREE.Box3();
  for (const [, obj] of st.partObjs) {
    box.expandByObject(obj.group);
  }
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 100);
  st.camera.position.set(
    center.x + maxDim * 1.8,
    center.y + maxDim * 1.4,
    center.z + maxDim * 1.8,
  );
  st.controls.target.copy(center);
  st.controls.update();
}

export function makeSceneAPI(st: SceneState): SceneAPI {
  const updateColors = () => {
    for (const [, obj] of st.partObjs) {
      for (const { edgeId, line } of obj.edgeObjs) {
        const key = `${obj.instanceId}:${edgeId}`;
        const mat = line.material as THREE.MeshBasicMaterial;
        const selIdx = st.selectedEdges.findIndex(
          (s) => s.instanceId === obj.instanceId && s.edgeId === edgeId,
        );
        if (selIdx === 0) mat.color.setHex(C_SEL1);
        else if (selIdx === 1) mat.color.setHex(C_SEL2);
        else if (
          st.hoveredEdge?.instanceId === obj.instanceId &&
          st.hoveredEdge?.edgeId === edgeId
        )
          mat.color.setHex(C_HOVER);
        else if (st.assembledEdges.has(key)) mat.color.setHex(C_ASSEMBLED);
        else mat.color.setHex(C_DEFAULT);
      }
    }
  };

  return {
    addInstance(inst, part) {
      if (st.partObjs.has(inst.instanceId)) return;
      const obj = buildPartObj(inst, part);
      obj.edgeObjs.forEach(({ edgeId, hit }) => {
        hit.userData = { instanceId: inst.instanceId, edgeId };
      });
      st.scene.add(obj.group);
      st.partObjs.set(inst.instanceId, obj);
      fitCameraToScene(st);
    },

    removeInstance(instanceId) {
      const obj = st.partObjs.get(instanceId);
      if (!obj) return;
      st.scene.remove(obj.group);
      st.partObjs.delete(instanceId);
      st.selectedEdges = st.selectedEdges.filter(
        (s) => s.instanceId !== instanceId,
      );
      updateColors();
    },

    startGhost(partId, part) {
      // Remove existing ghost
      if (st.ghostGroup) st.scene.remove(st.ghostGroup);

      const tmpInst: PlacedInstance = {
        instanceId: "__ghost__",
        partId,
        position: [0, 0, 0],
        rotX: 0,
        links: [],
      };
      const obj = buildPartObj(tmpInst, part);
      obj.group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const m = o.material as THREE.Material;
          m.transparent = true;
          (m as THREE.MeshStandardMaterial).opacity = 0.5;
        }
      });
      st.scene.add(obj.group);
      st.ghostGroup = obj.group;
      st.ghostPartId = partId;
      // Disable orbit so left-click places part instead of orbiting
      st.controls.enabled = false;
      st.renderer.domElement.style.cursor = "crosshair";
    },

    cancelGhost() {
      if (st.ghostGroup) {
        st.scene.remove(st.ghostGroup);
        st.ghostGroup = null;
      }
      st.ghostPartId = null;
      st.controls.enabled = true;
      st.renderer.domElement.style.cursor = "default";
    },

    assemble(aInstId, aEdgeId, bInstId, bEdgeId) {
      const aObj = st.partObjs.get(aInstId);
      const bObj = st.partObjs.get(bInstId);
      if (!aObj || !bObj) return { success: false, error: "인스턴스 없음" };

      const aEdge = aObj.edges.find((e) => e.id === aEdgeId);
      const bEdge = bObj.edges.find((e) => e.id === bEdgeId);
      if (!aEdge || !bEdge) return { success: false, error: "엣지 없음" };
      if (aEdge.kind !== bEdge.kind)
        return {
          success: false,
          error: `형태 불일치 (${aEdge.kind === "circle" ? "원형" : "직선"} ↔ ${bEdge.kind === "circle" ? "원형" : "직선"})`,
        };
      if (Math.abs(aEdge.metric - bEdge.metric) > 1)
        return {
          success: false,
          error: `크기 불일치 (${aEdge.metric.toFixed(0)} ≠ ${bEdge.metric.toFixed(0)})`,
        };

      const aHit = aObj.edgeObjs.find((e) => e.edgeId === aEdgeId)?.hit;
      const bHit = bObj.edgeObjs.find((e) => e.edgeId === bEdgeId)?.hit;
      if (!aHit || !bHit) return { success: false, error: "엣지 메시 없음" };

      const aWorldPos = new THREE.Vector3();
      aHit.getWorldPosition(aWorldPos);

      // Position bObj so bHit's world position aligns with aWorldPos.
      // bHit.position is local to bObj.group (assuming group.rotation.x = 0).
      bObj.group.position.set(
        aWorldPos.x - bHit.position.x,
        aWorldPos.y - bHit.position.y,
        aWorldPos.z - bHit.position.z,
      );
      bObj.group.rotation.x = 0;

      const moverPos = bObj.group.position.toArray() as [
        number,
        number,
        number,
      ];
      st.assembledEdges.add(`${aInstId}:${aEdgeId}`);
      st.assembledEdges.add(`${bInstId}:${bEdgeId}`);
      st.selectedEdges = [];
      updateColors();

      return { success: true, moverPos };
    },

    disassemble(instanceId, initPos) {
      const obj = st.partObjs.get(instanceId);
      if (!obj) return;
      obj.group.position.set(...initPos);
      obj.group.rotation.x = 0;
      for (const key of [...st.assembledEdges]) {
        if (key.startsWith(`${instanceId}:`)) st.assembledEdges.delete(key);
      }
      st.selectedEdges = st.selectedEdges.filter(
        (s) => s.instanceId !== instanceId,
      );
      updateColors();
    },

    rotateAtEdge(instanceId, edgeId, deg) {
      const obj = st.partObjs.get(instanceId);
      if (!obj) return;
      const hit = obj.edgeObjs.find((e) => e.edgeId === edgeId)?.hit;
      if (!hit) return;
      const pivot = new THREE.Vector3();
      hit.getWorldPosition(pivot);
      const rad = (deg * Math.PI) / 180;
      const offset = obj.group.position.clone().sub(pivot);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), rad);
      obj.group.position.copy(pivot).add(offset);
      obj.group.rotation.x += rad;
    },

    canAssemble(aInstId, aEdgeId, bInstId, bEdgeId) {
      const aObj = st.partObjs.get(aInstId);
      const bObj = st.partObjs.get(bInstId);
      if (!aObj || !bObj) return false;
      const aEdge = aObj.edges.find((e) => e.id === aEdgeId);
      const bEdge = bObj.edges.find((e) => e.id === bEdgeId);
      if (!aEdge || !bEdge) return false;
      return (
        aEdge.kind === bEdge.kind && Math.abs(aEdge.metric - bEdge.metric) <= 1
      );
    },

    clearSelection() {
      st.selectedEdges = [];
      updateColors();
    },

    setCameraPosition(pos, target) {
      const from = st.camera.position.clone();
      const fromT = st.controls.target.clone();
      const to = new THREE.Vector3(...pos);
      const toT = new THREE.Vector3(...target);
      const dur = 900;
      const t0 = performance.now();
      const tick = () => {
        const elapsed = Math.min((performance.now() - t0) / dur, 1);
        const e =
          elapsed < 0.5
            ? 2 * elapsed * elapsed
            : -1 + (4 - 2 * elapsed) * elapsed;
        st.camera.position.lerpVectors(from, to, e);
        st.controls.target.lerpVectors(fromT, toT, e);
        st.controls.update();
        if (elapsed < 1) requestAnimationFrame(tick);
      };
      tick();
    },
  };
}

// ── React component ───────────────────────────────────────────────────────────
interface Props {
  isDark: boolean;
  instances: PlacedInstance[];
  parts: CadPart[];
  onSelectionChange: (edges: { instanceId: string; edgeId: string }[]) => void;
  onInstanceClick: (instanceId: string) => void;
  onGhostPlace: (partId: string, pos: [number, number, number]) => void;
  sceneAPIRef: { current: SceneAPI | null };
}

export default function AssemblyScene({
  isDark,
  instances,
  parts,
  onSelectionChange,
  onInstanceClick,
  onGhostPlace,
  sceneAPIRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  const cbRef = useRef({ onSelectionChange, onInstanceClick, onGhostPlace });
  useEffect(() => {
    cbRef.current = { onSelectionChange, onInstanceClick, onGhostPlace };
  });

  const stableOnSelection = useCallback(
    (e: { instanceId: string; edgeId: string }[]) =>
      cbRef.current.onSelectionChange(e),
    [],
  );
  const stableOnInstClick = useCallback(
    (id: string) => cbRef.current.onInstanceClick(id),
    [],
  );
  const stableOnGhostPlace = useCallback(
    (pid: string, pos: [number, number, number]) =>
      cbRef.current.onGhostPlace(pid, pos),
    [],
  );

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const assembled = new Set<string>();
    instances.forEach((inst) =>
      inst.links.forEach((l) => {
        assembled.add(`${inst.instanceId}:${l.myEdgeId}`);
        assembled.add(`${l.targetInstanceId}:${l.targetEdgeId}`);
      }),
    );

    const st = initAssemblyScene(
      containerRef.current,
      canvasRef.current,
      isDark,
      instances,
      parts,
      assembled,
      {
        onSelectionChange: stableOnSelection,
        onInstanceClick: stableOnInstClick,
        onGhostPlace: stableOnGhostPlace,
      },
    );

    stateRef.current = st;
    sceneAPIRef.current = makeSceneAPI(st);

    return () => {
      sceneAPIRef.current = null;
      stateRef.current = null;
      st.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </Box>
  );
}
