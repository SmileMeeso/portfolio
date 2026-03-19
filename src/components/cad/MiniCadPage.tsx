import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "parts" | "assembly" | "blueprint";
type PartType = "cup" | "tube" | "solid";

const PART_SPEC = {
  cup: {
    label: "컵형 원통",
    desc: "높이 240 / 지름 160 / 양쪽 막힘",
    h: 240,
    or: 80,
    ir: 0,
    ct: true,
    cb: true,
  },
  tube: {
    label: "중공 원통",
    desc: "높이 160 / 외경 160 / 내경 40 / 양쪽 열림",
    h: 160,
    or: 80,
    ir: 20,
    ct: false,
    cb: false,
  },
  solid: {
    label: "원통형 기둥",
    desc: "높이 180 / 지름 40 / 양쪽 막힘",
    h: 180,
    or: 20,
    ir: 0,
    ct: true,
    cb: true,
  },
} as const;

const PART_COLOR_HEX: Record<PartType, number> = {
  cup: 0x4a90d9,
  tube: 0x50c878,
  solid: 0xe87070,
};
const PART_COLOR_CSS: Record<PartType, string> = {
  cup: "#4A90D9",
  tube: "#50C878",
  solid: "#E87070",
};

const C_DEFAULT = 0x888888;
const C_HOVER = 0xfbbf24; // 호버: 앰버/노랑 (조립 엣지 오렌지와 구분)
const C_SEL1 = 0x3b82f6;
const C_SEL2 = 0x22c55e;
const C_LOCKED = 0x444444;
const C_ASSEMBLED = 0xf97316; // 조립됨 (비컵) — 클릭하면 해제 가능

interface EdgeMeta {
  id: string;
  partId: string;
  label: string;
  localY: number;
  radius: number;
  kind: "outer" | "inner";
  side: "top" | "bottom";
  lineMesh: THREE.Mesh; // 시각 표시 (얇은 토러스 ~3px)
  hitMesh: THREE.Mesh; // 레이캐스팅용 (투명)
}

interface PartInst {
  id: string;
  type: PartType;
  group: THREE.Group;
  bodyMeshes: THREE.Mesh[];
  edges: EdgeMeta[];
}

interface AssembleResult {
  success: boolean;
  error?: string;
}

interface SceneCtx {
  parts: PartInst[];
  assemble: (aId: string, bId: string) => AssembleResult;
  disassemble: (partId: string) => boolean;
  rotatePartAtEdge: (edgeId: string, deg: number) => void;
  getRotatablePartForEdge: (edgeId: string) => string | null;
  getAssemblyPairForEdge: (
    edgeId: string,
  ) => { moverLabel: string; anchorLabel: string } | null;
  getDisassemblePartForEdge: (edgeId: string) => string | null;
  setPartHover: (t: PartType | null) => void;
  getPartPositions: () => Record<PartType, [number, number, number]>;
  isPartLocked: (partId: string) => boolean;
  resetAll: () => void;
  runDemo: (onStep: (label: string) => void, onDone: () => void) => void;
  stopDemo: () => void;
  cleanup: () => void;
}

