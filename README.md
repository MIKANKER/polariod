# Polaroid Frame (Web)

Función ligera (sin dependencias) para convertir una foto en una imagen estilo Polaroid usando Canvas 2D, con marcos personalizables.

## Uso rápido

Abrir `demo/index.html` en un navegador moderno y cargar una imagen.

## Uso en código

```js
import { renderPolaroid, polaroidToBlob, polaroidOptions } from "./src/index.js";

const img = document.querySelector("img");

const canvas = renderPolaroid(
  img,
  polaroidOptions("classic", {
    photoAspect: 1,
    caption: { text: "Bogotá • 2026-03-11" },
  }),
);

document.body.appendChild(canvas);

const blob = await polaroidToBlob(canvas, "image/jpeg", 0.92);
```

## API

- `renderPolaroid(source, options)` → `HTMLCanvasElement`
- `polaroidToBlob(canvas, type?, quality?)` → `Promise<Blob>`
- `POLAROID_PRESETS` y `polaroidOptions(preset, overrides)`

## Backend API (Node/Python)

Para usar plantillas (ej: tu marco “Sprite”) desde la app, usa uno de los backends:

- Node: `backend/node` (Express + sharp)
- Python: `backend/python` (FastAPI + Pillow)

Ambos exponen `POST /api/render` (multipart):

- `image` (obligatorio)
- `template` (opcional): si lo envías como archivo, no necesitas guardarlo en el servidor
- `options` (opcional): JSON string

## Plantillas

Si NO envías `template` en el request, coloca la plantilla PNG en `assets/templates`.

- Ejemplo: `assets/templates/sprite.png`
- Ajusta el “hueco” de la foto enviando `photoRectNorm` o `photoRectPx`.