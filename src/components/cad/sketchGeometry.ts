import type { Sketch, SketchLine, ClosedLoop } from "./types";

// ── Closed loop detection ─────────────────────────────────────────────────────
export function findClosedLoops(lines: SketchLine[]): ClosedLoop[] {
  const adj = new Map<string, Set<string>>();
  for (const l of lines) {
    if (!adj.has(l.p1)) adj.set(l.p1, new Set());
    if (!adj.has(l.p2)) adj.set(l.p2, new Set());
    adj.get(l.p1)!.add(l.p2);
    adj.get(l.p2)!.add(l.p1);
  }

  const allLoops: ClosedLoop[] = [];
  const seenKeys = new Set<string>();

  function dfs(start: string, cur: string, path: string[], parent: string | null) {
    for (const nb of adj.get(cur) ?? []) {
      if (nb === parent) continue;
      if (nb === start && path.length >= 3) {
        const key = [...path].sort().join(',');
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allLoops.push([...path]);
        }
      } else if (!path.includes(nb)) {
        path.push(nb);
        dfs(start, nb, path, cur);
        path.pop();
      }
    }
  }

  for (const pid of adj.keys()) {
    dfs(pid, pid, [pid], null);
  }
  return allLoops;
}

export function hasExtrudable(sketch: Sketch | null): boolean {
  if (!sketch) return false;
  if (sketch.circles.filter((c) => !c.isHole).length > 0) return true;
  const holeSigs = new Set(sketch.holeLoopSigs ?? []);
  return findClosedLoops(sketch.lines).some((l) => !holeSigs.has(loopSig(l)));
}

// ── Loop signature (sorted point IDs) ────────────────────────────────────────
export const loopSig = (loop: ClosedLoop): string => [...loop].sort().join(',');
