import { create } from "zustand";

export type RenderingMethod = "ssg" | "ssr" | "isr";

export interface RenderingMetrics {
  /** ms - SSG·ISR은 시뮬레이션 값, SSR은 0 */
  buildTime: number;
  /** ms - 컴포넌트 마운트 ~ 데이터 표시까지 실측 */
  initialResponse: number;
  measuredAt: string;
}

interface RenderingStore {
  metrics: Partial<Record<RenderingMethod, RenderingMetrics>>;
  saveMetrics: (method: RenderingMethod, m: RenderingMetrics) => void;
}

export const useRenderingStore = create<RenderingStore>((set) => ({
  metrics: {},
  saveMetrics: (method, m) =>
    set((state) => ({ metrics: { ...state.metrics, [method]: m } })),
}));
