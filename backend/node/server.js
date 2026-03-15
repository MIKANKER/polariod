import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import multer from "multer";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const TEMPLATES_DIR = path.resolve(__dirname, "..", "..", "assets", "templates");

function templatePath(name) {
  const safe = String(name || "sprite")
    .replaceAll("..", "")
    .replaceAll("\\\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.png$/i, "");
  return path.resolve(TEMPLATES_DIR, `${safe}.png`);
}

function isInsideDir(filePath, dirPath) {
  const rel = path.relative(dirPath, filePath);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectFromOptions(templateWidth, templateHeight, options) {
  if (options?.photoRectPx && typeof options.photoRectPx === "object") {
    const { x, y, w, h } = options.photoRectPx;
    return { x: Math.trunc(x), y: Math.trunc(y), w: Math.trunc(w), h: Math.trunc(h) };
  }

  if (options?.photoRectNorm && typeof options.photoRectNorm === "object") {
    const { x, y, w, h } = options.photoRectNorm;
    return {
      x: Math.round(Number(x) * templateWidth),
      y: Math.round(Number(y) * templateHeight),
      w: Math.round(Number(w) * templateWidth),
      h: Math.round(Number(h) * templateHeight),
    };
  }

  return {
    x: Math.round(0.39 * templateWidth),
    y: Math.round(0.48 * templateHeight),
    w: Math.round(0.22 * templateWidth),
    h: Math.round(0.22 * templateHeight),
  };
}

async function fitToRectBuffer(photoBuffer, rect, options) {
  const fit = options?.fit === "contain" ? "contain" : "cover";
  const ox = clamp(Number(options?.offsetX ?? 0), -1, 1);
  const oy = clamp(Number(options?.offsetY ?? 0), -1, 1);

  if (fit === "contain") {
    return sharp(photoBuffer)
      .resize({
        width: rect.w,
        height: rect.h,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  const meta = await sharp(photoBuffer).metadata();
  const pw = meta.width || 1;
  const ph = meta.height || 1;

  const scale = Math.max(rect.w / pw, rect.h / ph);
  const rw = Math.max(1, Math.round(pw * scale));
  const rh = Math.max(1, Math.round(ph * scale));

  const maxLeft = Math.max(0, rw - rect.w);
  const maxTop = Math.max(0, rh - rect.h);

  const left = Math.round((ox + 1) * 0.5 * maxLeft);
  const top = Math.round((oy + 1) * 0.5 * maxTop);

  return sharp(photoBuffer)
    .resize({ width: rw, height: rh, fit: "fill" })
    .extract({ left, top, width: rect.w, height: rect.h })
    .png()
    .toBuffer();
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post(
  "/api/render",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "template", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      const imageFile = Array.isArray(files.image) ? files.image[0] : null;
      const templateFile = Array.isArray(files.template) ? files.template[0] : null;

      if (!imageFile?.buffer) return res.status(400).json({ error: "Falta 'image'" });

      let options = {};
      if (req.body?.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (e) {
          return res.status(400).json({ error: `options JSON inválido: ${String(e?.message || e)}` });
        }
      }

      let templateSharp;
      if (templateFile?.buffer) {
        templateSharp = sharp(templateFile.buffer);
      } else {
        const templateName = String(options.template || "sprite");
        const templateDisk = templatePath(templateName);
        if (!isInsideDir(templateDisk, TEMPLATES_DIR)) {
          return res.status(400).json({ error: "template inválido" });
        }
        if (!fs.existsSync(templateDisk)) {
          return res.status(404).json({
            error:
              `template '${templateName}' no existe. Súbelo como campo 'template' (multipart) ` +
              `o colócalo como PNG en ${TEMPLATES_DIR} (ej: ${templateName}.png).`,
          });
        }
        templateSharp = sharp(templateDisk);
      }

      const tmeta = await templateSharp.metadata();
      const tw = tmeta.width || 1;
      const th = tmeta.height || 1;

      const rect = rectFromOptions(tw, th, options);
      if (!rect.w || !rect.h) return res.status(400).json({ error: "Rect inválido" });

      const fitted = await fitToRectBuffer(imageFile.buffer, rect, options);

      const base = sharp({
        create: {
          width: tw,
          height: th,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

      const templatePng = await templateSharp.png().toBuffer();
      const composedPng = await base
        .composite([
          { input: fitted, left: rect.x, top: rect.y },
          { input: templatePng, left: 0, top: 0 },
        ])
        .png()
        .toBuffer();

      const format = String(options.format || "png").toLowerCase();
      if (format === "jpeg" || format === "jpg") {
        const quality = Math.max(1, Math.min(95, Number(options.quality ?? 92)));
        const bg = String(options.jpegBackground || "#ffffff");
        const jpeg = await sharp(composedPng).flatten({ background: bg }).jpeg({ quality }).toBuffer();
        res.setHeader("Content-Type", "image/jpeg");
        return res.send(jpeg);
      }

      res.setHeader("Content-Type", "image/png");
      return res.send(composedPng);
    } catch (e) {
      return res.status(400).json({ error: String(e?.message || e) });
    }
  },
);

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`Polaroid Template API listening on http://localhost:${port}`);
});