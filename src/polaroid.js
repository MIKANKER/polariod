/**
 * @typedef {"cover"|"contain"} PhotoFit
 *
 * @typedef {{
 *  width?: number,
 *  height?: number,
 * }} Size
 *
 * @typedef {{
 *  blur?: number,
 *  color?: string,
 *  offsetX?: number,
 *  offsetY?: number,
 * }} ShadowOptions
 *
 * @typedef {{
 *  text?: string,
 *  font?: string,
 *  color?: string,
 *  align?: CanvasTextAlign,
 *  paddingX?: number,
 *  paddingTop?: number,
 * }} CaptionOptions
 *
 * @typedef {{
 *  // Tamaño del área de foto (sin marco)
 *  photoWidth?: number,
 *  photoHeight?: number,
 *  // Alternativa: relación ancho/alto de la foto (p.ej. 1 para cuadrado)
 *  photoAspect?: number,
 *
 *  // Marco
 *  padding?: number,
 *  paddingTop?: number,
 *  paddingX?: number,
 *  paddingBottom?: number,
 *  frameColor?: string,
 *  backgroundColor?: string,
 *  radius?: number,
 *  shadow?: ShadowOptions | false,
 *
 *  // Cómo encajar la foto en el área
 *  fit?: PhotoFit,
 *  offsetX?: number, // -1..1 (solo cover)
 *  offsetY?: number, // -1..1 (solo cover)
 *
 *  // Texto en el borde inferior
 *  caption?: CaptionOptions | string | false,
 *
 *  // Render
 *  pixelRatio?: number,
 *  smoothing?: boolean,
 * }} PolaroidOptions
 */

/**
 * @param {CanvasImageSource} source
 * @returns {Size}
 */
