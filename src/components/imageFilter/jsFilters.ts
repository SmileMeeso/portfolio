export function grayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  for (let i = 0; i < result.length; i += 4) {
    const gray =
      0.299 * result[i] + 0.587 * result[i + 1] + 0.114 * result[i + 2];
    result[i] = gray;
    result[i + 1] = gray;
    result[i + 2] = gray;
  }
  return result;
}

export function invert(data: Uint8ClampedArray): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  for (let i = 0; i < result.length; i += 4) {
    result[i] = 255 - result[i];
    result[i + 1] = 255 - result[i + 1];
    result[i + 2] = 255 - result[i + 2];
  }
  return result;
}

export function sepia(data: Uint8ClampedArray): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  for (let i = 0; i < result.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    result[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    result[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    result[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  return result;
}

export function brightness(
  data: Uint8ClampedArray,
  amount: number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  for (let i = 0; i < result.length; i += 4) {
    result[i] = Math.min(255, Math.max(0, result[i] + amount));
    result[i + 1] = Math.min(255, Math.max(0, result[i + 1] + amount));
    result[i + 2] = Math.min(255, Math.max(0, result[i + 2] + amount));
  }
  return result;
}

export function blur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  const radius = 7;
  const size = (radius * 2 + 1) ** 2;
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        }
      }
      const idx = (y * width + x) * 4;
      result[idx] = r / size;
      result[idx + 1] = g / size;
      result[idx + 2] = b / size;
    }
  }
  return result;
}

// 언샤프 마스크 - naive 박스 블러(O(N×radius²)) 후 original과 차이로 강조
export function unsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const amount = 1.5;
  const radius = 4;
  const size = (radius * 2 + 1) ** 2;
  const blurred = new Uint8ClampedArray(data);
  // naive blur (radius=4, 9×9 kernel)
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
        }
      }
      const idx = (y * width + x) * 4;
      blurred[idx] = r / size;
      blurred[idx + 1] = g / size;
      blurred[idx + 2] = b / size;
    }
  }
  const result = new Uint8ClampedArray(data);
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.min(
      255,
      Math.max(0, data[i] + amount * (data[i] - blurred[i])),
    );
    result[i + 1] = Math.min(
      255,
      Math.max(0, data[i + 1] + amount * (data[i + 1] - blurred[i + 1])),
    );
    result[i + 2] = Math.min(
      255,
      Math.max(0, data[i + 2] + amount * (data[i + 2] - blurred[i + 2])),
    );
  }
  return result;
}

// 엣지 감지 - Sobel (naive O(N×9))
export function edgeDetect(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const gray = new Int32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    gray[i] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
  }
  const result = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const r0 = (y - 1) * width,
        r1 = y * width,
        r2 = (y + 1) * width;
      const gx =
        -gray[r0 + x - 1] +
        gray[r0 + x + 1] -
        2 * gray[r1 + x - 1] +
        2 * gray[r1 + x + 1] -
        gray[r2 + x - 1] +
        gray[r2 + x + 1];
      const gy =
        -gray[r0 + x - 1] -
        2 * gray[r0 + x] -
        gray[r0 + x + 1] +
        gray[r2 + x - 1] +
        2 * gray[r2 + x] +
        gray[r2 + x + 1];
      const mag = Math.min(255, Math.abs(gx) + Math.abs(gy));
      const idx = (y * width + x) * 4;
      result[idx] = result[idx + 1] = result[idx + 2] = mag;
    }
  }
  return result;
}

export function pixelate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  blockSize: number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const bx = Math.min(x + blockSize, width);
      const by = Math.min(y + blockSize, height);
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let py = y; py < by; py++) {
        for (let px = x; px < bx; px++) {
          const idx = (py * width + px) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      for (let py = y; py < by; py++) {
        for (let px = x; px < bx; px++) {
          const idx = (py * width + px) * 4;
          result[idx] = r / count;
          result[idx + 1] = g / count;
          result[idx + 2] = b / count;
        }
      }
    }
  }
  return result;
}
