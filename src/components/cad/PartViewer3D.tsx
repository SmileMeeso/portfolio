import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box } from '@mui/material';
import type { CadPart } from './types';
import { buildPartGroup } from './partGeometry';


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