// ─── 엣지 링 생성 (얇은 Torus, ~3px 두께) ────────────────────────────────────
function makeEdgeRing(r: number, color: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(r, 2, 6, 72);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// ─── Part geometry builder ────────────────────────────────────────────────────
// 바닥 원 중앙 = local (0, 0, 0)
function buildPart(type: PartType) {
  const s = PART_SPEC[type];
  const col = PART_COLOR_HEX[type];
  const halfH = s.h / 2;
  const group = new THREE.Group();
  const bodyMeshes: THREE.Mesh[] = [];
  const edgeMetas: Omit<EdgeMeta, "id" | "partId">[] = [];

  const mat = (side: THREE.Side = THREE.DoubleSide) =>
    new THREE.MeshStandardMaterial({
      color: col,
      side,
      roughness: 0.45,
      metalness: 0.2,
    });

  const addMesh = (geo: THREE.BufferGeometry, m: THREE.Material) => {
    const mesh = new THREE.Mesh(geo, m);
    bodyMeshes.push(mesh);
    group.add(mesh);
    return mesh;
  };

  if (type === "cup") {
    const cyl = addMesh(
      new THREE.CylinderGeometry(s.or, s.or, s.h, 64, 1, true),
      mat(),
    );
    cyl.position.y = halfH;
    const bot = addMesh(new THREE.CircleGeometry(s.or, 64), mat());
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = 0;
    const top = addMesh(new THREE.CircleGeometry(s.or, 64), mat());
    top.rotation.x = -Math.PI / 2;
    top.position.y = s.h;
  } else if (type === "tube") {
    const cyl = addMesh(
      new THREE.CylinderGeometry(s.or, s.or, s.h, 64, 1, true),
      mat(),
    );
    cyl.position.y = halfH;
    const inner = addMesh(
      new THREE.CylinderGeometry(s.ir, s.ir, s.h, 64, 1, true),
      mat(THREE.BackSide),
    );
    inner.position.y = halfH;
    const topRing = addMesh(new THREE.RingGeometry(s.ir, s.or, 64), mat());
    topRing.rotation.x = -Math.PI / 2;
    topRing.position.y = s.h;
    const botRing = addMesh(new THREE.RingGeometry(s.ir, s.or, 64), mat());
    botRing.rotation.x = -Math.PI / 2;
    botRing.position.y = 0;
  } else {
    const cyl = addMesh(
      new THREE.CylinderGeometry(s.or, s.or, s.h, 64, 1, true),
      mat(),
    );
    cyl.position.y = halfH;
    const top = addMesh(new THREE.CircleGeometry(s.or, 64), mat());
    top.rotation.x = -Math.PI / 2;
    top.position.y = s.h;
    const bot = addMesh(new THREE.CircleGeometry(s.or, 64), mat());
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = 0;
  }

  // 엣지 추가: 1px LineLoop(시각) + 투명 Torus(hit)
  const addEdge = (
    r: number,
    localY: number,
    label: string,
    kind: "outer" | "inner",
    side: "top" | "bottom",
  ) => {
    // 얇은 토러스 (~3px 두께)
    const lineMesh = makeEdgeRing(r, C_DEFAULT);
    lineMesh.position.y = localY;
    group.add(lineMesh);

    // 레이캐스팅용 (화면에 보이지 않음)
    const hitR = Math.max(r * 0.08, 6);
    const hitGeo = new THREE.TorusGeometry(r, hitR, 6, 64);
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.rotation.x = Math.PI / 2;
    hitMesh.position.y = localY;
    group.add(hitMesh);

    edgeMetas.push({ label, localY, radius: r, kind, side, lineMesh, hitMesh });
  };

  addEdge(s.or, 0, "바닥 외경", "outer", "bottom");
  addEdge(s.or, s.h, "상단 외경", "outer", "top");
  if (s.ir > 0) {
    addEdge(s.ir, 0, "바닥 내경", "inner", "bottom");
    addEdge(s.ir, s.h, "상단 내경", "inner", "top");
  }

  return { group, bodyMeshes, edgeMetas };
}

// ─── 조립 씬 초기화 ──────────────────────────────────────────────────────────
function initScene(
  container: HTMLDivElement,
  isDark: boolean,
  onSelection: (ids: string[]) => void,
  onEdgeHover: (type: PartType | null) => void,
): SceneCtx {
  const w = container.clientWidth || 600;
  const h = container.clientHeight || 500;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  renderer.setClearColor(isDark ? 0x0f172a : 0xf1f5f9);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 1, 8000);
  camera.position.set(350, 400, 750);
  camera.lookAt(100, 120, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(300, 500, 300);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
  dir2.position.set(-200, 100, -200);
  scene.add(dir2);

  const grid = new THREE.GridHelper(
    1400,
    28,
    isDark ? 0x334155 : 0xcbd5e1,
    isDark ? 0x1e293b : 0xe2e8f0,
  );
  scene.add(grid);
  scene.add(new THREE.AxesHelper(160));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 120, 0);

  const INIT_POS: Record<PartType, [number, number, number]> = {
    cup: [0, 0, 0],
    tube: [300, 0, 0],
    solid: [480, 0, 0],
  };

  const parts: PartInst[] = (["cup", "tube", "solid"] as PartType[]).map(
    (type) => {
      const { group, bodyMeshes, edgeMetas } = buildPart(type);
      const [x, y, z] = INIT_POS[type];
      group.position.set(x, y, z);
      scene.add(group);
      const id = `part-${type}`;
      const edges: EdgeMeta[] = edgeMetas.map((m, i) => {
        const edge = { ...m, id: `${id}-e${i}`, partId: id };
        edge.hitMesh.userData = { edgeId: edge.id, partId: id };
        return edge;
      });
      return { id, type, group, bodyMeshes, edges };
    },
  );

  const allHitMeshes = parts.flatMap((p) => p.edges.map((e) => e.hitMesh));
  const raycaster = new THREE.Raycaster();
  const lockedParts = new Set<string>(["part-cup"]);

  let hoveredEdgeId: string | null = null;
  let selectedIds: string[] = [];
  const assemblyMap = new Map<string, string>(); // anchorEdgeId → moverPartId
  const contactEdges = new Set<string>(); // 조립 시 맞닿은 엣지 IDs

  const updateColors = () => {
    parts.forEach((p) => {
      const locked = lockedParts.has(p.id);
      p.edges.forEach((e) => {
        const mat = e.lineMesh.material as THREE.MeshBasicMaterial;
        const i = selectedIds.indexOf(e.id);
        if (i === 0) mat.color.setHex(C_SEL1);
        else if (i === 1) mat.color.setHex(C_SEL2);
        else if (e.id === hoveredEdgeId) mat.color.setHex(C_HOVER);
        else if (contactEdges.has(e.id)) mat.color.setHex(C_ASSEMBLED);
        else if (locked) mat.color.setHex(C_LOCKED);
        else mat.color.setHex(C_DEFAULT);
      });
    });
  };

  const getMouseNDC = (e: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  };

  const onMouseMove = (e: MouseEvent) => {
    raycaster.setFromCamera(getMouseNDC(e), camera);
    const hits = raycaster.intersectObjects(allHitMeshes);
    const newHovered =
      hits.length > 0 ? (hits[0].object.userData.edgeId as string) : null;
    if (newHovered !== hoveredEdgeId) {
      hoveredEdgeId = newHovered;
      updateColors();
      const part = newHovered
        ? parts.find((p) => p.edges.some((e) => e.id === newHovered))
        : null;
      onEdgeHover(part?.type ?? null);
    }
    renderer.domElement.style.cursor = newHovered ? "pointer" : "default";
  };

  const onClick = (e: MouseEvent) => {
    raycaster.setFromCamera(getMouseNDC(e), camera);
    const hits = raycaster.intersectObjects(allHitMeshes);

    if (hits.length === 0) {
      // 빈 공간 클릭 → 선택 유지 (변경 없음)
      return;
    }

    const edgeId = hits[0].object.userData.edgeId as string;

    const allEdges = parts.flatMap((p) => p.edges);
    const clickedPartId = allEdges.find((e) => e.id === edgeId)?.partId;

    if (selectedIds.includes(edgeId)) {
      // 동일 엣지 재클릭 → 선택 해제
      selectedIds = selectedIds.filter((id) => id !== edgeId);
    } else {
      // 같은 부품의 기존 선택 제거 (부품당 최대 1개)
      selectedIds = selectedIds.filter((id) => {
        const e = allEdges.find((ed) => ed.id === id);
        return e?.partId !== clickedPartId;
      });
      // 최대 2개 (2개 차면 가장 오래된 것 교체)
      if (selectedIds.length >= 2) {
        selectedIds = [selectedIds[1], edgeId];
      } else {
        selectedIds = [...selectedIds, edgeId];
      }
    }
    updateColors();
    onSelection([...selectedIds]);
  };

  // Esc → 전체 선택 해제
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      selectedIds = [];
      updateColors();
      onSelection([]);
    }
  };

  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);

  let animId: number;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const ro = new ResizeObserver(() => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  ro.observe(container);

  const setPartHover = (type: PartType | null) => {
    parts.forEach((p) =>
      p.bodyMeshes.forEach((m) => {
        (m.material as THREE.MeshStandardMaterial).emissive.setHex(
          p.type === type ? 0x1a2e44 : 0x000000,
        );
      }),
    );
  };

  // ── 조립 로직 ──
  const assemble = (aId: string, bId: string): AssembleResult => {
    const allEdges = parts.flatMap((p) => p.edges);
    const edgeA = allEdges.find((e) => e.id === aId);
    const edgeB = allEdges.find((e) => e.id === bId);
    if (!edgeA || !edgeB)
      return { success: false, error: "엣지를 찾을 수 없습니다" };
    if (edgeA.partId === edgeB.partId)
      return { success: false, error: "같은 부품의 엣지입니다" };
    if (Math.abs(edgeA.radius - edgeB.radius) > 2)
      return {
        success: false,
        error: `반경 불일치 (${edgeA.radius} ≠ ${edgeB.radius})`,
      };

    const partAInst = parts.find((p) => p.id === edgeA.partId)!;
    const partBInst = parts.find((p) => p.id === edgeB.partId)!;

    let mover = partBInst,
      moverEdge = edgeB;
    let anchorEdge = edgeA;

    if (lockedParts.has(partBInst.id)) {
      if (lockedParts.has(partAInst.id))
        return { success: false, error: "두 부품 모두 이미 조립되어 있습니다" };
      mover = partAInst;
      moverEdge = edgeA;
      anchorEdge = edgeB;
    }

    const worldAnchor = new THREE.Vector3();
    anchorEdge.hitMesh.getWorldPosition(worldAnchor);

    const newY = worldAnchor.y - moverEdge.localY;
    const newX = worldAnchor.x;
    const newZ = worldAnchor.z;

    mover.group.position.set(newX, newY, newZ);
    mover.group.rotation.set(0, 0, 0);
    lockedParts.add(mover.id);
    assemblyMap.set(anchorEdge.id, mover.id);
    contactEdges.add(moverEdge.id);
    contactEdges.add(anchorEdge.id);

    selectedIds = [];
    updateColors();
    onSelection([]);
    return { success: true };
  };

  // 하위 조립 트리 전체를 delta만큼 이동 (조립 상태 유지)
  const moveSubAssembly = (pid: string, delta: THREE.Vector3) => {
    const p = parts.find((q) => q.id === pid);
    if (!p) return;
    p.group.position.add(delta);
    for (const e of p.edges) {
      const moverOnThis = assemblyMap.get(e.id);
      if (moverOnThis) moveSubAssembly(moverOnThis, delta);
    }
  };

  // 내부 분해 (콜백 없음) — 위에 올라간 부품은 같이 이동
  const disassembleInternal = (partId: string): boolean => {
    if (partId === "part-cup") return false;
    if (!lockedParts.has(partId)) return false;
    const part = parts.find((p) => p.id === partId);
    if (!part) return false;

    const oldPos = part.group.position.clone();
    const [ix, iy, iz] = INIT_POS[part.type];
    part.group.position.set(ix, iy, iz);
    part.group.rotation.set(0, 0, 0);

    // 하위 조립 전체를 같은 delta로 이동 (조립 상태는 유지)
    const delta = part.group.position.clone().sub(oldPos);
    for (const edge of part.edges) {
      const moverOnThis = assemblyMap.get(edge.id);
      if (moverOnThis) moveSubAssembly(moverOnThis, delta);
    }

    lockedParts.delete(partId);
    // 이 부품이 무버였던 관계(앵커의 assemblyMap + contactEdge) 제거
    for (const [key, val] of assemblyMap) {
      if (val === partId) {
        assemblyMap.delete(key);
        contactEdges.delete(key);
      }
    }
    // 이 부품의 무버 접촉 엣지 제거 (앵커로서 사용 중인 엣지는 유지)
    for (const edgeId of contactEdges) {
      if (part.edges.some((e) => e.id === edgeId) && !assemblyMap.has(edgeId)) {
        contactEdges.delete(edgeId);
      }
    }
    return true;
  };

  // 조립 해제: 초기 위치로 복원 (캐스케이드 포함)
  const disassemble = (partId: string): boolean => {
    const result = disassembleInternal(partId);
    if (result) {
      selectedIds = [];
      updateColors();
      onSelection([]);
    }
    return result;
  };

  const getPartPositions = (): Record<PartType, [number, number, number]> =>
    Object.fromEntries(
      parts.map((p) => [
        p.type,
        [p.group.position.x, p.group.position.y, p.group.position.z],
      ]),
    ) as Record<PartType, [number, number, number]>;

  // 접촉 엣지 위치를 피벗으로 X축 회전
  const rotatePartAtEdge = (edgeId: string, deg: number) => {
    const targetPartId = getRotatablePartForEdge(edgeId);
    if (!targetPartId) return;
    const part = parts.find((p) => p.id === targetPartId);
    if (!part) return;
    const allEdges = parts.flatMap((p) => p.edges);
    const pivotEdge = allEdges.find((e) => e.id === edgeId);
    if (!pivotEdge) return;
    const pivot = new THREE.Vector3();
    pivotEdge.hitMesh.getWorldPosition(pivot);
    const rad = (deg * Math.PI) / 180;
    const offset = part.group.position.clone().sub(pivot);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), rad);
    part.group.position.copy(pivot).add(offset);
    part.group.rotation.x += rad;
  };

  const getDisassemblePartForEdge = (edgeId: string): string | null => {
    const allEdges = parts.flatMap((p) => p.edges);
    const edge = allEdges.find((e) => e.id === edgeId);
    if (!edge) return null;
    const part = parts.find((p) => p.id === edge.partId);
    if (!part) return null;
    // 비컵 잠금 부품의 엣지 → 해당 부품 해제 (assemblyMap보다 우선)
    if (part.type !== "cup" && lockedParts.has(part.id)) return part.id;
    // 컵 등 고정 부품의 접촉 엣지 → 조립된 무버 해제
    return assemblyMap.get(edgeId) ?? null;
  };

  const getRotatablePartForEdge = (edgeId: string): string | null => {
    if (!contactEdges.has(edgeId)) return null;
    const allEdges = parts.flatMap((p) => p.edges);
    const edge = allEdges.find((e) => e.id === edgeId);
    if (!edge) return null;
    const part = parts.find((p) => p.id === edge.partId);
    if (!part) return null;
    // 비컵 잠금 부품의 접촉 엣지 → 해당 부품 회전
    if (part.type !== "cup" && lockedParts.has(part.id)) return part.id;
    // 앵커(컵) 접촉 엣지 → 붙어있는 무버 회전
    return assemblyMap.get(edgeId) ?? null;
  };

  const getAssemblyPairForEdge = (
    edgeId: string,
  ): { moverLabel: string; anchorLabel: string } | null => {
    if (!contactEdges.has(edgeId)) return null;
    const allEdges = parts.flatMap((p) => p.edges);
    const edge = allEdges.find((e) => e.id === edgeId);
    if (!edge) return null;
    const edgePart = parts.find((p) => p.id === edge.partId);
    if (!edgePart) return null;
    // 무버 쪽 엣지 클릭: assemblyMap에서 역방향으로 앵커 찾기
    if (edgePart.type !== "cup" && lockedParts.has(edgePart.id)) {
      for (const [anchorEdgeId, moverId] of assemblyMap) {
        if (moverId === edgePart.id) {
          const anchorEdge = allEdges.find((e) => e.id === anchorEdgeId);
          const anchorPart = parts.find((p) => p.id === anchorEdge?.partId);
          if (anchorPart)
            return {
              moverLabel: PART_SPEC[edgePart.type].label,
              anchorLabel: PART_SPEC[anchorPart.type].label,
            };
        }
      }
      return null;
    }
    // 앵커 쪽 엣지 클릭: assemblyMap에서 무버 찾기
    const moverId = assemblyMap.get(edgeId);
    if (!moverId) return null;
    const moverPart = parts.find((p) => p.id === moverId);
    if (!moverPart) return null;
    return {
      moverLabel: PART_SPEC[moverPart.type].label,
      anchorLabel: PART_SPEC[edgePart.type].label,
    };
  };

  // ── 전체 리셋 ──
  const resetAll = () => {
    parts.forEach((p) => {
      if (p.type !== "cup") {
        const [ix, iy, iz] = INIT_POS[p.type];
        p.group.position.set(ix, iy, iz);
        p.group.rotation.set(0, 0, 0);
      }
    });
    lockedParts.clear();
    lockedParts.add("part-cup");
    assemblyMap.clear();
    contactEdges.clear();
    selectedIds = [];
    updateColors();
    onSelection([]);
  };

  // ── 데모 ──
  let demoAbortController: AbortController | null = null;

  const stopDemo = () => {
    if (demoAbortController) {
      demoAbortController.abort();
      demoAbortController = null;
    }
    controls.enabled = true;
  };

  const runDemo = (onStep: (label: string) => void, onDone: () => void) => {
    stopDemo();
    resetAll();

    const ac = new AbortController();
    demoAbortController = ac;
    const { signal } = ac;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve();
          return;
        }
        const id = setTimeout(resolve, ms);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(id);
            resolve();
          },
          { once: true },
        );
      });

    const animateCamTo = (
      toPos: THREE.Vector3,
      toTarget: THREE.Vector3,
      duration: number,
    ) =>
      new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve();
          return;
        }
        const fromPos = camera.position.clone();
        const fromTarget = controls.target.clone();
        const start = performance.now();
        controls.enabled = false;
        const tick = () => {
          if (signal.aborted) {
            controls.enabled = true;
            resolve();
            return;
          }
          const raw = (performance.now() - start) / duration;
          const t = Math.min(raw, 1);
          const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          camera.position.lerpVectors(fromPos, toPos, e);
          controls.target.lerpVectors(fromTarget, toTarget, e);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            controls.enabled = true;
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

    const initialCamPos = new THREE.Vector3(350, 400, 750);
    const initialCamTarget = new THREE.Vector3(0, 120, 0);
    // 중공 원통 바닥 내경이 보이도록 거의 수직으로 내려다 봄
    const demoCamPos = new THREE.Vector3(30, 1200, 100);
    const demoCamTarget = new THREE.Vector3(0, 350, 0);

    const run = async () => {
      if (signal.aborted) return;
      onStep("① 컵형 원통 상단 외경 클릭");
      selectedIds = ["part-cup-e1"];
      updateColors();
      onSelection([...selectedIds]);
      await sleep(1200);

      if (signal.aborted) return;
      onStep("② 중공 원통 바닥 외경 클릭");
      selectedIds = ["part-cup-e1", "part-tube-e0"];
      updateColors();
      onSelection([...selectedIds]);
      await sleep(1200);

      if (signal.aborted) return;
      onStep("③ 조립하기");
      assemble("part-cup-e1", "part-tube-e0");
      await sleep(1000);

      if (signal.aborted) return;
      onStep("④ 원통형 기둥 바닥 외경 클릭");
      selectedIds = ["part-solid-e0"];
      updateColors();
      onSelection([...selectedIds]);
      await sleep(1200);

      if (signal.aborted) return;
      onStep("⑤ 카메라 회전 (중공 원통 바닥 내경 확인)");
      await animateCamTo(demoCamPos, demoCamTarget, 1200);
      await sleep(600);

      if (signal.aborted) return;
      onStep("⑥ 중공 원통 바닥 내경 클릭");
      selectedIds = ["part-solid-e0", "part-tube-e2"];
      updateColors();
      onSelection([...selectedIds]);
      await sleep(1200);

      if (signal.aborted) return;
      onStep("⑦ 카메라 복귀 후 조립하기");
      await animateCamTo(initialCamPos, initialCamTarget, 1000);
      await sleep(400);

      if (signal.aborted) return;
      assemble("part-solid-e0", "part-tube-e2");
      await sleep(600);

      if (signal.aborted) return;
      demoAbortController = null;
      onDone();
    };

    run().catch(() => {});
  };

  return {
    parts,
    assemble,
    disassemble,
    rotatePartAtEdge,
    getRotatablePartForEdge,
    getAssemblyPairForEdge,
    getDisassemblePartForEdge,
    setPartHover,
    getPartPositions,
    isPartLocked: (id) => lockedParts.has(id),
    resetAll,
    runDemo,
    stopDemo,
    cleanup: () => {
      stopDemo();
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    },
  };
}

