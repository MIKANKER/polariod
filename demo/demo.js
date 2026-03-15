import { renderPolaroid, polaroidToBlob } from "../src/polaroid.js";

/** @type {HTMLImageElement} */
const img = new Image();
img.crossOrigin = "anonymous";

const el = {
  file: document.querySelector("#file"),
  aspect: document.querySelector("#aspect"),
  padding: document.querySelector("#padding"),
  bottom: document.querySelector("#bottom"),
  radius: document.querySelector("#radius"),
  frame: document.querySelector("#frame"),
  fit: document.querySelector("#fit"),
  ox: document.querySelector("#ox"),
  oy: document.querySelector("#oy"),
  caption: document.querySelector("#caption"),
  out: document.querySelector("#out"),
  downloadPng: document.querySelector("#downloadPng"),
  downloadJpg: document.querySelector("#downloadJpg"),
};

let lastCanvas = null;

function opts() {
  return {
    photoAspect: Number(el.aspect.value),
    padding: Number(el.padding.value),
    paddingBottom: Number(el.bottom.value),
    radius: Number(el.radius.value),
    frameColor: el.frame.value,
    fit: el.fit.value,
    offsetX: Number(el.ox.value),
    offsetY: Number(el.oy.value),
    caption: { text: el.caption.value },
    backgroundColor: "transparent",
    shadow: { blur: 24, offsetY: 12, color: "rgba(0,0,0,0.28)" },
  };
}

function render() {
  if (!img.complete || !img.naturalWidth) return;
  const canvas = renderPolaroid(img, opts());
  lastCanvas = canvas;
  el.out.replaceChildren(canvas);
}

function setImageFromFile(file) {
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    render();
  };
  img.src = url;
}

el.file.addEventListener("change", () => {
  const f = el.file.files?.[0];
  if (f) setImageFromFile(f);
});

for (const input of [
  el.aspect,
  el.padding,
  el.bottom,
  el.radius,
  el.frame,
  el.fit,
  el.ox,
  el.oy,
  el.caption,
]) {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
}

async function download(type) {
  if (!lastCanvas) return;
  const blob = await polaroidToBlob(lastCanvas, type, type === "image/jpeg" ? 0.92 : undefined);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = type === "image/jpeg" ? "polaroid.jpg" : "polaroid.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

el.downloadPng.addEventListener("click", () => download("image/png"));
el.downloadJpg.addEventListener("click", () => download("image/jpeg"));

// Paste image from clipboard (Chrome/Edge)
document.addEventListener("paste", async (e) => {
  const items = e.clipboardData?.items ?? [];
  const imgItem = Array.from(items).find((it) => it.type.startsWith("image/"));
  if (!imgItem) return;
  const file = imgItem.getAsFile();
  if (file) setImageFromFile(file);
});