function getSourceSize(source) {
  // HTMLImageElement
  if ("naturalWidth" in source && "naturalHeight" in source) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  // HTMLVideoElement
  if ("videoWidth" in source && "videoHeight" in source) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  // ImageBitmap / Canvas
  if ("width" in source && "height" in source) {
    return { width: source.width, height: source.height };
  }
  return { width: 0, height: 0 };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  if (radius === 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Texto simple con wrapping por ancho máximo.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} maxWidth
 * @param {number} lineHeight
 * @param {number} maxLines
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  const finalLines = lines.slice(0, maxLines);
  const needsEllipsis = lines.length > maxLines;
  if (needsEllipsis && finalLines.length) {
    const last = finalLines[finalLines.length - 1];
    finalLines[finalLines.length - 1] = ellipsize(ctx, last, maxWidth);
  }

  for (let i = 0; i < finalLines.length; i++) {
    ctx.fillText(finalLines[i], x, y + i * lineHeight);
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function ellipsize(ctx, text, maxWidth) {
  const ellipsis = "…";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = text.slice(0, mid) + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid + 1;
    else hi = mid;
  }
  return text.slice(0, Math.max(0, lo - 1)) + ellipsis;
}

/**
 * Convierte una imagen a estilo Polaroid.
 *
 * @param {CanvasImageSource} source
 * @param {PolaroidOptions} [options]
 * @returns {HTMLCanvasElement}
 */
export function renderPolaroid(source, options = {}) {
  const sourceSize = getSourceSize(source);
  if (!sourceSize.width || !sourceSize.height) {
    throw new Error("renderPolaroid: no se pudo detectar el tamaño de la imagen fuente.");
  }

  const fit = options.fit ?? "cover";
  const padding = options.padding ?? 36;
  const paddingTop = options.paddingTop ?? padding;
  const paddingX = options.paddingX ?? padding;
  const paddingBottom = options.paddingBottom ?? Math.round(padding * 2.8);
  const frameColor = options.frameColor ?? "#ffffff";
  const backgroundColor = options.backgroundColor ?? "transparent";
  const radius = options.radius ?? 18;
  const pixelRatio =
    options.pixelRatio ?? (typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
  const smoothing = options.smoothing ?? true;

  const caption =
    options.caption === false
      ? null
      : typeof options.caption === "string"
        ? { text: options.caption }
        : options.caption ?? null;
  const captionText = (caption?.text ?? "").trim();

  const defaultPhotoWidth = sourceSize.width > 2000 ? 1200 : sourceSize.width;
  const photoWidth = Math.max(1, Math.round(options.photoWidth ?? defaultPhotoWidth));
  const photoHeight = Math.max(
    1,
    Math.round(
      options.photoHeight ??
        (options.photoAspect
          ? photoWidth / options.photoAspect
          : (photoWidth * sourceSize.height) / sourceSize.width),
    ),
  );

  const outW = Math.round(photoWidth + paddingX * 2);
  const outH = Math.round(photoHeight + paddingTop + paddingBottom);

  /** @type {HTMLCanvasElement} */
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outW * pixelRatio));
  canvas.height = Math.max(1, Math.round(outH * pixelRatio));
  canvas.style.width = `${outW}px`;
  canvas.style.height = `${outH}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("renderPolaroid: no se pudo obtener contexto 2D.");

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = "high";

  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, outW, outH);
  } else {
    ctx.clearRect(0, 0, outW, outH);
  }

  const shadow =
    options.shadow === false
      ? null
      : {
          color: options.shadow?.color ?? "rgba(0,0,0,0.25)",
          blur: options.shadow?.blur ?? 22,
          offsetX: options.shadow?.offsetX ?? 0,
          offsetY: options.shadow?.offsetY ?? 10,
        };

  // Marco con sombra
  ctx.save();
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
  }
  ctx.fillStyle = frameColor;
  roundedRectPath(ctx, 0, 0, outW, outH, radius);
  ctx.fill();
  ctx.restore();

  // Foto
  const photoX = paddingX;
  const photoY = paddingTop;
  const innerRadius = Math.max(0, radius - 8);

  ctx.save();
  roundedRectPath(ctx, photoX, photoY, photoWidth, photoHeight, innerRadius);
  ctx.clip();

  if (fit === "contain") {
    const scale = Math.min(photoWidth / sourceSize.width, photoHeight / sourceSize.height);
    const drawW = sourceSize.width * scale;
    const drawH = sourceSize.height * scale;
    const dx = photoX + (photoWidth - drawW) / 2;
    const dy = photoY + (photoHeight - drawH) / 2;
    ctx.drawImage(source, dx, dy, drawW, drawH);
  } else {
    const targetRatio = photoWidth / photoHeight;
    const sourceRatio = sourceSize.width / sourceSize.height;
    let cropW = sourceSize.width;
    let cropH = sourceSize.height;
    if (sourceRatio > targetRatio) {
      cropW = sourceSize.height * targetRatio;
    } else {
      cropH = sourceSize.width / targetRatio;
    }

    const offsetX = clamp(options.offsetX ?? 0, -1, 1);
    const offsetY = clamp(options.offsetY ?? 0, -1, 1);

    const cx = sourceSize.width / 2 + (sourceSize.width - cropW) * 0.5 * offsetX;
    const cy = sourceSize.height / 2 + (sourceSize.height - cropH) * 0.5 * offsetY;

    const sx = clamp(cx - cropW / 2, 0, sourceSize.width - cropW);
    const sy = clamp(cy - cropH / 2, 0, sourceSize.height - cropH);

    ctx.drawImage(source, sx, sy, cropW, cropH, photoX, photoY, photoWidth, photoHeight);
  }

  ctx.restore();

  // Caption
  if (captionText) {
    const captionFont =
      caption?.font ??
      '600 28px ui-rounded, system-ui, -apple-system, "Segoe UI", Roboto, Arial';
    const captionColor = caption?.color ?? "rgba(0,0,0,0.82)";
    const captionAlign = caption?.align ?? "center";
    const captionPaddingX = caption?.paddingX ?? paddingX;
    const captionPaddingTop = caption?.paddingTop ?? Math.round(padding * 0.5);

    const captionY = photoY + photoHeight + captionPaddingTop + 30;

    ctx.save();
    ctx.fillStyle = captionColor;
    ctx.font = captionFont;
    ctx.textAlign = captionAlign;
    ctx.textBaseline = "alphabetic";

    const left = captionPaddingX;
    const right = outW - captionPaddingX;
    const x =
      captionAlign === "left" ? left : captionAlign === "right" ? right : (left + right) / 2;

    drawWrappedText(ctx, captionText, x, captionY, right - left, 34, 2);
    ctx.restore();
  }

  return canvas;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} [type]
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export function polaroidToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("polaroidToBlob: toBlob devolvió null."))),
      type,
      quality,
    );
  });
}