// ─── 단일 부품 3D 뷰어 (부품 화면용) ─────────────────────────────────────────
function initPartScene(
  container: HTMLDivElement,
  type: PartType,
  isDark: boolean,
): () => void {
  const w = container.clientWidth || 400;
  const h = container.clientHeight || 400;
  const s = PART_SPEC[type];
  const maxDim = Math.max(s.or * 2.4, s.h * 1.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  renderer.setClearColor(isDark ? 0x0f172a : 0xf1f5f9);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 1, maxDim * 30);
  camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.4);
  camera.lookAt(0, s.h / 2, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(maxDim, maxDim * 1.5, maxDim);
  scene.add(dir);

  const { group, edgeMetas } = buildPart(type);
  scene.add(group);

  // 엣지 선 색상을 부품 색으로 표시
  edgeMetas.forEach((e) => {
    (e.lineMesh.material as THREE.MeshBasicMaterial).color.setHex(
      PART_COLOR_HEX[type],
    );
  });

  scene.add(new THREE.AxesHelper(maxDim * 0.9));
  scene.add(
    Object.assign(
      new THREE.GridHelper(
        maxDim * 2.5,
        12,
        isDark ? 0x334155 : 0xcbd5e1,
        isDark ? 0x1e293b : 0xe2e8f0,
      ),
    ),
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, s.h / 2, 0);
  controls.update();

  const ro = new ResizeObserver(() => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  ro.observe(container);

  let animId: number;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    cancelAnimationFrame(animId);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    if (container.contains(renderer.domElement))
      container.removeChild(renderer.domElement);
  };
}

