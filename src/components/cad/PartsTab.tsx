import SketchEditor from "./SketchEditor";
import PartViewer3D from "./PartViewer3D";
import { useState } from "react";
import { Box, Button, Slider, TextField, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useCadStore } from "./cadStore";
import { partColorCSS } from "./cadUtils";
import type { CadPart, ClosedLoop, Plane, Sketch } from "./types";

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
export default function PartsTab({
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
  // autoSelect 가 바뀐 렌더에서 곧바로 state 를 맞춘다 (effect 사용 시 연쇄 렌더 발생)
  const [prevAutoSelect, setPrevAutoSelect] = useState(autoSelect);
  if (autoSelect !== prevAutoSelect) {
    setPrevAutoSelect(autoSelect);
    if (autoSelect) {
      setSelectedId(autoSelect.partId);
      setView3D(autoSelect.view3D);
      setExtrudePreview(null);
    }
  }

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
      if (n.has(id)) n.delete(id);
      else n.add(id);
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
                      // 더블클릭으로 편집을 연 직후라 포커스가 입력창으로 가는 것이 옳다.
                      // 규칙이 막으려는 것은 페이지 로드 시점의 autoFocus 다.
                      // eslint-disable-next-line jsx-a11y/no-autofocus
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
