/* Preprocessing that mirrors the Python training/eval code (bcd/common.py):
   RGB -> PIL-style antialiased bilinear resize to 224x224 -> /255 -> ImageNet normalise -> CHW.
   Pure functions: usable in the browser and in Node tests. */
(function (root) {
  const MEAN = [0.485, 0.456, 0.406];
  const STD = [0.229, 0.224, 0.225];

  // Triangle-filter coefficients identical in spirit to Pillow's BILINEAR resample.
  function coeffs(inSize, outSize) {
    const scale = inSize / outSize;
    const filterScale = Math.max(scale, 1);
    const support = 1 * filterScale;
    const out = [];
    for (let xx = 0; xx < outSize; xx++) {
      const center = (xx + 0.5) * scale;
      let xmin = Math.max(Math.floor(center - support + 0.5), 0);
      const xmax = Math.min(Math.floor(center + support + 0.5), inSize);
      const w = [];
      let sum = 0;
      for (let x = xmin; x < xmax; x++) {
        const t = (x - center + 0.5) / filterScale;
        const v = Math.max(0, 1 - Math.abs(t));
        w.push(v);
        sum += v;
      }
      for (let i = 0; i < w.length; i++) w[i] = sum ? w[i] / sum : 0;
      out.push({ start: xmin, w });
    }
    return out;
  }

  // rgba: Uint8ClampedArray (w*h*4). Returns Uint8 RGB array (outW*outH*3).
  function resizeRGB(rgba, w, h, outW, outH) {
    const cx = coeffs(w, outW);
    const cy = coeffs(h, outH);
    // horizontal pass (keeps height h), rounded to 8-bit like Pillow
    const tmp = new Uint8Array(outW * h * 3);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < outW; x++) {
        const { start, w: ws } = cx[x];
        let r = 0, g = 0, b = 0;
        for (let k = 0; k < ws.length; k++) {
          const i = (y * w + start + k) * 4;
          r += rgba[i] * ws[k]; g += rgba[i + 1] * ws[k]; b += rgba[i + 2] * ws[k];
        }
        const o = (y * outW + x) * 3;
        tmp[o] = Math.min(255, Math.max(0, Math.round(r)));
        tmp[o + 1] = Math.min(255, Math.max(0, Math.round(g)));
        tmp[o + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }
    const out = new Uint8Array(outW * outH * 3);
    for (let y = 0; y < outH; y++) {
      const { start, w: ws } = cy[y];
      for (let x = 0; x < outW; x++) {
        let r = 0, g = 0, b = 0;
        for (let k = 0; k < ws.length; k++) {
          const i = ((start + k) * outW + x) * 3;
          r += tmp[i] * ws[k]; g += tmp[i + 1] * ws[k]; b += tmp[i + 2] * ws[k];
        }
        const o = (y * outW + x) * 3;
        out[o] = Math.min(255, Math.max(0, Math.round(r)));
        out[o + 1] = Math.min(255, Math.max(0, Math.round(g)));
        out[o + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }
    return out;
  }

  // -> Float32Array [3*size*size] in CHW order
  function toTensorData(rgba, w, h, size, mean, std) {
    mean = mean || MEAN; std = std || STD;
    const rgb = resizeRGB(rgba, w, h, size, size);
    const plane = size * size;
    const data = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      for (let c = 0; c < 3; c++) {
        data[c * plane + i] = (rgb[i * 3 + c] / 255 - mean[c]) / std[c];
      }
    }
    return data;
  }

  const api = { resizeRGB, toTensorData, MEAN, STD };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ScreeningPreprocess = api;
})(typeof self !== "undefined" ? self : this);