function PartViewer({ type, isDark }: { type: PartType; isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return initPartScene(ref.current, type, isDark);
  }, [type, isDark]);

  return (
    <Box ref={ref} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          bgcolor: isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(4px)",
          border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
          borderRadius: 1,
          px: "8px",
          py: "6px",
        }}
      >
        {[
          ["X", "#FF4444"],
          ["Y", "#44FF44"],
          ["Z", "#4488FF"],
        ].map(([axis, color]) => (
          <Box
            key={axis}
            sx={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Box
              sx={{ width: 16, height: 2, bgcolor: color, borderRadius: 1 }}
            />
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: isDark ? "#94A3B8" : "#64748B",
              }}
            >
              {axis}
            </Typography>
          </Box>
        ))}
        <Typography
          sx={{
            fontSize: 9,
            color: isDark ? "#64748B" : "#94A3B8",
            mt: "3px",
            pt: "3px",
            borderTop: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
          }}
        >
          바닥 원 중앙 = (0,0,0)
        </Typography>
      </Box>
    </Box>
  );
}

// ─── 부품 화면 ────────────────────────────────────────────────────────────────
function PartsView({ isDark }: { isDark: boolean }) {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const [selected, setSelected] = useState<PartType>("cup");

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${t.borderDefault}`,
          bgcolor: t.bgSurface,
          display: "flex",
          flexDirection: "column",
          py: `${tokens.spacing[12]}px`,
          gap: `${tokens.spacing[4]}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: t.textTertiary,
            px: `${tokens.spacing[16]}px`,
            pb: `${tokens.spacing[8]}px`,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          부품 목록
        </Typography>
        {(["cup", "tube", "solid"] as PartType[]).map((type) => {
          const s = PART_SPEC[type];
          const col = PART_COLOR_CSS[type];
          const active = selected === type;
          return (
            <Box
              key={type}
              onClick={() => setSelected(type)}
              sx={{
                mx: `${tokens.spacing[8]}px`,
                px: `${tokens.spacing[12]}px`,
                py: `${tokens.spacing[12]}px`,
                borderRadius: `${tokens.radius.sm}px`,
                border: `1.5px solid ${active ? col : t.borderDefault}`,
                bgcolor: active ? col + "18" : t.bgPrimary,
                cursor: "pointer",
                transition: "all 0.15s",
                "&:hover": { borderColor: col, bgcolor: col + "10" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  mb: "4px",
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: col,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{ fontSize: 12, fontWeight: 700, color: t.textPrimary }}
                >
                  {s.label}
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: 10, color: t.textTertiary, lineHeight: 1.5 }}
              >
                H{s.h} / Ø{s.or * 2}
                {s.ir > 0 ? ` / 내Ø${s.ir * 2}` : ""}
              </Typography>
              <Box
                sx={{
                  mt: "6px",
                  display: "flex",
                  gap: "4px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  s.ct ? "상단 막힘" : "상단 열림",
                  s.cb ? "하단 막힘" : "하단 열림",
                ].map((tag) => (
                  <Box
                    key={tag}
                    sx={{
                      fontSize: 9,
                      px: "5px",
                      py: "1px",
                      borderRadius: "3px",
                      bgcolor: active
                        ? col + "30"
                        : isDark
                          ? "#1E293B"
                          : "#F1F5F9",
                      color: active ? col : t.textTertiary,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            bgcolor: isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.75)",
            backdropFilter: "blur(4px)",
            border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
            borderRadius: `${tokens.radius.sm}px`,
            px: "10px",
            py: "6px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: PART_COLOR_CSS[selected],
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? "#E2E8F0" : "#1E293B",
              }}
            >
              {PART_SPEC[selected].label}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 10,
              color: isDark ? "#64748B" : "#94A3B8",
              mt: "2px",
            }}
          >
            {PART_SPEC[selected].desc}
          </Typography>
        </Box>
        <PartViewer key={selected} type={selected} isDark={isDark} />
      </Box>
    </Box>
  );
}

// ─── 설계도 ───────────────────────────────────────────────────────────────────
interface PartState {
  type: PartType;
  pos: [number, number, number];
}

// 자동 스케일 헬퍼 ─ 월드 좌표 → 캔버스 좌표 변환
function bpAutoTransform(
  W: number,
  H: number,
  PAD: number,
  minH: number,
  maxH: number,
  minV: number,
  maxV: number,
): { SCALE: number; ox: number; oy: number } {
  const rangeH = Math.max(maxH - minH, 1);
  const rangeV = Math.max(maxV - minV, 1);
  const SCALE = Math.min((W - PAD * 2) / rangeH, (H - PAD * 2) / rangeV) * 0.82;
  const midH = (minH + maxH) / 2;
  const midV = (minV + maxV) / 2;
  return { SCALE, ox: W / 2 - midH * SCALE, oy: H / 2 + midV * SCALE };
}

function bpDrawProfile(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  partStates: PartState[],
  isDark: boolean,
  axisH: string,
  axisV: string,
  getHoriz: (ps: PartState) => number,
  getVert: (ps: PartState) => number,
) {
  const bg = isDark ? "#0F172A" : "#F1F5F9";
  const axisDash = isDark ? "#334155" : "#CBD5E1";
  const dimColor = isDark ? "#94A3B8" : "#64748B";
  const labelColor = isDark ? "#64748B" : "#94A3B8";
  const PAD = 36;

  // 실제 부품 범위로 자동 스케일
  let minH = Infinity,
    maxH = -Infinity,
    minV = 0,
    maxV = 0;
  partStates.forEach((ps) => {
    const s = PART_SPEC[ps.type];
    const h = getHoriz(ps),
      v = getVert(ps);
    minH = Math.min(minH, h - s.or);
    maxH = Math.max(maxH, h + s.or + 24);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v + s.h);
  });
  if (!isFinite(minH)) {
    minH = -100;
    maxH = 100;
  }
  const { SCALE, ox, oy } = bpAutoTransform(W, H, PAD, minH, maxH, minV, maxV);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 원점축 (세계 0,0 기준)
  ctx.strokeStyle = axisDash;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, PAD);
  ctx.lineTo(ox, H - PAD);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD, oy);
  ctx.lineTo(W - PAD, oy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = labelColor;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(axisV + "↑", ox + 10, PAD - 4);
  ctx.textAlign = "right";
  ctx.fillText(axisH + "→", W - 4, oy - 4);
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("0", ox + 3, oy + 11);

  partStates.forEach((ps) => {
    const s = PART_SPEC[ps.type];
    const col = PART_COLOR_CSS[ps.type];
    const cx = ox + getHoriz(ps) * SCALE;
    const cy = oy - getVert(ps) * SCALE;
    const hw = s.or * SCALE;
    const hh = s.h * SCALE;

    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = col + "22";
    if (ps.type === "tube") {
      const iw = s.ir * SCALE;
      ctx.beginPath();
      ctx.rect(cx - hw, cy - hh, hw * 2, hh);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = bg;
      ctx.fillRect(cx - iw + 1, cy - hh + 1, iw * 2 - 2, hh - 2);
      ctx.strokeStyle = col;
      ctx.strokeRect(cx - iw, cy - hh, iw * 2, hh);
    } else {
      ctx.beginPath();
      ctx.rect(cx - hw, cy - hh, hw * 2, hh);
      ctx.fill();
      ctx.stroke();
    }
    // 높이 치수
    const dimX = cx + hw + 8;
    ctx.strokeStyle = isDark ? "#475569" : "#94A3B8";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(dimX, cy);
    ctx.lineTo(dimX, cy - hh);
    ctx.stroke();
    [cy, cy - hh].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(dimX - 3, y);
      ctx.lineTo(dimX + 3, y);
      ctx.stroke();
    });
    ctx.fillStyle = dimColor;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${s.h}`, dimX + 4, cy - hh / 2 + 3);
  });
}

function bpDrawTop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  partStates: PartState[],
  isDark: boolean,
) {
  const bg = isDark ? "#0F172A" : "#F1F5F9";
  const axisDash = isDark ? "#334155" : "#CBD5E1";
  const dimColor = isDark ? "#94A3B8" : "#64748B";
  const labelColor = isDark ? "#64748B" : "#94A3B8";
  const PAD = 36;

  // XZ 평면 실제 범위
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  partStates.forEach((ps) => {
    const s = PART_SPEC[ps.type];
    minX = Math.min(minX, ps.pos[0] - s.or);
    maxX = Math.max(maxX, ps.pos[0] + s.or + 24);
    minZ = Math.min(minZ, ps.pos[2] - s.or);
    maxZ = Math.max(maxZ, ps.pos[2] + s.or + 24);
  });
  if (!isFinite(minX)) {
    minX = -100;
    maxX = 100;
    minZ = -100;
    maxZ = 100;
  }
  const {
    SCALE,
    ox,
    oy: oz,
  } = bpAutoTransform(W, H, PAD, minX, maxX, minZ, maxZ);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = axisDash;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ox, PAD);
  ctx.lineTo(ox, H - PAD);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD, oz);
  ctx.lineTo(W - PAD, oz);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = labelColor;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Z↑", ox + 10, PAD - 4);
  ctx.textAlign = "right";
  ctx.fillText("X→", W - 4, oz - 4);

  partStates.forEach((ps) => {
    const s = PART_SPEC[ps.type];
    const col = PART_COLOR_CSS[ps.type];
    const pcx = ox + ps.pos[0] * SCALE;
    const pcz = oz - ps.pos[2] * SCALE;
    const r = s.or * SCALE;

    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    if (ps.type === "tube") {
      ctx.fillStyle = col + "22";
      ctx.beginPath();
      ctx.arc(pcx, pcz, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(pcx, pcz, s.ir * SCALE, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.arc(pcx, pcz, s.ir * SCALE, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = ps.type === "solid" ? col + "44" : col + "22";
      ctx.beginPath();
      ctx.arc(pcx, pcz, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // 지름 치수
    const dimY = pcz + r + 8;
    ctx.strokeStyle = isDark ? "#475569" : "#94A3B8";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(pcx - r, dimY);
    ctx.lineTo(pcx + r, dimY);
    ctx.stroke();
    [pcx - r, pcx + r].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, dimY - 3);
      ctx.lineTo(x, dimY + 3);
      ctx.stroke();
    });
    ctx.fillStyle = dimColor;
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Ø${s.or * 2}`, pcx, dimY + 11);
  });
}

