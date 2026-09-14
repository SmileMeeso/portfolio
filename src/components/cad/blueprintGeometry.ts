import type { CadPart } from "./types";
import { partColorCSS } from "./cadUtils";

// 설계도(Blueprint) 탭의 순수 로직 — 파트를 정투상 도형으로 환산하고
// Canvas 2D 에 그린다. JSX 가 없어 컴포넌트와 분리해 둔다.

export type ViewDir = "front" | "side" | "top" | "bottom";
export const VIEW_LABELS: Record<ViewDir, string> = {
  front: "앞면",
  side: "옆면",
  top: "윗면",
  bottom: "밑면",
};
export const VIEWS: ViewDir[] = ["front", "side", "top", "bottom"];

interface BpShape {
  kind: "circle" | "polygon";
  isHole: boolean;
  cx: number;
  cy: number;
  r: number; // circle (sketch coords; cy → world Z)
  pts: { x: number; y: number }[]; // polygon (sketch coords; pt.y → world Z)
}

export interface BpPart {
  partId: string;
  name: string;
  pos: [number, number, number];
  height: number;
  shapes: BpShape[];
}

export function buildBpPart(
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

export function drawBpView(
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
