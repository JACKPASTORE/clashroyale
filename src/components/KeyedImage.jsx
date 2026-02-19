import React, { useEffect, useMemo, useState } from 'react';

// Cache processed images (keyed by src+params)
const keyedCache = new Map();

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const isProbablySameOrigin = (src) => {
  if (!src) return false;
  if (src.startsWith('/')) return true;
  try {
    const u = new URL(src, window.location.href);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
};

const makeCacheKey = (src, opts) => {
  const { whiteThreshold, maxChannelDelta, maxSize } = opts;
  return `${src}::wt=${whiteThreshold}::d=${maxChannelDelta}::s=${maxSize}`;
};

const removeWhiteBgEdgeFloodFill = (imageData, w, h, whiteThreshold, maxChannelDelta) => {
  const data = imageData.data;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qh = 0, qt = 0;

  const idx = (x, y) => (y * w + x);
  const isNearWhite = (i) => {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2], a = data[o + 3];
    if (a === 0) return true; // already transparent counts as bg
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return mx >= whiteThreshold && (mx - mn) <= maxChannelDelta;
  };

  // Seed from borders
  const push = (x, y) => {
    const i = idx(x, y);
    if (visited[i]) return;
    if (!isNearWhite(i)) return;
    visited[i] = 1;
    queue[qt++] = i;
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  // BFS 4-neighborhood
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w;
    const y = (i / w) | 0;

    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // Apply alpha=0 for marked background pixels
  for (let i = 0; i < w * h; i++) {
    if (!visited[i]) continue;
    const o = i * 4;
    data[o + 3] = 0;
  }
};

const processImage = (src, opts) => {
  const {
    whiteThreshold = 245,
    maxChannelDelta = 18,
    maxSize = 256
  } = opts || {};

  return new Promise((resolve) => {
    if (!src) return resolve(src);

    // Canvas processing only works reliably for same-origin or CORS-enabled images
    if (!isProbablySameOrigin(src)) return resolve(src);

    const img = new Image();
    // same-origin is fine; keep anonymous for future-proofing
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(src);

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        removeWhiteBgEdgeFloodFill(imageData, w, h, whiteThreshold, maxChannelDelta);
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

/**
 * KeyedImage: supprime le fond blanc "connecté aux bords" et le rend transparent.
 * Conçu pour les sprites/cartes qui ont un fond blanc plein (ex: certains PNG).
 */
const KeyedImage = ({
  src,
  alt,
  className,
  style,
  whiteThreshold = 245,
  maxChannelDelta = 18,
  maxSize = 256,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  const cacheKey = useMemo(() => makeCacheKey(src, { whiteThreshold, maxChannelDelta, maxSize }), [src, whiteThreshold, maxChannelDelta, maxSize]);

  useEffect(() => {
    let cancelled = false;
    if (!src) return;

    const cached = keyedCache.get(cacheKey);
    if (cached) {
      Promise.resolve(cached).then((v) => {
        if (!cancelled) setResolvedSrc(v);
      });
      return () => { cancelled = true; };
    }

    const p = processImage(src, { whiteThreshold, maxChannelDelta, maxSize });
    keyedCache.set(cacheKey, p);
    p.then((v) => {
      if (!cancelled) setResolvedSrc(v);
    });

    return () => { cancelled = true; };
  }, [src, cacheKey, whiteThreshold, maxChannelDelta, maxSize]);

  return (
    <img
      src={resolvedSrc || src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
    />
  );
};

export default KeyedImage;