function BlueprintPanel({
  viewIndex,
  partStates,
  isDark,
}: {
  viewIndex: 0 | 1 | 2;
  partStates: PartState[];
  isDark: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth || 600;
    const cssH = canvas.offsetHeight || 240;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    if (viewIndex === 0) {
      bpDrawTop(ctx, cssW, cssH, partStates, isDark);
    } else if (viewIndex === 1) {
      bpDrawProfile(
        ctx,
        cssW,
        cssH,
        partStates,
        isDark,
        "X",
        "Y",
        (ps) => ps.pos[0],
        (ps) => ps.pos[1],
      );
    } else {
      bpDrawProfile(
        ctx,
        cssW,
        cssH,
        partStates,
        isDark,
        "Z",
        "Y",
        (ps) => ps.pos[2],
        (ps) => ps.pos[1],
      );
    }
  }, [viewIndex, partStates, isDark]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// 위치 근접 여부로 조립 그룹 묶기 (같은 X·Z = 조립된 상태)
function getAssemblyGroups(partStates: PartState[]): PartState[][] {
  const used = new Array(partStates.length).fill(false);
  const groups: PartState[][] = [];

  partStates.forEach((ps, i) => {
    if (used[i]) return;
    const group: PartState[] = [ps];
    used[i] = true;
    partStates.forEach((ps2, j) => {
      if (used[j]) return;
      const dx = ps.pos[0] - ps2.pos[0];
      const dz = ps.pos[2] - ps2.pos[2];
      if (Math.sqrt(dx * dx + dz * dz) < 2) {
        group.push(ps2);
        used[j] = true;
      }
    });
    groups.push(group);
  });

  return groups;
}

const BP_VIEWS = [
  { index: 0 as const, title: "위 (XZ)", sub: "평면도" },
  { index: 1 as const, title: "옆 (XY)", sub: "측면도" },
  { index: 2 as const, title: "앞 (ZY)", sub: "정면도" },
] as const;

function BlueprintView({
  partStates,
  isDark,
}: {
  partStates: PartState[];
  isDark: boolean;
}) {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const groups = getAssemblyGroups(partStates);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {groups.map((group, gi) => {
        const groupLabel = group
          .map((ps) => PART_SPEC[ps.type].label)
          .join(" + ");
        return (
          <Box
            key={gi}
            sx={{
              borderBottom:
                gi < groups.length - 1
                  ? `1px solid ${t.borderDefault}`
                  : "none",
            }}
          >
            {/* 그룹 헤더 */}
            <Box
              sx={{
                px: "16px",
                py: "6px",
                bgcolor: isDark ? "#1E293B" : "#F8FAFC",
                borderBottom: `1px solid ${t.borderDefault}`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {group.map((ps) => (
                <Box
                  key={ps.type}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: PART_COLOR_CSS[ps.type],
                    flexShrink: 0,
                  }}
                />
              ))}
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: t.textPrimary }}
              >
                {groupLabel}
              </Typography>
              {group.length > 1 && (
                <Typography sx={{ fontSize: 10, color: t.textTertiary }}>
                  조립됨
                </Typography>
              )}
            </Box>

            {/* 3개 뷰 (위/옆/앞) 나란히 */}
            <Box sx={{ display: "flex" }}>
              {BP_VIEWS.map((v, vi) => (
                <Box
                  key={v.index}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    borderRight:
                      vi < 2 ? `1px solid ${t.borderDefault}` : "none",
                  }}
                >
                  <Box
                    sx={{
                      px: "10px",
                      py: "4px",
                      flexShrink: 0,
                      bgcolor: t.bgSurface,
                      borderBottom: `1px solid ${t.borderDefault}`,
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textSecondary,
                      }}
                    >
                      {v.title}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: t.textTertiary }}>
                      {v.sub}
                    </Typography>
                  </Box>
                  <Box sx={{ height: 220 }}>
                    <BlueprintPanel
                      viewIndex={v.index}
                      partStates={group}
                      isDark={isDark}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function MiniCadPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const t = theme.palette.tokens.color;

  const [mode, setMode] = useState<Mode>("assembly");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredPart, setHoveredPart] = useState<PartType | null>(null);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [partStates, setPartStates] = useState<PartState[]>([
    { type: "cup", pos: [0, 0, 0] },
    { type: "tube", pos: [300, 0, 0] },
    { type: "solid", pos: [480, 0, 0] },
  ]);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneCtx | null>(null);

  const onSelection = useCallback((ids: string[]) => setSelectedIds(ids), []);
  const onEdgeHover = useCallback(
    (type: PartType | null) => setHoveredPart(type),
    [],
  );

  // mode를 의존성에서 제외 → 탭 전환 시 씬이 파괴되지 않음
  useEffect(() => {
    if (!mountRef.current) return;
    const ctx = initScene(mountRef.current, isDark, onSelection, onEdgeHover);
    sceneRef.current = ctx;
    return () => {
      sceneRef.current = null;
      ctx.cleanup();
    };
  }, [isDark, onSelection, onEdgeHover]);

  useEffect(() => {
    sceneRef.current?.setPartHover(hoveredPart);
  }, [hoveredPart]);

  // 선택된 엣지가 조립된 부품(무버 자신 or 앵커 접촉 엣지)이면 해제 가능
  const disassemblePartId = (() => {
    if (selectedIds.length !== 1 || !sceneRef.current) return null;
    return sceneRef.current.getDisassemblePartForEdge(selectedIds[0]);
  })();

  // 접촉 엣지를 1개만 선택했을 때만 회전 가능 (무버 자신 or 앵커 접촉 엣지 모두 허용)
  const rotatablePartId = (() => {
    if (selectedIds.length !== 1 || !sceneRef.current) return null;
    return sceneRef.current.getRotatablePartForEdge(selectedIds[0]);
  })();

  // 접촉 엣지 선택 시 조립 쌍 레이블
  const assemblyPair = (() => {
    if (selectedIds.length !== 1 || !sceneRef.current) return null;
    return sceneRef.current.getAssemblyPairForEdge(selectedIds[0]);
  })();

  const handleDisassemble = () => {
    if (!disassemblePartId || !sceneRef.current) return;
    sceneRef.current.disassemble(disassemblePartId);
    setSelectedIds([]);
    const positions = sceneRef.current.getPartPositions();
    setPartStates(
      (["cup", "tube", "solid"] as PartType[]).map((type) => ({
        type,
        pos: positions[type],
      })),
    );
  };

  const handleAssemble = () => {
    if (selectedIds.length !== 2 || !sceneRef.current) return;
    const result = sceneRef.current.assemble(selectedIds[0], selectedIds[1]);
    if (result.success) {
      setSelectedIds([]);
      const positions = sceneRef.current.getPartPositions();
      setPartStates(
        (["cup", "tube", "solid"] as PartType[]).map((type) => ({
          type,
          pos: positions[type],
        })),
      );
    } else {
      setAssembleError(result.error ?? "조립할 수 없습니다");
      setTimeout(() => setAssembleError(null), 3000);
    }
  };

  const getEdgeLabel = (id: string) => {
    if (!sceneRef.current) return id;
    const edge = sceneRef.current.parts
      .flatMap((p) => p.edges)
      .find((e) => e.id === id);
    if (!edge) return id;
    const part = sceneRef.current.parts.find((p) => p.id === edge.partId);
    return `${PART_SPEC[part!.type].label} · ${edge.label}`;
  };

  const getEdgePartType = (id: string): PartType | null => {
    if (!sceneRef.current) return null;
    const edge = sceneRef.current.parts
      .flatMap((p) => p.edges)
      .find((e) => e.id === id);
    if (!edge) return null;
    return (
      sceneRef.current.parts.find((p) => p.id === edge.partId)?.type ?? null
    );
  };

  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState("");

  const syncPartStates = () => {
    if (!sceneRef.current) return;
    const positions = sceneRef.current.getPartPositions();
    setPartStates(
      (["cup", "tube", "solid"] as PartType[]).map((type) => ({
        type,
        pos: positions[type],
      })),
    );
  };

  const handleDemo = () => {
    if (!sceneRef.current) return;
    setDemoRunning(true);
    setDemoStep("");
    sceneRef.current.runDemo(
      (label) => setDemoStep(label),
      () => {
        setDemoRunning(false);
        setDemoStep("");
        syncPartStates();
      },
    );
  };

  const handleStopDemo = () => {
    sceneRef.current?.stopDemo();
    setDemoRunning(false);
    setDemoStep("");
  };

  const handleReset = () => {
    if (!sceneRef.current) return;
    sceneRef.current.resetAll();
    setSelectedIds([]);
    syncPartStates();
  };

  // ── 튜토리얼 ──
  const helpTextRef = useRef<HTMLDivElement>(null);
  const demoBtnRef = useRef<HTMLDivElement>(null);
  const blueprintTabRef = useRef<HTMLDivElement>(null);

  const [tutorialStep, setTutorialStep] = useState(1); // 0=숨김, 1~3
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const TUTORIAL_MSGS: Record<number, string> = {
    1: "이렇게 조작할 수 있어요!",
    2: "귀찮으시면 데모를 이용할 수 있어요!",
    3: "부품의 설계도를 확인할 수 있어요!",
  };

  const handleTutorialNext = useCallback(() => {
    setTutorialStep((s) => (s >= 3 ? 0 : s + 1));
  }, []);

  useEffect(() => {
    if (tutorialStep === 0) {
      setSpotlightRect(null);
      return;
    }
    const refMap: Record<number, React.RefObject<HTMLDivElement | null>> = {
      1: helpTextRef,
      2: demoBtnRef,
      3: blueprintTabRef,
    };
    const ref = refMap[tutorialStep];
    const update = () => {
      if (ref?.current) setSpotlightRect(ref.current.getBoundingClientRect());
    };
    requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [tutorialStep]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: t.bgPrimary,
        ...(mode === "blueprint"
          ? { minHeight: "calc(100vh - 56px)" }
          : { height: "calc(100vh - 56px)", overflow: "hidden" }),
      }}
    >
      {/* 탭 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${tokens.spacing[4]}px`,
          px: `${tokens.spacing[16]}px`,
          height: 48,
          flexShrink: 0,
          borderBottom: `1px solid ${t.borderDefault}`,
          bgcolor: t.bgPrimary,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            fontWeight: 700,
            color: t.textPrimary,
            mr: `${tokens.spacing[12]}px`,
          }}
        >
          미니 캐드
        </Typography>
        {(["parts", "assembly", "blueprint"] as Mode[]).map((m) => (
          <Box
            key={m}
            ref={m === "blueprint" ? blueprintTabRef : undefined}
            onClick={() => setMode(m)}
            sx={{
              px: `${tokens.spacing[12]}px`,
              height: 30,
              display: "flex",
              alignItems: "center",
              borderRadius: `${tokens.radius.sm}px`,
              bgcolor: mode === m ? t.accentBlue : "transparent",
              color: mode === m ? t.textOnAccent : t.textSecondary,
              cursor: "pointer",
              userSelect: "none",
              fontSize: tokens.fontSize.sm,
              fontWeight: mode === m ? 600 : 400,
              transition: "all 0.15s",
              "&:hover": { bgcolor: mode === m ? t.accentBlue : t.bgSurface },
            }}
          >
            {m === "parts" ? "부품" : m === "assembly" ? "조립" : "설계도"}
          </Box>
        ))}
      </Box>

      {mode === "parts" && <PartsView isDark={isDark} />}

      {/* 씬을 항상 마운트 유지 → 탭 전환 시 조립 상태 보존 */}
      <Box
        sx={{
          flex: 1,
          display: mode === "assembly" ? "flex" : "none",
          overflow: "hidden",
        }}
      >
        <Box
          ref={mountRef}
          sx={{ flex: 1, position: "relative", overflow: "hidden" }}
        >
          {/* 선택 HUD */}
          {(selectedIds.length > 0 || assembleError) && (
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                left: 16,
                zIndex: 10,
                bgcolor: isDark
                  ? "rgba(15,23,42,0.92)"
                  : "rgba(255,255,255,0.92)",
                border: `1px solid ${assembleError ? "#EF4444" : t.borderDefault}`,
                borderRadius: `${tokens.radius.md}px`,
                px: `${tokens.spacing[12]}px`,
                py: `${tokens.spacing[10]}px`,
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                gap: `${tokens.spacing[6]}px`,
                minWidth: 220,
              }}
            >
              {selectedIds.map((id, i) => {
                const pType = getEdgePartType(id);
                return (
                  <Box
                    key={id}
                    sx={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        flexShrink: 0,
                        bgcolor: i === 0 ? "#3B82F6" : "#22C55E",
                      }}
                    />
                    {pType && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          flexShrink: 0,
                          bgcolor: PART_COLOR_CSS[pType],
                        }}
                      />
                    )}
                    <Typography sx={{ fontSize: 11, color: t.textSecondary }}>
                      {getEdgeLabel(id)}
                    </Typography>
                  </Box>
                );
              })}
              {assemblyPair && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    px: "6px",
                    py: "3px",
                    borderRadius: "4px",
                    bgcolor: isDark
                      ? "rgba(249,115,22,0.15)"
                      : "rgba(249,115,22,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: "#F97316",
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 10, color: "#F97316", fontWeight: 600 }}
                  >
                    {assemblyPair.anchorLabel} ↔ {assemblyPair.moverLabel}
                  </Typography>
                </Box>
              )}
              {assembleError && (
                <Typography sx={{ fontSize: 11, color: "#EF4444" }}>
                  ⚠ {assembleError}
                </Typography>
              )}
              {selectedIds.length === 2 && (
                <Button
                  onClick={handleAssemble}
                  size="small"
                  sx={{
                    mt: "4px",
                    bgcolor: t.accentBlue,
                    color: t.textOnAccent,
                    borderRadius: `${tokens.radius.sm}px`,
                    fontSize: 12,
                    fontWeight: 700,
                    py: "4px",
                    textTransform: "none",
                    "&:hover": { bgcolor: t.accentBlue, opacity: 0.85 },
                  }}
                >
                  조립하기
                </Button>
              )}
              {disassemblePartId && (
                <Button
                  onClick={handleDisassemble}
                  size="small"
                  sx={{
                    mt: "4px",
                    bgcolor: "#EF4444",
                    color: "#fff",
                    borderRadius: `${tokens.radius.sm}px`,
                    fontSize: 12,
                    fontWeight: 700,
                    py: "4px",
                    textTransform: "none",
                    "&:hover": { bgcolor: "#DC2626" },
                  }}
                >
                  조립 해제
                </Button>
              )}
            </Box>
          )}
          {/* 회전 버튼: 접촉 엣지 단일 선택 시 표시 */}
          {rotatablePartId && selectedIds.length === 1 && (
            <Box
              onClick={() =>
                sceneRef.current?.rotatePartAtEdge(selectedIds[0], 90)
              }
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 10,
                bgcolor: isDark
                  ? "rgba(168,85,247,0.15)"
                  : "rgba(168,85,247,0.1)",
                border: "1px solid #A855F7",
                borderRadius: `${tokens.radius.sm}px`,
                px: "14px",
                py: "8px",
                backdropFilter: "blur(6px)",
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(168,85,247,0.28)"
                    : "rgba(168,85,247,0.2)",
                },
              }}
            >
              <Typography
                sx={{ fontSize: 12, color: "#A855F7", fontWeight: 700 }}
              >
                ↺ 90° 회전
              </Typography>
            </Box>
          )}
          {/* 도움말 */}
          <Box
            ref={helpTextRef}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
              bgcolor: isDark
                ? "rgba(15,23,42,0.72)"
                : "rgba(255,255,255,0.72)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${t.borderDefault}`,
              borderRadius: `${tokens.radius.sm}px`,
              px: "10px",
              py: "6px",
            }}
          >
            <Typography
              sx={{ fontSize: 10, color: t.textTertiary, lineHeight: 1.7 }}
            >
              🖱 드래그 회전 · 스크롤 줌 · 우클릭 이동
              <br />
              테두리 클릭 선택 (최대 2개) · ESC를 누르거나 같은 곳을 눌러 선택
              취소
            </Typography>
          </Box>

          {/* 도움말 버튼 */}
          <Box
            onClick={() => setTutorialStep(1)}
            sx={{
              position: "absolute",
              top: 68,
              left: 12,
              zIndex: 10,
              width: 26,
              height: 26,
              borderRadius: "50%",
              bgcolor: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.72)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${t.borderDefault}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              "&:hover": { bgcolor: isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)", borderColor: "#3B82F6" },
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: t.textTertiary, lineHeight: 1 }}>
              ?
            </Typography>
          </Box>

          {/* 데모 / 리셋 버튼 */}
          <Box
            ref={demoBtnRef}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              display: "flex",
              gap: "6px",
            }}
          >
            {demoRunning ? (
              <Box
                onClick={handleStopDemo}
                sx={{
                  bgcolor: isDark
                    ? "rgba(239,68,68,0.15)"
                    : "rgba(239,68,68,0.1)",
                  border: "1px solid #EF4444",
                  borderRadius: `${tokens.radius.sm}px`,
                  px: "12px",
                  py: "6px",
                  cursor: "pointer",
                  userSelect: "none",
                  backdropFilter: "blur(6px)",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(239,68,68,0.28)"
                      : "rgba(239,68,68,0.2)",
                  },
                }}
              >
                <Typography
                  sx={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}
                >
                  ■ 중지
                </Typography>
              </Box>
            ) : (
              <Box
                onClick={handleDemo}
                sx={{
                  bgcolor: isDark
                    ? "rgba(59,130,246,0.15)"
                    : "rgba(59,130,246,0.1)",
                  border: "1px solid #3B82F6",
                  borderRadius: `${tokens.radius.sm}px`,
                  px: "12px",
                  py: "6px",
                  cursor: "pointer",
                  userSelect: "none",
                  backdropFilter: "blur(6px)",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(59,130,246,0.28)"
                      : "rgba(59,130,246,0.2)",
                  },
                }}
              >
                <Typography
                  sx={{ fontSize: 12, color: "#3B82F6", fontWeight: 700 }}
                >
                  ▶ 데모
                </Typography>
              </Box>
            )}
            <Box
              onClick={handleReset}
              sx={{
                bgcolor: isDark
                  ? "rgba(100,116,139,0.15)"
                  : "rgba(100,116,139,0.1)",
                border: `1px solid ${t.borderDefault}`,
                borderRadius: `${tokens.radius.sm}px`,
                px: "12px",
                py: "6px",
                cursor: "pointer",
                userSelect: "none",
                backdropFilter: "blur(6px)",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(100,116,139,0.25)"
                    : "rgba(100,116,139,0.15)",
                },
              }}
            >
              <Typography
                sx={{ fontSize: 12, color: t.textSecondary, fontWeight: 700 }}
              >
                ↺ 리셋
              </Typography>
            </Box>
          </Box>

          {/* 데모 진행 단계 표시 */}
          {demoRunning && demoStep && (
            <Box
              sx={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                bgcolor: isDark
                  ? "rgba(15,23,42,0.92)"
                  : "rgba(255,255,255,0.92)",
                backdropFilter: "blur(6px)",
                border: "1px solid #3B82F6",
                borderRadius: `${tokens.radius.sm}px`,
                px: "14px",
                py: "7px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#3B82F6",
                  flexShrink: 0,
                  "@keyframes cadPulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.3 },
                  },
                  animation: "cadPulse 1s ease-in-out infinite",
                }}
              />
              <Typography
                sx={{ fontSize: 12, color: t.textPrimary, fontWeight: 600 }}
              >
                {demoStep}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 오른쪽 부품 패널 */}
        <Box
          sx={{
            width: 160,
            flexShrink: 0,
            borderLeft: `1px solid ${t.borderDefault}`,
            bgcolor: t.bgSurface,
            display: "flex",
            flexDirection: "column",
            py: `${tokens.spacing[12]}px`,
            gap: `${tokens.spacing[4]}px`,
            overflowY: "auto",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: t.textTertiary,
              px: `${tokens.spacing[12]}px`,
              pb: `${tokens.spacing[8]}px`,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            부품 목록
          </Typography>
          {(["cup", "tube", "solid"] as PartType[]).map((type) => {
            const s = PART_SPEC[type];
            const col = PART_COLOR_CSS[type];
            const isHovered = hoveredPart === type;
            const locked = type === "cup";
            return (
              <Box
                key={type}
                onMouseEnter={() => setHoveredPart(type)}
                onMouseLeave={() => setHoveredPart(null)}
                sx={{
                  mx: "8px",
                  px: "10px",
                  py: "10px",
                  borderRadius: `${tokens.radius.sm}px`,
                  border: `1.5px solid ${isHovered ? col : t.borderDefault}`,
                  bgcolor: isHovered ? col + "18" : t.bgPrimary,
                  cursor: "default",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: col,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: t.textPrimary,
                      flex: 1,
                    }}
                  >
                    {s.label}
                  </Typography>
                  {locked && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        color: "#888",
                        px: "4px",
                        py: "1px",
                        bgcolor: isDark ? "#1E293B" : "#E2E8F0",
                        borderRadius: "3px",
                      }}
                    >
                      고정
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{ fontSize: 9, color: t.textTertiary, lineHeight: 1.5 }}
                >
                  H{s.h} / Ø{s.or * 2}
                  {s.ir > 0 ? ` / 내Ø${s.ir * 2}` : ""}
                </Typography>
              </Box>
            );
          })}
          <Box
            sx={{
              mt: "auto",
              mx: "8px",
              pt: "12px",
              borderTop: `1px solid ${t.borderDefault}`,
              px: "4px",
            }}
          >
            <Typography
              sx={{ fontSize: 10, color: t.textTertiary, lineHeight: 1.7 }}
            >
              <Box component="span" sx={{ color: "#3B82F6", fontWeight: 700 }}>
                ●
              </Box>{" "}
              1번째
              <br />
              <Box component="span" sx={{ color: "#22C55E", fontWeight: 700 }}>
                ●
              </Box>{" "}
              2번째
              <br />
              <Box component="span" sx={{ color: "#FF8C00", fontWeight: 700 }}>
                ●
              </Box>{" "}
              호버
            </Typography>
          </Box>
        </Box>
      </Box>

      {mode === "blueprint" && (
        <Box sx={{ flex: 1 }}>
          <BlueprintView partStates={partStates} isDark={isDark} />
        </Box>
      )}

      {/* ── 튜토리얼 오버레이 ── */}
      {tutorialStep > 0 && (
        <Box
          onClick={handleTutorialNext}
          sx={{ position: "fixed", inset: 0, zIndex: 400, cursor: "pointer" }}
        >
          {spotlightRect ? (
            (() => {
              const pad = 10;
              const { top, left, right, bottom } = spotlightRect;
              const sl = left - pad,
                st = top - pad,
                sr = right + pad,
                sb = bottom + pad;
              const vw = window.innerWidth;
              const vh = window.innerHeight;
              const dimBg = "rgba(0,0,0,0.78)";
              const cardCenterX = Math.min(
                Math.max((sl + sr) / 2, 160),
                vw - 160,
              );
              return (
                <>
                  {/* 4방향 딤 */}
                  <Box
                    sx={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: vw,
                      height: st,
                      bgcolor: dimBg,
                    }}
                  />
                  <Box
                    sx={{
                      position: "fixed",
                      top: sb,
                      left: 0,
                      width: vw,
                      height: vh - sb,
                      bgcolor: dimBg,
                    }}
                  />
                  <Box
                    sx={{
                      position: "fixed",
                      top: st,
                      left: 0,
                      width: sl,
                      height: sb - st,
                      bgcolor: dimBg,
                    }}
                  />
                  <Box
                    sx={{
                      position: "fixed",
                      top: st,
                      left: sr,
                      width: vw - sr,
                      height: sb - st,
                      bgcolor: dimBg,
                    }}
                  />
                  {/* 하이라이트 테두리 */}
                  <Box
                    sx={{
                      position: "fixed",
                      top: st,
                      left: sl,
                      width: sr - sl,
                      height: sb - st,
                      border: "2px solid #3B82F6",
                      borderRadius: "10px",
                      boxShadow:
                        "0 0 0 4px rgba(59,130,246,0.25), 0 0 24px rgba(59,130,246,0.4)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* 설명 텍스트 */}
                  <Typography
                    sx={{
                      position: "fixed",
                      top: sb + 18,
                      left: cardCenterX,
                      transform: "translateX(-50%)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      textShadow: "0 2px 12px rgba(0,0,0,0.7)",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {TUTORIAL_MSGS[tutorialStep]}
                  </Typography>
                </>
              );
            })()
          ) : (
            <Box
              sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.78)" }}
            />
          )}

          {/* 하단 진행 표시 */}
          <Box
            sx={{
              position: "fixed",
              bottom: 36,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              pointerEvents: "none",
            }}
          >
            <Box sx={{ display: "flex", gap: "6px" }}>
              {[1, 2, 3].map((s) => (
                <Box
                  key={s}
                  sx={{
                    width: s === tutorialStep ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor:
                      s === tutorialStep
                        ? "#3B82F6"
                        : "rgba(255,255,255,0.35)",
                    transition: "width 0.2s ease",
                  }}
                />
              ))}
            </Box>
            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                fontWeight: 500,
              }}
            >
              {tutorialStep < 3 ? "클릭하여 다음 설명 보기" : "클릭하여 시작하기"}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
