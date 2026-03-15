import * as jsFilters from "./jsFilters";

type FilterName =
  | "grayscale"
  | "invert"
  | "sepia"
  | "brightness"
  | "blur"
  | "pixelate"
  | "unsharpMask"
  | "edgeDetect";

self.onmessage = (
  e: MessageEvent<{
    filter: FilterName;
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
  }>,
) => {
  const { filter, pixels, width, height } = e.data;
  const start = performance.now();
  let filtered: Uint8ClampedArray;
  switch (filter) {
    case "grayscale":
      filtered = jsFilters.grayscale(pixels);
      break;
    case "invert":
      filtered = jsFilters.invert(pixels);
      break;
    case "sepia":
      filtered = jsFilters.sepia(pixels);
      break;
    case "brightness":
      filtered = jsFilters.brightness(pixels, 50);
      break;
    case "blur":
      filtered = jsFilters.blur(pixels, width, height);
      break;
    case "pixelate":
      filtered = jsFilters.pixelate(pixels, width, height, 10);
      break;
    case "unsharpMask":
      filtered = jsFilters.unsharpMask(pixels, width, height);
      break;
    case "edgeDetect":
      filtered = jsFilters.edgeDetect(pixels, width, height);
      break;
    default:
      filtered = new Uint8ClampedArray(pixels);
  }
  const ms = performance.now() - start;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).postMessage({ filtered, ms }, [filtered.buffer]);
};
