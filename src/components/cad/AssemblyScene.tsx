import { useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import type { CadPart, PlacedInstance } from "./types";
import {
  initAssemblyScene,
  makeSceneAPI,
  type SceneAPI,
  type SceneState,
} from "./assemblyEngine";

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
