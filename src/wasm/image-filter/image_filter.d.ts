/* tslint:disable */
/* eslint-disable */

/**
 * 분리형 슬라이딩 윈도우 박스 블러 (15×15)
 *
 * 수평 패스 ➞ temp, 수직 패스 ➞ data
 * 복잡도: O(2 × W × H)  (커널 크기 무관)
 */
export function blur_inplace(ptr: number, width: number, height: number): void;

/**
 * 밝기 조절
 */
export function brightness_inplace(
  ptr: number,
  len: number,
  amount: number,
): void;

/**
 * 엣지 감지 (Sobel)
 *
 * 최적화:
 * 1) GRAY_BUFFER 정적 사전 할당 ➞ 함수 호출 시 heap alloc 없음
 * 2) `out` 임시 버퍼 제거 ➞ Sobel 결과를 data 에 직접 기록 (gray[] 를 읽기 때문에 안전)
 * 3) 총 2패스(그레이스케일 변환 + Sobel+기록)로 완료
 * 복잡도: O(2 × W × H)
 */
export function edge_detect_inplace(
  ptr: number,
  width: number,
  height: number,
): void;

export function get_buffer_ptr(size: number): number;

/**
 * 그레이스케일 (정수 연산)
 */
export function grayscale_inplace(ptr: number, len: number): void;

/**
 * 색상 반전
 */
export function invert_inplace(ptr: number, len: number): void;

/**
 * 픽셀화
 */
export function pixelate_inplace(
  ptr: number,
  width: number,
  height: number,
  block_size: number,
): void;

/**
 * 세피아 (정수 연산)
 */
export function sepia_inplace(ptr: number, len: number): void;

/**
 * 언샤프 마스크 (슬라이딩 윈도우 블러 재사용)
 *
 * sharpened = clamp(original + amount × (original − blurred))
 * amount: 배율 × 100 (예: 150 ➞ 1.5배)
 */
export function unsharp_mask_inplace(
  ptr: number,
  width: number,
  height: number,
  amount_x100: number,
): void;

/**
 * 워밍업: cold start 비용을 페이지 진입 시점으로 이동시키기 위해
 * 1) 48MB 버퍼를 미리 확보해 memory.grow 를 완료하고
 * 2) 더미 픽셀에 모든 필터를 한 번씩 실행해 JIT 를 워밍업한다.
 */
export function warmup(): void;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly blur_inplace: (a: number, b: number, c: number) => void;
  readonly edge_detect_inplace: (a: number, b: number, c: number) => void;
  readonly pixelate_inplace: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly unsharp_mask_inplace: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly warmup: () => void;
  readonly sepia_inplace: (a: number, b: number) => void;
  readonly invert_inplace: (a: number, b: number) => void;
  readonly get_buffer_ptr: (a: number) => number;
  readonly grayscale_inplace: (a: number, b: number) => void;
  readonly brightness_inplace: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
