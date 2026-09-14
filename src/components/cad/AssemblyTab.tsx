import AssemblyScene from "./AssemblyScene";
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useCadStore } from "./cadStore";
import { computeEdges } from "./assemblyEngine";
import type { SceneAPI } from "./assemblyEngine";
import { partColorCSS } from "./cadUtils";

// ── Assembly Tab ──────────────────────────────────────────────────────────────
export default function AssemblyTab({
  isDark,
  sceneAPIRef,
}: {
  isDark: boolean;
  sceneAPIRef: { current: SceneAPI | null };
}) {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const {
    parts,
    instances,
    addInstance,
    removeInstance,
    setInstancePosition,
    setInstanceRotX,
    linkInstances,
    unlinkInstance,
  } = useCadStore();

  type EdgeSel = { instanceId: string; edgeId: string };
  const [selection, setSelection] = useState<EdgeSel[]>([]);
  // 조립 가능 여부는 씬(ref)에 물어봐야 알 수 있다.
  // 렌더 중에 ref 를 읽으면 씬이 바뀌어도 화면이 갱신되지 않으므로,
  // 선택이 바뀌는 시점에 한 번 계산해 state 로 들고 있는다.
  const [canAssemble, setCanAssemble] = useState(false);
  const applySelection = useCallback(
    (sel: EdgeSel[]) => {
      setSelection(sel);
      setCanAssemble(
        sel.length === 2 &&
          sel[0].instanceId !== sel[1].instanceId &&
          (sceneAPIRef.current?.canAssemble(
            sel[0].instanceId,
            sel[0].edgeId,
            sel[1].instanceId,
            sel[1].edgeId,
          ) ??
            false),
      );
    },
    [sceneAPIRef],
  );
  const [clickedInstanceId, setClickedInstanceId] = useState<string | null>(
    null,
  );
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [pendingGhostPartId, setPendingGhostPartId] = useState<string | null>(
    null,
  );

  const usableParts = parts.filter((p) => p.extrude !== null);

  // Cancel ghost on ESC (handled inside AssemblyScene too, but keep in sync)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pendingGhostPartId) {
        sceneAPIRef.current?.cancelGhost();
        setPendingGhostPartId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingGhostPartId, sceneAPIRef]);

  const handleGhostPlace = useCallback(
    (partId: string, pos: [number, number, number]) => {
      const iid = addInstance(partId, pos);
      const part = parts.find((p) => p.id === partId);
      if (part) {
        sceneAPIRef.current?.addInstance(
          { instanceId: iid, partId, position: pos, rotX: 0, links: [] },
          part,
        );
      }
      setPendingGhostPartId(null);
    },
    [addInstance, parts, sceneAPIRef],
  );

  const handleStartGhost = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part || !sceneAPIRef.current) return;
    // First part: place directly at origin
    if (instances.length === 0) {
      const iid = addInstance(partId, [0, 0, 0]);
      sceneAPIRef.current.addInstance(
        { instanceId: iid, partId, position: [0, 0, 0], rotX: 0, links: [] },
        part,
      );
      return;
    }
    setPendingGhostPartId(partId);
    sceneAPIRef.current.startGhost(partId, part);
  };

  const handleAssemble = () => {
    if (selection.length !== 2 || !sceneAPIRef.current) return;
    const [s0, s1] = selection;
    // Anchor = earlier-placed instance (lower index), mover = later-placed
    const idx0 = instances.findIndex((i) => i.instanceId === s0.instanceId);
    const idx1 = instances.findIndex((i) => i.instanceId === s1.instanceId);
    const [a, b] = idx0 <= idx1 ? [s0, s1] : [s1, s0];
    const result = sceneAPIRef.current.assemble(
      a.instanceId,
      a.edgeId,
      b.instanceId,
      b.edgeId,
    );
    if (result.success && result.moverPos) {
      setInstancePosition(b.instanceId, result.moverPos);
      setInstanceRotX(b.instanceId, 0);
      linkInstances({
        ownerInstanceId: b.instanceId,
        myEdgeId: b.edgeId,
        targetInstanceId: a.instanceId,
        targetEdgeId: a.edgeId,
      });
      // Keep mover's assembled edge selected so 180° rotate button appears immediately
      applySelection([{ instanceId: b.instanceId, edgeId: b.edgeId }]);
    } else {
      setAssembleError(result.error ?? "조립 실패");
      setTimeout(() => setAssembleError(null), 3000);
    }
  };

  const handleDisassemble = (instanceId: string) => {
    const freePos: [number, number, number] = [instances.length * 200, 0, 0];
    sceneAPIRef.current?.disassemble(instanceId, freePos);
    setInstancePosition(instanceId, freePos);
    setInstanceRotX(instanceId, 0);
    unlinkInstance(instanceId);
    setClickedInstanceId(null);
    applySelection([]);
  };

  const handleDeleteInstance = (instanceId: string) => {
    sceneAPIRef.current?.removeInstance(instanceId);
    removeInstance(instanceId);
    setClickedInstanceId(null);
    applySelection([]);
  };

  const handleRotate = () => {
    if (selection.length !== 1) return;
    const { instanceId, edgeId } = selection[0];
    sceneAPIRef.current?.rotateAtEdge(instanceId, edgeId, 180);
    const inst = instances.find((i) => i.instanceId === instanceId);
    if (inst) setInstanceRotX(instanceId, inst.rotX + Math.PI);
  };

  const clickedInst = instances.find((i) => i.instanceId === clickedInstanceId);
  const isLinked = (clickedInst?.links.length ?? 0) > 0;

  const isRotatable =
    selection.length === 1 &&
    instances
      .find((i) => i.instanceId === selection[0].instanceId)
      ?.links.some((l) => l.myEdgeId === selection[0].edgeId) === true;

  const getEdgeLabel = (instanceId: string, edgeId: string) => {
    const inst = instances.find((i) => i.instanceId === instanceId);
    if (!inst) return edgeId;
    const part = parts.find((p) => p.id === inst.partId);
    const edges = part ? computeEdges(part) : [];
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return edgeId;
    const sideLabel = edge.side === "top" ? "상단" : "하단";
    const kindLabel =
      edge.kind === "circle"
        ? `원형 r${edge.metric.toFixed(0)}`
        : `모서리 ${edge.metric.toFixed(0)}`;
    return `${part?.name ?? "?"} · ${sideLabel} ${kindLabel}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* 3D scene */}
      <Box
        data-tut="assembly-canvas"
        sx={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        <AssemblyScene
          isDark={isDark}
          instances={instances}
          parts={parts}
          onSelectionChange={(sel) => {
            applySelection(sel);
            setClickedInstanceId(null);
          }}
          onInstanceClick={(id) =>
            setClickedInstanceId((prev) => (prev === id ? null : id))
          }
          onGhostPlace={handleGhostPlace}
          sceneAPIRef={sceneAPIRef}
        />

        {/* Selection HUD */}
        {(selection.length > 0 || assembleError) && (
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
              minWidth: 240,
            }}
          >
            {selection.map((sel, i) => (
              <Box
                key={`${sel.instanceId}:${sel.edgeId}`}
                sx={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: i === 0 ? "#3B82F6" : "#22C55E",
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: 11, color: t.textSecondary }}>
                  {getEdgeLabel(sel.instanceId, sel.edgeId)}
                </Typography>
              </Box>
            ))}
            {assembleError && (
              <Typography sx={{ fontSize: 11, color: "#EF4444" }}>
                ⚠ {assembleError}
              </Typography>
            )}
            {canAssemble && (
              <Button
                onClick={handleAssemble}
                size="small"
                variant="contained"
                sx={{
                  mt: "4px",
                  fontSize: 12,
                  py: "4px",
                  textTransform: "none",
                }}
              >
                조립하기
              </Button>
            )}
            {isRotatable && (
              <Button
                onClick={handleRotate}
                size="small"
                sx={{
                  mt: "2px",
                  fontSize: 12,
                  py: "4px",
                  textTransform: "none",
                  color: "#A855F7",
                  border: "1px solid #A855F7",
                }}
              >
                ↺ 180° 회전
              </Button>
            )}
            {isRotatable && (
              <Button
                onClick={() => handleDisassemble(selection[0].instanceId)}
                size="small"
                sx={{
                  mt: "2px",
                  fontSize: 12,
                  py: "4px",
                  textTransform: "none",
                  color: "#F97316",
                  border: "1px solid #F97316",
                }}
              >
                조립 취소
              </Button>
            )}
          </Box>
        )}

        {/* Clicked instance actions */}
        {clickedInstanceId && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 10,
              bgcolor: isDark
                ? "rgba(15,23,42,0.92)"
                : "rgba(255,255,255,0.92)",
              border: `1px solid ${t.borderDefault}`,
              borderRadius: `${tokens.radius.md}px`,
              px: `${tokens.spacing[12]}px`,
              py: `${tokens.spacing[10]}px`,
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
              gap: `${tokens.spacing[6]}px`,
            }}
          >
            <Typography sx={{ fontSize: 11, color: t.textSecondary }}>
              {parts.find(
                (p) =>
                  p.id ===
                  instances.find((i) => i.instanceId === clickedInstanceId)
                    ?.partId,
              )?.name ?? "?"}
            </Typography>
            {isLinked && (
              <Button
                onClick={() => handleDisassemble(clickedInstanceId)}
                size="small"
                sx={{
                  fontSize: 11,
                  py: "3px",
                  textTransform: "none",
                  color: "#F97316",
                  border: "1px solid #F97316",
                }}
              >
                조립 해제
              </Button>
            )}
            <Button
              onClick={() => handleDeleteInstance(clickedInstanceId)}
              size="small"
              sx={{
                fontSize: 11,
                py: "3px",
                textTransform: "none",
                color: "#EF4444",
                border: "1px solid #EF4444",
              }}
            >
              삭제
            </Button>
          </Box>
        )}

        {/* Help */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            bgcolor: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.72)",
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
            모서리 클릭으로 선택 (최대 2개) · ESC 선택 취소
            <br />
            본체 클릭으로 인스턴스 선택
          </Typography>
        </Box>

        {/* Ghost mode banner */}
        {pendingGhostPartId && (
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
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#3B82F6",
                "@keyframes pulse": {
                  "0%,100%": { opacity: 1 },
                  "50%": { opacity: 0.3 },
                },
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
            <Typography
              sx={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}
            >
              클릭으로 부품 배치 · ESC 취소
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right panel: usable parts */}
      <Box
        data-tut="assembly-parts-panel"
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
          부품
        </Typography>
        {usableParts.length === 0 ? (
          <Typography
            sx={{
              fontSize: 10,
              color: t.textTertiary,
              px: `${tokens.spacing[12]}px`,
              lineHeight: 1.6,
            }}
          >
            부품 탭에서 스케치 후 돌출하세요
          </Typography>
        ) : (
          usableParts.map((part) => {
            const col = partColorCSS(part.id);
            return (
              <Box
                key={part.id}
                onClick={() => handleStartGhost(part.id)}
                sx={{
                  mx: "8px",
                  px: "10px",
                  py: "8px",
                  borderRadius: `${tokens.radius.sm}px`,
                  border: `1.5px solid ${t.borderDefault}`,
                  bgcolor: t.bgPrimary,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { borderColor: col, bgcolor: col + "10" },
                  "&:active": { bgcolor: col + "20" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: col,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, color: t.textPrimary }}
                  >
                    {part.name}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}

        {/* Legend */}
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
            sx={{ fontSize: 10, color: t.textTertiary, lineHeight: 1.8 }}
          >
            <Box component="span" sx={{ color: "#3B82F6", fontWeight: 700 }}>
              ●
            </Box>{" "}
            1번째 선택
            <br />
            <Box component="span" sx={{ color: "#22C55E", fontWeight: 700 }}>
              ●
            </Box>{" "}
            2번째 선택
            <br />
            <Box component="span" sx={{ color: "#F97316", fontWeight: 700 }}>
              ●
            </Box>{" "}
            조립됨
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
