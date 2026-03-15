/* @ts-self-types="./image_filter.d.ts" */

/**
 * 분리형 슬라이딩 윈도우 박스 블러 (15×15)
 *
 * 수평 패스 ➞ temp, 수직 패스 ➞ data
 * 복잡도: O(2 × W × H)  (커널 크기 무관)
 * @param {number} ptr
 * @param {number} width
 * @param {number} height
 */
export function blur_inplace(ptr, width, height) {
  wasm.blur_inplace(ptr, width, height);
}

/**
 * 밝기 조절
 * @param {number} ptr
 * @param {number} len
 * @param {number} amount
 */
export function brightness_inplace(ptr, len, amount) {
  wasm.brightness_inplace(ptr, len, amount);
}

/**
 * 엣지 감지 (Sobel)
 *
 * 최적화:
 * 1) GRAY_BUFFER 정적 사전 할당 ➞ 함수 호출 시 heap alloc 없음
 * 2) `out` 임시 버퍼 제거 ➞ Sobel 결과를 data 에 직접 기록 (gray[] 를 읽기 때문에 안전)
 * 3) 총 2패스(그레이스케일 변환 + Sobel+기록)로 완료
 * 복잡도: O(2 × W × H)
 * @param {number} ptr
 * @param {number} width
 * @param {number} height
 */
export function edge_detect_inplace(ptr, width, height) {
  wasm.edge_detect_inplace(ptr, width, height);
}

/**
 * @param {number} size
 * @returns {number}
 */
export function get_buffer_ptr(size) {
  const ret = wasm.get_buffer_ptr(size);
  return ret >>> 0;
}

/**
 * 그레이스케일 (정수 연산)
 * @param {number} ptr
 * @param {number} len
 */
export function grayscale_inplace(ptr, len) {
  wasm.grayscale_inplace(ptr, len);
}

/**
 * 색상 반전
 * @param {number} ptr
 * @param {number} len
 */
export function invert_inplace(ptr, len) {
  wasm.invert_inplace(ptr, len);
}

/**
 * 픽셀화
 * @param {number} ptr
 * @param {number} width
 * @param {number} height
 * @param {number} block_size
 */
export function pixelate_inplace(ptr, width, height, block_size) {
  wasm.pixelate_inplace(ptr, width, height, block_size);
}

/**
 * 세피아 (정수 연산)
 * @param {number} ptr
 * @param {number} len
 */
export function sepia_inplace(ptr, len) {
  wasm.sepia_inplace(ptr, len);
}

/**
 * 언샤프 마스크 (슬라이딩 윈도우 블러 재사용)
 *
 * sharpened = clamp(original + amount × (original − blurred))
 * amount: 배율 × 100 (예: 150 ➞ 1.5배)
 * @param {number} ptr
 * @param {number} width
 * @param {number} height
 * @param {number} amount_x100
 */
export function unsharp_mask_inplace(ptr, width, height, amount_x100) {
  wasm.unsharp_mask_inplace(ptr, width, height, amount_x100);
}

/**
 * 워밍업: cold start 비용을 페이지 진입 시점으로 이동시키기 위해
 * 1) 48MB 버퍼를 미리 확보해 memory.grow 를 완료하고
 * 2) 더미 픽셀에 모든 필터를 한 번씩 실행해 JIT 를 워밍업한다.
 */
export function warmup() {
  wasm.warmup();
}

function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbindgen_init_externref_table: function () {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, undefined);
      table.set(offset + 0, undefined);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    },
  };
  return {
    __proto__: null,
    "./image_filter_bg.js": import0,
  };
}

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  wasmModule = module;
  wasm.__wbindgen_start();
  return wasm;
}

async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && expectedResponseType(module.type);

        if (
          validResponse &&
          module.headers.get("Content-Type") !== "application/wasm"
        ) {
          console.warn(
            "`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }

  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}

function initSync(module) {
  if (wasm !== undefined) return wasm;

  if (module !== undefined) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn(
        "using deprecated parameters for `initSync()`; pass a single object instead",
      );
    }
  }

  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm;

  if (module_or_path !== undefined) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn(
        "using deprecated parameters for the initialization function; pass a single object instead",
      );
    }
  }

  if (module_or_path === undefined) {
    module_or_path = new URL("image_filter_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();

  if (
    typeof module_or_path === "string" ||
    (typeof Request === "function" && module_or_path instanceof Request) ||
    (typeof URL === "function" && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path);
  }

  const { instance, module } = await __wbg_load(await module_or_path, imports);

  return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
