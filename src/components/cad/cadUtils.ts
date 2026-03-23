// ── Shared CAD utilities (no React / Three.js deps) ──────────────────────────

const PALETTE = [
  0x4a90d9, 0x50c878, 0xe87070, 0xf0a030, 0xa855f7, 0x06b6d4, 0xf43f5e,
  0x84cc16,
];
const colorCache = new Map<string, number>();
let colorIdx = 0;

export function partColor(partId: string): number {
  if (!colorCache.has(partId)) {
    colorCache.set(partId, PALETTE[colorIdx++ % PALETTE.length]);
  }
  return colorCache.get(partId)!;
}

export function partColorCSS(partId: string): string {
  return '#' + partColor(partId).toString(16).padStart(6, '0');
}
