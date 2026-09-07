import { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Slider,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useCadStore } from "./cadStore";
import SketchEditor from "./SketchEditor";
import PartViewer3D from "./PartViewer3D";
import AssemblyScene from "./AssemblyScene";
import { type SceneAPI, computeEdges } from "./assemblyEngine";
import { partColorCSS } from "./cadUtils";
import type { CadPart, Plane, Sketch, ClosedLoop } from "./types";

type Tab = "parts" | "assembly" | "blueprint";
const PLANES: Plane[] = ["xy", "xz", "yz"];

// ── Warn icon ─────────────────────────────────────────────────────────────────
function WarnIcon() {
  return (
    <Tooltip
      title="입체 도형이 없어 조립/설계도에서 사용 불가합니다 (닫힌 스케치를 그리고 돌출하세요)"
      arrow
    >
      <Box
        component="span"
        sx={{
          ml: "4px",
          color: "#F59E0B",
          fontSize: 13,
          cursor: "help",
          userSelect: "none",
        }}
      >
        ⚠
      </Box>
    </Tooltip>
  );
}

// ── Parts Tab ─────────────────────────────────────────────────────────────────
function PartsTab({
  autoSelect,
}: {
  autoSelect?: { partId: string; view3D: boolean } | null;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const t = theme.palette.tokens.color;
  const { parts, addPart, renamePart, deletePart, updateSketch, setExtrude } =
    useCadStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteSet, setDeleteSet] = useState<Set<string>>(new Set());
  const [selectedPlane, setSelectedPlane] = useState<Plane>("xy");
  // 3D / sketch view toggle — auto-switches to 3D after extrude
  const [view3D, setView3D] = useState(false);
  // Live extrude preview (replaces dialog)
  const [extrudePreview, setExtrudePreview] = useState<{
    loops: ClosedLoop[];
    circleIds: string[];
    height: number;
  } | null>(null);

  // Demo: externally controlled selection
  useEffect(() => {
    if (!autoSelect) return;
    setSelectedId(autoSelect.partId);
    setView3D(autoSelect.view3D);
    setExtrudePreview(null);
  }, [autoSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPart = parts.find((p) => p.id === selectedId) ?? null;

  const handleAdd = () => {
    const id = addPart();
    setSelectedId(id);
    setView3D(false);
  };

  const handleDeleteSelected = () => {
    for (const id of deleteSet) deletePart(id);
    setDeleteSet(new Set());
    if (selectedId && deleteSet.has(selectedId)) {
      setSelectedId(null);
      setView3D(false);
    }
  };

  const toggleDelete = (id: string) => {
    setDeleteSet((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const startEdit = (part: CadPart, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(part.id);
    setEditName(part.name);
  };

  const commitEdit = () => {
    if (editingId) renamePart(editingId, editName.trim() || "부품");
    setEditingId(null);
  };

  const handleSketchChange = (sketch: Sketch) => {
    if (!selectedId) return;
    updateSketch(selectedId, sketch);
    setExtrude(selectedId, null);
    setExtrudePreview(null);
    setView3D(false);
  };

  const handleExtrudeRequest = (loops: ClosedLoop[], circleIds: string[]) => {
    const initH = selectedPart?.extrude?.height ?? 100;
    setExtrudePreview({ loops, circleIds, height: initH });
    setView3D(true);
  };

  const handleEditExtrude = () => {
    if (!selectedPart?.extrude) return;
    setExtrudePreview({
      loops: selectedPart.extrude.loops,
      circleIds: selectedPart.extrude.circleIds,
      height: selectedPart.extrude.height,
    });
  };

  const handleExtrudeConfirm = () => {
    if (!selectedId || !extrudePreview) return;
    const h = extrudePreview.height;
    if (h < 1 || h > 400 || !Number.isInteger(h)) return;
    setExtrude(selectedId, {
      height: h,
      loops: extrudePreview.loops,
      circleIds: extrudePreview.circleIds,
    });
    setExtrudePreview(null);
    setView3D(true);
  };

  const handleExtrudeCancel = () => {
    setExtrudePreview(null);
    if (!selectedPart?.extrude) setView3D(false);
  };

  const getOrCreateSketch = (part: CadPart): Sketch =>
    part.sketch ?? { plane: selectedPlane, points: [], lines: [], circles: [] };

  const handlePlaneChange = (plane: Plane) => {
    setSelectedPlane(plane);
    if (!selectedId) return;
    const part = parts.find((p) => p.id === selectedId);
    if (!part) return;
    const sk = part.sketch;
    if (
      !sk ||
      (sk.points.length === 0 &&
        sk.lines.length === 0 &&
        sk.circles.length === 0)
    ) {
      updateSketch(selectedId, { plane, points: [], lines: [], circles: [] });
    }
  };

  const handlePartSelect = (id: string) => {
    setSelectedId(id);
    const part = parts.find((p) => p.id === id);
    // Auto-show 3D if the part has extrude already
    setView3D(part?.extrude != null);
  };

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left nav: part list */}
      <Box
        sx={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${t.borderDefault}`,
          bgcolor: t.bgSurface,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: `${tokens.spacing[12]}px`,
            py: `${tokens.spacing[8]}px`,
            borderBottom: `1px solid ${t.borderDefault}`,
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing[4]}px`,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: t.textTertiary,
              flex: 1,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            부품 목록
          </Typography>
          <Tooltip title="부품 추가">
            <Box
              data-tut="add-part-btn"
              onClick={handleAdd}
              sx={{
                width: 22,
                height: 22,
                borderRadius: `${tokens.radius.sm}px`,
                bgcolor: t.accentBlue,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { opacity: 0.85 },
              }}
            >
              <Box
                component="div"
                sx={{ fontSize: 18, fontWeight: 300, lineHeight: 18 }}
              >
                +
              </Box>
            </Box>
          </Tooltip>
          {deleteSet.size > 0 && (
            <Tooltip title={`선택 삭제 (${deleteSet.size}개)`}>
              <Box
                onClick={handleDeleteSelected}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: `${tokens.radius.sm}px`,
                  bgcolor: "#EF4444",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  "&:hover": { opacity: 0.85 },
                }}
              >
                ×
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Part list */}
        <Box sx={{ flex: 1, overflowY: "auto", py: `${tokens.spacing[4]}px` }}>
          {parts.length === 0 && (
            <Typography
              sx={{
                fontSize: 11,
                color: t.textTertiary,
                px: `${tokens.spacing[16]}px`,
                py: `${tokens.spacing[12]}px`,
              }}
            >
              + 버튼으로 부품을 추가하세요
            </Typography>
          )}
          {parts.map((part) => {
            const isActive = selectedId === part.id;
            const inDelete = deleteSet.has(part.id);
            const col = partColorCSS(part.id);
            const hasSolid = part.extrude !== null;
            return (
              <Box
                key={part.id}
                onClick={() => handlePartSelect(part.id)}
                sx={{
                  mx: `${tokens.spacing[8]}px`,
                  px: `${tokens.spacing[10]}px`,
                  py: "8px",
                  borderRadius: `${tokens.radius.sm}px`,
                  border: `1.5px solid ${inDelete ? "#EF4444" : isActive ? col : t.borderDefault}`,
                  bgcolor: inDelete
                    ? "rgba(239,68,68,0.08)"
                    : isActive
                      ? col + "18"
                      : t.bgPrimary,
                  cursor: "pointer",
                  mb: `${tokens.spacing[4]}px`,
                  "&:hover": { borderColor: inDelete ? "#EF4444" : col },
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
                  {editingId === part.id ? (
                    <TextField
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                      }}
                      size="small"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        "& input": { fontSize: 11, py: "2px", px: "4px" },
                        flex: 1,
                      }}
                    />
                  ) : (
                    <Typography
                      onDoubleClick={(e) => startEdit(part, e)}
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textPrimary,
                        flex: 1,
                        cursor: "text",
                      }}
                    >
                      {part.name}
                    </Typography>
                  )}
                  {!hasSolid && <WarnIcon />}
                  {/* Delete checkbox */}
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDelete(part.id);
                    }}
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1.5px solid ${inDelete ? "#EF4444" : t.borderDefault}`,
                      bgcolor: inDelete ? "#EF4444" : "transparent",
                      flexShrink: 0,
                      cursor: "pointer",
                      "&:hover": { borderColor: "#EF4444" },
                    }}
                  />
                </Box>
                {hasSolid && (
                  <Typography
                    sx={{
                      fontSize: 9,
                      color: t.textTertiary,
                      mt: "3px",
                      pl: "14px",
                    }}
                  >
                    H{part.extrude!.height}
                    {part.extrude!.circleIds.length > 0
                      ? ` · 원×${part.extrude!.circleIds.length}`
                      : ""}
                    {part.extrude!.loops.length > 0
                      ? ` · 다각형×${part.extrude!.loops.length}`
                      : ""}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Right: sketch / 3D view */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {!selectedPart ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography sx={{ fontSize: 13, color: t.textTertiary }}>
              왼쪽에서 부품을 선택하거나 추가하세요
            </Typography>
          </Box>
        ) : (
          <>
            {/* Top bar: plane selector + view toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: `${tokens.spacing[6]}px`,
                px: `${tokens.spacing[12]}px`,
                py: `${tokens.spacing[8]}px`,
                borderBottom: `1px solid ${t.borderDefault}`,
                flexShrink: 0,
                bgcolor: t.bgSurface,
              }}
            >
              {/* Plane selector (only visible in sketch mode) */}
              {!view3D && (
                <>
                  <Typography sx={{ fontSize: 11, color: t.textSecondary }}>
                    평면:
                  </Typography>
                  {PLANES.map((pl) => {
                    const active =
                      (selectedPart.sketch?.plane ?? selectedPlane) === pl;
                    return (
                      <Box
                        key={pl}
                        onClick={() => handlePlaneChange(pl)}
                        sx={{
                          px: "10px",
                          py: "3px",
                          borderRadius: `${tokens.radius.sm}px`,
                          border: `1px solid ${active ? t.accentBlue : t.borderDefault}`,
                          bgcolor: active ? t.accentBlue : "transparent",
                          color: active ? t.textOnAccent : t.textSecondary,
                          fontSize: 11,
                          cursor: "pointer",
                          fontWeight: active ? 700 : 400,
                          "&:hover": { borderColor: t.accentBlue },
                        }}
                      >
                        {pl.toUpperCase()}
                      </Box>
                    );
                  })}
                </>
              )}

              {/* View toggle: sketch ↔ 3D */}
              {(selectedPart.extrude || extrudePreview) && (
                <Box sx={{ ml: "auto", display: "flex", gap: "4px" }}>
                  {[
                    { key: false, label: "스케치" },
                    { key: true, label: "3D 뷰" },
                  ].map(({ key, label }) => (
                    <Box
                      key={String(key)}
                      onClick={() => {
                        if (!key) setExtrudePreview(null);
                        setView3D(key);
                      }}
                      sx={{
                        px: "10px",
                        py: "3px",
                        borderRadius: `${tokens.radius.sm}px`,
                        border: `1px solid ${view3D === key ? t.accentBlue : t.borderDefault}`,
                        bgcolor: view3D === key ? t.accentBlue : "transparent",
                        color:
                          view3D === key ? t.textOnAccent : t.textSecondary,
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: view3D === key ? 700 : 400,
                        "&:hover": { borderColor: t.accentBlue },
                      }}
                    >
                      {label}
                    </Box>
                  ))}
                </Box>
              )}

              {selectedPart.extrude && !view3D && (
                <Box
                  sx={{
                    px: "10px",
                    py: "3px",
                    borderRadius: `${tokens.radius.sm}px`,
                    border: "1px solid #22C55E",
                    color: "#22C55E",
                    fontSize: 10,
                  }}
                >
                  돌출 완료 · H{selectedPart.extrude.height}
                </Box>
              )}
              {view3D && selectedPart.extrude && !extrudePreview && (
                <Box
                  onClick={handleEditExtrude}
                  sx={{
                    px: "10px",
                    py: "3px",
                    borderRadius: `${tokens.radius.sm}px`,
                    border: `1px solid ${t.accentBlue}`,
                    color: t.accentBlue,
                    fontSize: 11,
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 },
                  }}
                >
                  높이 수정
                </Box>
              )}
            </Box>

            {/* Content: sketch editor OR 3D viewer */}
            <Box
              data-tut="part-3d"
              sx={{
                flex: 1,
                overflow: "hidden",
                p: view3D ? 0 : `${tokens.spacing[12]}px`,
                position: "relative",
              }}
            >
              {view3D && (selectedPart.extrude || extrudePreview) ? (
                <>
                  <PartViewer3D
                    part={
                      extrudePreview
                        ? {
                            ...selectedPart,
                            extrude: {
                              height: extrudePreview.height,
                              loops: extrudePreview.loops,
                              circleIds: extrudePreview.circleIds,
                            },
                          }
                        : selectedPart
                    }
                    isDark={isDark}
                    previewHeight={extrudePreview?.height}
                  />
                  {/* Live preview overlay */}
                  {extrudePreview && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        bgcolor: isDark
                          ? "rgba(15,23,42,0.92)"
                          : "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(8px)",
                        border: `1px solid ${t.borderDefault}`,
                        borderRadius: `${tokens.radius.md}px`,
                        px: "20px",
                        py: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        minWidth: 300,
                        zIndex: 10,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: t.textPrimary,
                        }}
                      >
                        돌출 높이 설정
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <Slider
                          value={Math.min(
                            Math.max(extrudePreview.height, 1),
                            400,
                          )}
                          min={1}
                          max={400}
                          step={1}
                          onChange={(_, v) =>
                            setExtrudePreview((p) =>
                              p ? { ...p, height: v as number } : p,
                            )
                          }
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          type="number"
                          value={extrudePreview.height}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = parseInt(raw, 10);
                            setExtrudePreview((p) =>
                              p ? { ...p, height: isNaN(v) ? 0 : v } : p,
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleExtrudeConfirm();
                          }}
                          size="small"
                          slotProps={{
                            htmlInput: { min: 1, max: 400, step: 1 },
                          }}
                          sx={{ width: 80 }}
                          error={
                            extrudePreview.height < 1 ||
                            extrudePreview.height > 400 ||
                            !Number.isInteger(extrudePreview.height)
                          }
                        />
                      </Box>
                      {(extrudePreview.height < 1 ||
                        extrudePreview.height > 400 ||
                        !Number.isInteger(extrudePreview.height)) && (
                        <Typography sx={{ fontSize: 11, color: "#EF4444" }}>
                          높이는 1~400 사이의 정수여야 합니다
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          onClick={handleExtrudeCancel}
                          size="small"
                          sx={{ textTransform: "none", fontSize: 12 }}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={handleExtrudeConfirm}
                          variant="contained"
                          size="small"
                          disabled={
                            extrudePreview.height < 1 ||
                            extrudePreview.height > 400 ||
                            !Number.isInteger(extrudePreview.height)
                          }
                          sx={{ textTransform: "none", fontSize: 12 }}
                        >
                          확인
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <SketchEditor
                  sketch={getOrCreateSketch(selectedPart)}
                  onChange={handleSketchChange}
                  onExtrude={handleExtrudeRequest}
                />
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// ── Assembly Tab ──────────────────────────────────────────────────────────────
function AssemblyTab({
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

  const [selection, setSelection] = useState<
    { instanceId: string; edgeId: string }[]
  >([]);
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
  }, [pendingGhostPartId]);

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
    [addInstance, parts],
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
      setSelection([{ instanceId: b.instanceId, edgeId: b.edgeId }]);
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
    setSelection([]);
  };

  const handleDeleteInstance = (instanceId: string) => {
    sceneAPIRef.current?.removeInstance(instanceId);
    removeInstance(instanceId);
    setClickedInstanceId(null);
    setSelection([]);
  };

  const handleRotate = () => {
    if (selection.length !== 1) return;
    const { instanceId, edgeId } = selection[0];
    sceneAPIRef.current?.rotateAtEdge(instanceId, edgeId, 180);
    const inst = instances.find((i) => i.instanceId === instanceId);
    if (inst) setInstanceRotX(instanceId, inst.rotX + Math.PI);
  };

  const canAssemble =
    selection.length === 2 &&
    selection[0].instanceId !== selection[1].instanceId &&
    (sceneAPIRef.current?.canAssemble(
      selection[0].instanceId,
      selection[0].edgeId,
      selection[1].instanceId,
      selection[1].edgeId,
    ) ??
      false);

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
            setSelection(sel);
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

// ── Tutorial Overlay ──────────────────────────────────────────────────────────
const TUTORIAL_STEPS: {
  targets: string[];
  text: string;
  pad?: number;
  textSide?: "left" | "right";
  textBelow?: boolean;
}[] = [
  { targets: ["demo-btn"], text: "데모를 사용하실 수 있습니다." },
  { targets: ["tabs"], text: "필요에 따라 모드를 바꿀 수 있습니다." },
  { targets: ["add-part-btn"], text: "클릭하여 부품을 추가할 수 있습니다." },
  { targets: ["sketch-tools"], text: "도형을 스케치 할 수 있습니다." },
  {
    targets: ["sketch-shapes", "part-3d-canvas"],
    text: "닫힌 도형으로 돌출 할 수 있습니다.",
    pad: 48,
  },
  { targets: ["assembly-parts-panel"], text: "방금 그린 부품이 나타납니다." },
  { targets: ["assembly-canvas"], text: "부품을 불러와 조립할 수 있습니다." },
  {
    targets: ["blueprint-parts-list"],
    text: "부품을 선택하여 설계도를 볼 수 있습니다.",
    textBelow: true,
  },
];

const PAD = 10;
const TEXT_GAP = 18; // gap between spotlight edge and tooltip text

function TutorialOverlay({
  step,
  onNext,
  onExit,
}: {
  step: number;
  onNext: () => void;
  onExit: () => void;
}) {
  const [rects, setRects] = useState<
    { x: number; y: number; w: number; h: number }[]
  >([]);
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({});
  const cfg = TUTORIAL_STEPS[step - 1];
  const stepPad = cfg?.pad ?? PAD;

  useEffect(() => {
    if (!cfg) return;
    const compute = () => {
      const rs = cfg.targets
        .map((id) => {
          const el = document.querySelector(`[data-tut="${id}"]`);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, w: r.width, h: r.height };
        })
        .filter(Boolean) as { x: number; y: number; w: number; h: number }[];
      setRects(rs);

      if (rs.length > 0) {
        const minX = Math.min(...rs.map((r) => r.x));
        const maxX = Math.max(...rs.map((r) => r.x + r.w));
        const minY = Math.min(...rs.map((r) => r.y));
        const maxY = Math.max(...rs.map((r) => r.y + r.h));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        if (cfg.textBelow) {
          setTextStyle({
            top: maxY + stepPad + TEXT_GAP,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
          });
        } else {
          const side =
            cfg.textSide ??
            (centerX > window.innerWidth / 2 ? "left" : "right");
          if (side === "left") {
            setTextStyle({
              right: window.innerWidth - (minX - stepPad - TEXT_GAP),
              top: centerY,
              transform: "translateY(-50%)",
              textAlign: "right",
            });
          } else {
            setTextStyle({
              left: maxX + stepPad + TEXT_GAP,
              top: centerY,
              transform: "translateY(-50%)",
              textAlign: "left",
            });
          }
        }
      }
    };
    compute();
    const interval = setInterval(compute, 300); // recompute when DOM content changes (e.g. sketch→3D)
    window.addEventListener("resize", compute);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", compute);
    };
  }, [step, cfg]);

  return (
    <>
      {/* Click-to-advance layer */}
      <Box
        onClick={onNext}
        sx={{ position: "fixed", inset: 0, zIndex: 3000, cursor: "pointer" }}
      />

      {/* X button — top right */}
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 3003,
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: 20,
          lineHeight: 1,
          "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
        }}
      >
        ×
      </Box>

      {/* SVG dimming with cutouts */}
      <Box
        component="svg"
        xmlns="http://www.w3.org/2000/svg"
        sx={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 3001,
          pointerEvents: "none",
        }}
      >
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            {rects.map((r, i) => (
              <rect
                key={i}
                x={r.x - stepPad}
                y={r.y - stepPad}
                width={r.w + stepPad * 2}
                height={r.h + stepPad * 2}
                rx="8"
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.82)"
          mask="url(#tut-mask)"
        />
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x - stepPad}
            y={r.y - stepPad}
            width={r.w + stepPad * 2}
            height={r.h + stepPad * 2}
            rx="8"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 14px rgba(96,165,250,0.85))" }}
          />
        ))}
      </Box>

      {/* Tooltip text — beside the spotlight */}
      {cfg && (
        <Box
          sx={{
            position: "fixed",
            zIndex: 3002,
            pointerEvents: "none",
            maxWidth: 260,
            ...textStyle,
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
              lineHeight: 1.5,
            }}
          >
            {cfg.text}
          </Typography>
        </Box>
      )}

      {/* Paging dots + hint — fixed bottom center */}
      <Box
        sx={{
          position: "fixed",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3002,
          pointerEvents: "none",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Box sx={{ display: "flex", gap: "7px" }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: i === step - 1 ? "#fff" : "rgba(255,255,255,0.28)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </Box>
        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
          클릭하여 계속
        </Typography>
      </Box>
    </>
  );
}

// ── Blueprint Tab ─────────────────────────────────────────────────────────────
type ViewDir = "front" | "side" | "top" | "bottom";
const VIEW_LABELS: Record<ViewDir, string> = {
  front: "앞면",
  side: "옆면",
  top: "윗면",
  bottom: "밑면",
};
const VIEWS: ViewDir[] = ["front", "side", "top", "bottom"];

interface BpShape {
  kind: "circle" | "polygon";
  isHole: boolean;
  cx: number;
  cy: number;
  r: number; // circle (sketch coords; cy → world Z)
  pts: { x: number; y: number }[]; // polygon (sketch coords; pt.y → world Z)
}

interface BpPart {
  partId: string;
  name: string;
  pos: [number, number, number];
  height: number;
  shapes: BpShape[];
}

function buildBpPart(
  part: CadPart,
  pos: [number, number, number],
): BpPart | null {
  if (!part.extrude || !part.sketch) return null;
  const { extrude, sketch } = part;
  const pm = new Map(sketch.points.map((p) => [p.id, p]));
  const shapes: BpShape[] = [];

  extrude.circleIds.forEach((cid) => {
    const c = sketch.circles.find((x) => x.id === cid);
    if (!c || c.isHole) return;
    shapes.push({
      kind: "circle",
      isHole: false,
      cx: c.cx,
      cy: c.cy,
      r: c.r,
      pts: [],
    });
  });

  sketch.circles
    .filter((c) => c.isHole)
    .forEach((hc) => {
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
      if (insideSolid)
        shapes.push({
          kind: "circle",
          isHole: true,
          cx: hc.cx,
          cy: hc.cy,
          r: hc.r,
          pts: [],
        });
    });

  extrude.loops.forEach((loop) => {
    const pts = loop.map((pid) => pm.get(pid)).filter(Boolean) as {
      x: number;
      y: number;
    }[];
    if (pts.length >= 3)
      shapes.push({ kind: "polygon", isHole: false, cx: 0, cy: 0, r: 0, pts });
  });

  return {
    partId: part.id,
    name: part.name,
    pos,
    height: extrude.height,
    shapes,
  };
}

function getViewBounds(bps: BpPart[], view: ViewDir) {
  let minH = Infinity,
    maxH = -Infinity,
    minV = Infinity,
    maxV = -Infinity;
  const expand = (h: number, v: number, pad = 0) => {
    minH = Math.min(minH, h - pad);
    maxH = Math.max(maxH, h + pad);
    minV = Math.min(minV, v - pad);
    maxV = Math.max(maxV, v + pad);
  };
  const isFlat = view === "top" || view === "bottom";
  for (const bp of bps) {
    const [px, py, pz] = bp.pos;
    for (const sh of bp.shapes) {
      if (sh.kind === "circle") {
        const wx = px + sh.cx,
          wz = pz + sh.cy,
          r = sh.r;
        if (isFlat) {
          expand(view === "bottom" ? -wx : wx, -wz, r);
        } else {
          const hh = view === "front" ? wx : wz;
          expand(hh - r, py);
          expand(hh + r, py + bp.height);
        }
      } else {
        for (const pt of sh.pts) {
          const wx = px + pt.x,
            wz = pz + pt.y;
          if (isFlat) {
            expand(view === "bottom" ? -wx : wx, -wz);
          } else {
            const hh = view === "front" ? wx : wz;
            expand(hh, py);
            expand(hh, py + bp.height);
          }
        }
      }
    }
  }
  if (!isFinite(minH)) return { minH: -100, maxH: 100, minV: -100, maxV: 100 };
  return { minH, maxH, minV, maxV };
}

function drawBpView(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bps: BpPart[],
  view: ViewDir,
  isDark: boolean,
) {
  const bg = isDark ? "#0F172A" : "#F1F5F9";
  const axisCol = isDark ? "#334155" : "#CBD5E1";
  const dimCol = isDark ? "#94A3B8" : "#64748B";
  const PAD = 36;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (bps.length === 0) {
    ctx.fillStyle = dimCol;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("데이터 없음", W / 2, H / 2);
    return;
  }

  const { minH, maxH, minV, maxV } = getViewBounds(bps, view);
  const SCALE =
    Math.min(
      (W - PAD * 2) / Math.max(maxH - minH, 1),
      (H - PAD * 2) / Math.max(maxV - minV, 1),
    ) * 0.82;
  const offH = W / 2 - ((minH + maxH) / 2) * SCALE;
  const offV = H / 2 + ((minV + maxV) / 2) * SCALE;
  const tc = (wh: number, wv: number): [number, number] => [
    offH + wh * SCALE,
    offV - wv * SCALE,
  ];

  // Axis lines
  const [axX] = tc(0, 0);
  const [, axY] = tc(0, 0);
  ctx.strokeStyle = axisCol;
  ctx.lineWidth = 0.6;
  ctx.setLineDash([4, 4]);
  if (axX > PAD && axX < W - PAD) {
    ctx.beginPath();
    ctx.moveTo(axX, PAD);
    ctx.lineTo(axX, H - PAD);
    ctx.stroke();
  }
  if (axY > PAD && axY < H - PAD) {
    ctx.beginPath();
    ctx.moveTo(PAD, axY);
    ctx.lineTo(W - PAD, axY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const isFlat = view === "top" || view === "bottom";

  for (const bp of bps) {
    const [px, py, pz] = bp.pos;
    const col = partColorCSS(bp.partId);

    // Draw solid shapes first, then holes on top
    const sorted = [...bp.shapes].sort(
      (a, b) => (a.isHole ? 1 : 0) - (b.isHole ? 1 : 0),
    );
    for (const sh of sorted) {
      ctx.fillStyle = sh.isHole ? bg : col + "28";
      ctx.strokeStyle = sh.isHole ? dimCol : col;
      ctx.lineWidth = sh.isHole ? 1 : 1.5;
      if (sh.isHole) ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);

      if (sh.kind === "circle") {
        const wx = px + sh.cx,
          wz = pz + sh.cy,
          r = sh.r;
        if (isFlat) {
          const [cx2, cy2] = tc(view === "bottom" ? -wx : wx, -wz);
          ctx.beginPath();
          ctx.arc(cx2, cy2, r * SCALE, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (!sh.isHole) {
            ctx.fillStyle = dimCol;
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`Ø${(r * 2).toFixed(0)}`, cx2, cy2 + r * SCALE + 10);
          }
        } else {
          const hh = view === "front" ? wx : wz;
          const [x1, y1] = tc(hh - r, py + bp.height);
          const [x2, y2] = tc(hh + r, py);
          ctx.beginPath();
          ctx.rect(x1, y1, x2 - x1, y2 - y1);
          ctx.fill();
          ctx.stroke();
          if (!sh.isHole) {
            // Height dim
            const dx = x2 + 5;
            ctx.strokeStyle = axisCol;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(dx, y1);
            ctx.lineTo(dx, y2);
            ctx.stroke();
            [y1, y2].forEach((yy) => {
              ctx.beginPath();
              ctx.moveTo(dx - 3, yy);
              ctx.lineTo(dx + 3, yy);
              ctx.stroke();
            });
            ctx.fillStyle = dimCol;
            ctx.font = "8px monospace";
            ctx.textAlign = "left";
            ctx.fillText(`H${bp.height}`, dx + 4, (y1 + y2) / 2 + 3);
            // Width dim
            const dy = y2 + 12;
            ctx.strokeStyle = axisCol;
            ctx.beginPath();
            ctx.moveTo(x1, dy);
            ctx.lineTo(x2, dy);
            ctx.stroke();
            [x1, x2].forEach((xx) => {
              ctx.beginPath();
              ctx.moveTo(xx, dy - 3);
              ctx.lineTo(xx, dy + 3);
              ctx.stroke();
            });
            ctx.fillStyle = dimCol;
            ctx.textAlign = "center";
            ctx.fillText(`Ø${(r * 2).toFixed(0)}`, (x1 + x2) / 2, dy + 9);
          }
        }
      } else if (sh.pts.length > 0) {
        if (isFlat) {
          const cpts = sh.pts.map((pt) => {
            const wx = px + pt.x,
              wz = pz + pt.y;
            return tc(view === "bottom" ? -wx : wx, -wz);
          });
          ctx.beginPath();
          ctx.moveTo(cpts[0][0], cpts[0][1]);
          for (let i = 1; i < cpts.length; i++)
            ctx.lineTo(cpts[i][0], cpts[i][1]);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          const coords = sh.pts.map((pt) =>
            view === "front" ? px + pt.x : pz + pt.y,
          );
          const minC = Math.min(...coords),
            maxC = Math.max(...coords);
          const [x1, y1] = tc(minC, py + bp.height);
          const [x2, y2] = tc(maxC, py);
          ctx.beginPath();
          ctx.rect(x1, y1, x2 - x1, y2 - y1);
          ctx.fill();
          ctx.stroke();
          // Height dim
          const dx = x2 + 5;
          ctx.strokeStyle = axisCol;
          ctx.lineWidth = 0.6;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(dx, y1);
          ctx.lineTo(dx, y2);
          ctx.stroke();
          [y1, y2].forEach((yy) => {
            ctx.beginPath();
            ctx.moveTo(dx - 3, yy);
            ctx.lineTo(dx + 3, yy);
            ctx.stroke();
          });
          ctx.fillStyle = dimCol;
          ctx.font = "8px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`H${bp.height}`, dx + 4, (y1 + y2) / 2 + 3);
        }
      }
      ctx.setLineDash([]);
    }
  }
}

function BpCanvas({
  bps,
  view,
  isDark,
}: {
  bps: BpPart[];
  view: ViewDir;
  isDark: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const redraw = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBpView(ctx, W, H, bps, view, isDark);
    };
    redraw();
    const ro = new ResizeObserver(redraw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [bps, view, isDark]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

function BlueprintView({ isDark }: { isDark: boolean }) {
  const theme = useTheme();
  const t = theme.palette.tokens.color;
  const { parts, instances } = useCadStore();
  const [target, setTarget] = useState<"assembly" | string>("assembly");

  const solidParts = parts.filter((p) => p.extrude != null);

  let bps: BpPart[] = [];
  if (target === "assembly") {
    bps = instances.flatMap((inst) => {
      const part = parts.find((p) => p.id === inst.partId);
      if (!part) return [];
      const bp = buildBpPart(part, inst.position);
      return bp ? [bp] : [];
    });
  } else {
    const part = parts.find((p) => p.id === target);
    if (part) {
      const bp = buildBpPart(part, [0, 0, 0]);
      if (bp) bps = [bp];
    }
  }

  if (solidParts.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography sx={{ fontSize: 13, color: t.textTertiary }}>
          부품 탭에서 스케치 후 돌출하세요
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Subject selector */}
      <Box
        data-tut="blueprint-parts-list"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          px: `${tokens.spacing[16]}px`,
          py: "8px",
          flexShrink: 0,
          borderBottom: `1px solid ${t.borderDefault}`,
          flexWrap: "wrap",
          bgcolor: t.bgSurface,
        }}
      >
        <Typography sx={{ fontSize: 11, color: t.textTertiary, mr: "4px" }}>
          대상:
        </Typography>
        {(
          [
            { id: "assembly", label: "전체 조립" },
            ...solidParts.map((p) => ({ id: p.id, label: p.name })),
          ] as { id: string; label: string }[]
        ).map(({ id, label }) => (
          <Box
            key={id}
            onClick={() => setTarget(id)}
            sx={{
              px: "10px",
              py: "3px",
              borderRadius: `${tokens.radius.sm}px`,
              fontSize: 11,
              cursor: "pointer",
              userSelect: "none",
              border: `1px solid ${target === id ? t.accentBlue : t.borderDefault}`,
              bgcolor: target === id ? t.accentBlue : "transparent",
              color: target === id ? t.textOnAccent : t.textSecondary,
              fontWeight: target === id ? 700 : 400,
              "&:hover": { borderColor: t.accentBlue },
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      {/* 2×2 orthographic views */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "1px",
          bgcolor: t.borderDefault,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {VIEWS.map((v) => (
          <Box
            key={v}
            sx={{
              bgcolor: t.bgPrimary,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 6,
                left: 8,
                zIndex: 1,
                fontSize: 10,
                fontWeight: 700,
                color: t.textTertiary,
                pointerEvents: "none",
                letterSpacing: "0.04em",
              }}
            >
              {VIEW_LABELS[v]}
            </Box>
            <BpCanvas bps={bps} view={v} isDark={isDark} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MiniCadPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const t = theme.palette.tokens.color;
  const [tab, setTab] = useState<Tab>("parts");
  const [assemblyMounted, setAssemblyMounted] = useState(false);
  useEffect(() => {
    if (tab === "assembly") setAssemblyMounted(true);
  }, [tab]);

  // Shared scene API ref (passed down to AssemblyTab)
  const assemblySceneAPIRef = useRef<SceneAPI | null>(null);

  // Demo control
  const [autoSelectPart, setAutoSelectPart] = useState<{
    partId: string;
    view3D: boolean;
  } | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState("");
  const demoRunningRef = useRef(false);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const waitForScene = () =>
    new Promise<void>((r) => {
      const check = () =>
        assemblySceneAPIRef.current ? r() : setTimeout(check, 60);
      check();
    });

  const runDemo = async () => {
    if (demoRunningRef.current) return;
    demoRunningRef.current = true;
    setIsDemoRunning(true);

    const go = () => demoRunningRef.current;
    const step = async (msg: string, ms: number) => {
      if (!go()) return;
      setDemoStatus(msg);
      await sleep(ms);
    };

    const store = useCadStore.getState();

    // Clear existing 3D scene instances before reset
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    setAutoSelectPart(null);
    setTab("parts");
    await sleep(400);

    if (!go()) return;

    // ── Part 1: OD=130(r=65), ID=100(r=50), h=100 ──
    const p1 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p1, "부품 1");
    useCadStore.getState().updateSketch(p1, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p1}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p1}-i`, cx: 0, cy: 0, r: 50, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p1, view3D: false });
    await step("부품 1 스케치 — 외경 130, 내경 100", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p1, { height: 100, loops: [], circleIds: [`${p1}-o`] });
    setAutoSelectPart({ partId: p1, view3D: true });
    await step("부품 1 돌출 100", 2000);

    // ── Part 2: OD=160(r=80), ID=130(r=65), h=30 ──
    if (!go()) return;
    const p2 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p2, "부품 2");
    useCadStore.getState().updateSketch(p2, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p2}-o`, cx: 0, cy: 0, r: 80 },
        { id: `${p2}-i`, cx: 0, cy: 0, r: 65, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p2, view3D: false });
    await step("부품 2 스케치 — 외경 160, 내경 130", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p2, { height: 30, loops: [], circleIds: [`${p2}-o`] });
    setAutoSelectPart({ partId: p2, view3D: true });
    await step("부품 2 돌출 30", 2000);

    // ── Part 3: OD=100(r=50), ID=70(r=35), h=100 ──
    if (!go()) return;
    const p3 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p3, "부품 3");
    useCadStore.getState().updateSketch(p3, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p3}-o`, cx: 0, cy: 0, r: 50 },
        { id: `${p3}-i`, cx: 0, cy: 0, r: 35, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p3, view3D: false });
    await step("부품 3 스케치 — 외경 100, 내경 70", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p3, { height: 100, loops: [], circleIds: [`${p3}-o`] });
    setAutoSelectPart({ partId: p3, view3D: true });
    await step("부품 3 돌출 100", 2000);

    // ── Part 4: OD=130(r=65), ID=100(r=50), 내경80(r=40) 그린 뒤 r=40 제거, h=80 ──
    if (!go()) return;
    const p4 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p4, "부품 4");
    useCadStore.getState().updateSketch(p4, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p4}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p4}-i`, cx: 0, cy: 0, r: 50, isHole: true },
        { id: `${p4}-x`, cx: 0, cy: 0, r: 40 }, // 삭제 예정
      ],
    });
    setAutoSelectPart({ partId: p4, view3D: false });
    await step("부품 4 스케치 — 외경 130, 내경 100, 내경 80 그리기", 2000);
    if (!go()) return;
    // 내경 80(r=40) 제거
    useCadStore.getState().updateSketch(p4, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p4}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p4}-i`, cx: 0, cy: 0, r: 50, isHole: true },
      ],
    });
    await step("부품 4 — 내경 80 스케치 제거", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p4, { height: 80, loops: [], circleIds: [`${p4}-o`] });
    setAutoSelectPart({ partId: p4, view3D: true });
    await step("부품 4 돌출 80", 2000);

    // ── 조립 탭 ──
    if (!go()) return;
    setAutoSelectPart(null);
    await step("조립 탭으로 이동", 500);
    setTab("assembly");
    await waitForScene();
    await sleep(500);

    const api = assemblySceneAPIRef.current!;
    const getPart = (id: string) =>
      useCadStore.getState().parts.find((p) => p.id === id)!;

    // 부품 1 배치 (고정)
    if (!go()) return;
    const i1 = useCadStore.getState().addInstance(p1, [0, 0, 0]);
    api.addInstance(
      { instanceId: i1, partId: p1, position: [0, 0, 0], rotX: 0, links: [] },
      getPart(p1),
    );
    api.setCameraPosition([350, 400, 700], [0, 50, 0]);
    await step("부품 1 배치", 2000);

    // 부품 3 배치
    if (!go()) return;
    const i3 = useCadStore.getState().addInstance(p3, [350, 0, 0]);
    api.addInstance(
      { instanceId: i3, partId: p3, position: [350, 0, 0], rotX: 0, links: [] },
      getPart(p3),
    );
    api.setCameraPosition([500, 350, 750], [175, 50, 0]);
    await step("부품 3 배치 — 조립 준비", 2000);

    // 카메라를 부품1 바닥 내경이 보이도록 (아래에서 올려보는 각도)
    if (!go()) return;
    api.setCameraPosition([200, -150, 400], [0, 0, 0]);
    await step("부품 1 바닥 내경이 보이도록 카메라 전환", 2000);

    // 부품1 내경 + 부품3 외경 결합
    if (!go()) return;
    const r13 = api.assemble(i1, "hole-0-bottom", i3, "circ-0-bottom");
    if (r13.success && r13.moverPos) {
      useCadStore.getState().setInstancePosition(i3, r13.moverPos);
      useCadStore.getState().setInstanceRotX(i3, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i3,
        myEdgeId: "circ-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "hole-0-bottom",
      });
    }
    api.setCameraPosition([250, 350, 600], [0, 50, 0]);
    await step("부품 1 내경 ↔ 부품 3 외경 결합", 2000);

    // 부품 2 배치
    if (!go()) return;
    const i2 = useCadStore.getState().addInstance(p2, [350, 0, 200]);
    api.addInstance(
      {
        instanceId: i2,
        partId: p2,
        position: [350, 0, 200],
        rotX: 0,
        links: [],
      },
      getPart(p2),
    );
    api.setCameraPosition([520, 320, 720], [150, 30, 80]);
    await step("부품 2 배치 — 조립 준비", 2000);

    // 부품2 바닥 내경 + 부품1 바닥 외경 결합
    if (!go()) return;
    const r12 = api.assemble(i1, "circ-0-bottom", i2, "hole-0-bottom");
    if (r12.success && r12.moverPos) {
      useCadStore.getState().setInstancePosition(i2, r12.moverPos);
      useCadStore.getState().setInstanceRotX(i2, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i2,
        myEdgeId: "hole-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "circ-0-bottom",
      });
    }
    api.setCameraPosition([300, 280, 620], [0, 30, 0]);
    await step("부품 2 바닥 내경 ↔ 부품 1 바닥 외경 결합", 2000);

    // 부품 4 배치
    if (!go()) return;
    const i4 = useCadStore.getState().addInstance(p4, [-350, 0, 0]);
    api.addInstance(
      {
        instanceId: i4,
        partId: p4,
        position: [-350, 0, 0],
        rotX: 0,
        links: [],
      },
      getPart(p4),
    );
    api.setCameraPosition([-200, 420, 720], [-80, 80, 0]);
    await step("부품 4 배치 — 조립 준비", 2000);

    // 부품1 위쪽 외경 + 부품4 바닥 외경 결합
    if (!go()) return;
    const r14 = api.assemble(i1, "circ-0-top", i4, "circ-0-bottom");
    if (r14.success && r14.moverPos) {
      useCadStore.getState().setInstancePosition(i4, r14.moverPos);
      useCadStore.getState().setInstanceRotX(i4, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i4,
        myEdgeId: "circ-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "circ-0-top",
      });
    }
    api.setCameraPosition([450, 550, 900], [0, 100, 0]);
    await step("부품 1 위쪽 외경 ↔ 부품 4 바닥 외경 결합", 2000);

    // 설계도 탭
    if (!go()) return;
    setTab("blueprint");
    await step("설계도 보기", 2000);

    setDemoStatus("");
    setIsDemoRunning(false);
    demoRunningRef.current = false;
  };

  const stopDemo = () => {
    demoRunningRef.current = false;
    setIsDemoRunning(false);
    setDemoStatus("");
    setAutoSelectPart(null);
  };

  // ── Tutorial ──────────────────────────────────────────────────────────────
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const tutorialPartIdRef = useRef<string | null>(null);
  const tutorialAdvancingRef = useRef(false);

  const exitTutorial = useCallback(() => {
    setTutorialStep(0);
    setAutoSelectPart(null);
    setTab("parts");
    const store = useCadStore.getState();
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    tutorialPartIdRef.current = null;
  }, []);

  const tutorialAnimCancelRef = useRef(false);

  // Runs BEFORE the step is shown (tab switches, initial setup)
  const runTutorialPreAction = async (toStep: number) => {
    if (toStep === 4) {
      setTab("parts");
      await sleep(300);
      const pid = useCadStore.getState().addPart();
      tutorialPartIdRef.current = pid;
      setAutoSelectPart({ partId: pid, view3D: false });
      await sleep(400);
    } else if (toStep === 5) {
      // Show only outer circle in sketch mode when spotlight first appears
      const pid = tutorialPartIdRef.current;
      if (pid) {
        useCadStore.getState().updateSketch(pid, {
          plane: "xy",
          points: [],
          lines: [],
          circles: [{ id: `${pid}-o`, cx: 0, cy: 0, r: 65 }],
        });
        setAutoSelectPart({ partId: pid, view3D: false });
        await sleep(300);
      }
    } else if (toStep === 6) {
      setAutoSelectPart(null);
      setTab("assembly");
      await waitForScene();
      await sleep(500);
    } else if (toStep === 7) {
      // Just switch to assembly — the instance placement & assembly happen in post-action
      setTab("assembly");
      await waitForScene();
      await sleep(400);
    } else if (toStep === 8) {
      setTab("blueprint");
      await sleep(500);
    }
  };

  // Runs AFTER the step spotlight appears (animations visible in the spotlight)
  const runTutorialPostAction = async (toStep: number) => {
    if (toStep === 5) {
      const pid = tutorialPartIdRef.current;
      if (!pid) return;

      // Scene 1: outer circle — already visible, hold
      await sleep(1000);
      if (tutorialAnimCancelRef.current) return;

      // Scene 2: add inner hole circle
      useCadStore.getState().updateSketch(pid, {
        plane: "xy",
        points: [],
        lines: [],
        circles: [
          { id: `${pid}-o`, cx: 0, cy: 0, r: 65 },
          { id: `${pid}-i`, cx: 0, cy: 0, r: 40, isHole: true },
        ],
      });
      await sleep(1000);
      if (tutorialAnimCancelRef.current) return;

      // Scene 3: extrude → 3D view
      useCadStore
        .getState()
        .setExtrude(pid, { height: 100, loops: [], circleIds: [`${pid}-o`] });
      setAutoSelectPart({ partId: pid, view3D: true });
    } else if (toStep === 7) {
      const pid = tutorialPartIdRef.current;
      if (!pid || !assemblySceneAPIRef.current) return;
      const api = assemblySceneAPIRef.current;
      const part = useCadStore.getState().parts.find((p) => p.id === pid);
      if (!part) return;

      // Scene 1: place first instance
      const iid1 = useCadStore.getState().addInstance(pid, [0, 0, 0]);
      api.addInstance(
        {
          instanceId: iid1,
          partId: pid,
          position: [0, 0, 0],
          rotX: 0,
          links: [],
        },
        part,
      );
      api.setCameraPosition([300, 300, 500], [0, 50, 0]);
      await sleep(900);
      if (tutorialAnimCancelRef.current) return;

      // Scene 2: place second instance offset
      const iid2 = useCadStore.getState().addInstance(pid, [250, 0, 0]);
      api.addInstance(
        {
          instanceId: iid2,
          partId: pid,
          position: [250, 0, 0],
          rotX: 0,
          links: [],
        },
        part,
      );
      api.setCameraPosition([400, 300, 600], [120, 50, 0]);
      await sleep(900);
      if (tutorialAnimCancelRef.current) return;

      // Scene 3: assemble
      const result = api.assemble(iid1, "circ-0-top", iid2, "circ-0-bottom");
      if (result.success && result.moverPos) {
        useCadStore.getState().setInstancePosition(iid2, result.moverPos);
        useCadStore.getState().setInstanceRotX(iid2, 0);
        useCadStore.getState().linkInstances({
          ownerInstanceId: iid2,
          myEdgeId: "circ-0-bottom",
          targetInstanceId: iid1,
          targetEdgeId: "circ-0-top",
        });
      }
      api.setCameraPosition([200, 350, 500], [0, 100, 0]);
    }
  };

  const restartTutorial = () => {
    tutorialAnimCancelRef.current = true;
    tutorialAdvancingRef.current = false;
    tutorialPartIdRef.current = null;
    const store = useCadStore.getState();
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    setAutoSelectPart(null);
    setTab('parts');
    setTutorialStep(1);
  };

  const advanceTutorial = async () => {
    if (tutorialAdvancingRef.current) return;
    tutorialAdvancingRef.current = true;
    tutorialAnimCancelRef.current = true; // cancel any running post-animation

    // Guarantee extrude exists when leaving step 5 (user may have skipped animation)
    if (tutorialStep === 5) {
      const pid = tutorialPartIdRef.current;
      if (pid) {
        const st = useCadStore.getState();
        const part = st.parts.find((p) => p.id === pid);
        if (part) {
          const hasOuter = part.sketch?.circles.some((c) => c.id === `${pid}-o`);
          if (!hasOuter) {
            st.updateSketch(pid, {
              plane: 'xy', points: [], lines: [],
              circles: [
                { id: `${pid}-o`, cx: 0, cy: 0, r: 65 },
                { id: `${pid}-i`, cx: 0, cy: 0, r: 40, isHole: true },
              ],
            });
          }
          if (!part.extrude) {
            st.setExtrude(pid, { height: 100, loops: [], circleIds: [`${pid}-o`] });
          }
        }
      }
    }

    const next = tutorialStep + 1;
    if (next > TUTORIAL_STEPS.length) {
      exitTutorial();
      tutorialAdvancingRef.current = false;
      return;
    }
    await runTutorialPreAction(next);
    setTutorialStep(next);
    tutorialAdvancingRef.current = false;
    // Launch post-animation (fire-and-forget, cancellable on next advance)
    tutorialAnimCancelRef.current = false;
    runTutorialPostAction(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tutorialStep > 0) exitTutorial();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tutorialStep, exitTutorial]);

  const TAB_LABELS: Record<Tab, string> = {
    parts: "부품",
    assembly: "조립",
    blueprint: "설계도",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: t.bgPrimary,
        height: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Tutorial overlay */}
      {tutorialStep > 0 && !isDemoRunning && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={advanceTutorial}
          onExit={exitTutorial}
        />
      )}

      {/* Demo status overlay */}
      {isDemoRunning && demoStatus && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            bgcolor: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
            border: "1px solid #3B82F6",
            borderRadius: "8px",
            px: "20px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#3B82F6",
              flexShrink: 0,
              "@keyframes pulse": {
                "0%,100%": { opacity: 1 },
                "50%": { opacity: 0.3 },
              },
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? "#E2E8F0" : "#1E293B",
            }}
          >
            {demoStatus}
          </Typography>
        </Box>
      )}

      {/* Tab bar */}
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
        <Box
          data-tut="tabs"
          sx={{ display: "flex", gap: `${tokens.spacing[4]}px` }}
        >
          {(["parts", "assembly", "blueprint"] as Tab[]).map((m) => (
            <Box
              key={m}
              onClick={() => !isDemoRunning && setTab(m)}
              sx={{
                px: `${tokens.spacing[12]}px`,
                height: 30,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                bgcolor: tab === m ? t.accentBlue : "transparent",
                color: tab === m ? t.textOnAccent : t.textSecondary,
                cursor: isDemoRunning ? "default" : "pointer",
                userSelect: "none",
                fontSize: tokens.fontSize.sm,
                fontWeight: tab === m ? 600 : 400,
                transition: "all 0.15s",
                "&:hover": {
                  bgcolor: isDemoRunning
                    ? "transparent"
                    : tab === m
                      ? t.accentBlue
                      : t.bgSurface,
                },
              }}
            >
              {TAB_LABELS[m]}
            </Box>
          ))}
        </Box>

        {/* Help + Demo buttons */}
        <Box sx={{ ml: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {tutorialStep === 0 && !isDemoRunning && (
            <Box
              onClick={restartTutorial}
              sx={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: `1px solid ${t.borderDefault}`,
                color: t.textSecondary,
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                "&:hover": { borderColor: t.accentBlue, color: t.accentBlue },
              }}
            >
              ?
            </Box>
          )}
          {isDemoRunning ? (
            <Box
              onClick={stopDemo}
              sx={{
                px: "12px",
                height: 28,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: "1px solid #EF4444",
                color: "#EF4444",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
              }}
            >
              ■ 중지
            </Box>
          ) : (
            <Box
              data-tut="demo-btn"
              onClick={runDemo}
              sx={{
                px: "12px",
                height: 28,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: "1px solid #A855F7",
                color: "#A855F7",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(168,85,247,0.08)" },
              }}
            >
              ▶ 데모
            </Box>
          )}
        </Box>
      </Box>  {/* end tab bar */}

      {tab === "parts" && (
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <PartsTab autoSelect={autoSelectPart} />
        </Box>
      )}

      {/* Lazy-mount assembly (first visit), then keep mounted to preserve Three.js scene */}
      {assemblyMounted && (
        <Box
          sx={{
            flex: 1,
            display: tab === "assembly" ? "flex" : "none",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <AssemblyTab isDark={isDark} sceneAPIRef={assemblySceneAPIRef} />
        </Box>
      )}

      {tab === "blueprint" && (
        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <BlueprintView isDark={isDark} />
        </Box>
      )}
    </Box>
  );
}
