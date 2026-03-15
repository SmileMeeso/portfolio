import type { InitOutput } from "../../wasm/image-filter/image_filter";

type FilterName =
  | "grayscale"
  | "invert"
  | "sepia"
  | "brightness"
  | "blur"
  | "pixelate"
  | "unsharpMask"
  | "edgeDetect";

let mod: typeof import("../../wasm/image-filter/image_filter.js") | null = null;
let inst: InitOutput | null = null;

// 워커 생성 즉시 WASM 초기화 + 워밍업 ➞ 완료되면 'ready' 신호 전송
(async () => {
  mod = await import("../../wasm/image-filter/image_filter.js");
  inst = await mod.default();
  mod.warmup();
  self.postMessage({ type: "ready" });
})();

self.onmessage = (
  e: MessageEvent<{
    filter: FilterName;
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
  }>,
) => {
  if (!mod || !inst) return;
  const { filter, pixels, width, height } = e.data;
  const len = pixels.byteLength;

  const ptr = mod.get_buffer_ptr(len);
  new Uint8Array(inst.memory.buffer, ptr, len).set(
    new Uint8Array(pixels.buffer, pixels.byteOffset, len),
  );

  const start = performance.now();
  switch (filter) {
    case "grayscale":
      mod.grayscale_inplace(ptr, len);
      break;
    case "invert":
      mod.invert_inplace(ptr, len);
      break;
    case "sepia":
      mod.sepia_inplace(ptr, len);
      break;
    case "brightness":
      mod.brightness_inplace(ptr, len, 50);
      break;
    case "blur":
      mod.blur_inplace(ptr, width, height);
      break;
    case "pixelate":
      mod.pixelate_inplace(ptr, width, height, 10);
      break;
    case "unsharpMask":
      mod.unsharp_mask_inplace(ptr, width, height, 150);
      break;
    case "edgeDetect":
      mod.edge_detect_inplace(ptr, width, height);
      break;
  }
  const ms = performance.now() - start;

  const result = new Uint8Array(inst.memory.buffer, ptr, len).slice();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).postMessage({ type: "result", filtered: result, ms }, [
    result.buffer,
  ]);
};
