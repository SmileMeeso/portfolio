import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useCadStore } from "./cadStore";
import { VIEWS, VIEW_LABELS, buildBpPart, drawBpView } from "./blueprintGeometry";
import type { BpPart, ViewDir } from "./blueprintGeometry";

// ── Blueprint Tab ─────────────────────────────────────────────────────────────

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

export default function BlueprintView({ isDark }: { isDark: boolean }) {
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
