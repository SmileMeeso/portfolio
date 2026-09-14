import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { TUTORIAL_STEPS } from "./tutorialSteps";

const PAD = 10;
const TEXT_GAP = 18; // gap between spotlight edge and tooltip text

export default function TutorialOverlay({
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
  }, [step, cfg, stepPad]);

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
