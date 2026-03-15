// 모듈 레벨 싱글턴 - 컴포넌트 마운트/언마운트와 무관하게 Worker가 유지됩니다.
// WASM은 최초 로드 후 페이지 이탈/재방문 시에도 재초기화되지 않습니다.

let _jsWorker: Worker | null = null;
let _wasmWorker: Worker | null = null;
let _wasmReady = false;
const _readyCallbacks: Array<() => void> = [];

function getJsWorker(): Worker {
  if (!_jsWorker) {
    _jsWorker = new Worker(new URL("./jsFilterWorker.ts", import.meta.url), {
      type: "module",
    });
  }
  return _jsWorker;
}

function getWasmWorker(): Worker {
  if (!_wasmWorker) {
    _wasmWorker = new Worker(
      new URL("./wasmFilterWorker.ts", import.meta.url),
      { type: "module" },
    );
    const onReady = (e: MessageEvent<{ type: string }>) => {
      if (e.data.type === "ready") {
        _wasmReady = true;
        _wasmWorker!.removeEventListener("message", onReady);
        _readyCallbacks.forEach((cb) => cb());
        _readyCallbacks.length = 0;
      }
    };
    _wasmWorker.addEventListener("message", onReady);
  }
  return _wasmWorker;
}

export function isWasmReady(): boolean {
  return _wasmReady;
}

/** WASM가 이미 ready면 즉시 콜백, 아직이면 ready 시 콜백 */
export function onWasmReady(cb: () => void): void {
  if (_wasmReady) {
    cb();
  } else {
    _readyCallbacks.push(cb);
    // 아직 Worker가 생성되지 않았으면 지금 생성해서 초기화 시작
    getWasmWorker();
  }
}

export { getJsWorker, getWasmWorker };
