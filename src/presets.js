/**
 * Presets listos para usar (se pueden sobreescribir con tus opciones).
 */
export const POLAROID_PRESETS = {
  classic: {
    padding: 36,
    paddingBottom: 105,
    paddingTop: 36,
    paddingX: 36,
    radius: 18,
    frameColor: "#ffffff",
    backgroundColor: "transparent",
    fit: "cover",
    offsetX: 0,
    offsetY: 0,
    shadow: { blur: 24, offsetY: 12, offsetX: 0, color: "rgba(0,0,0,0.28)" },
    caption: {
      font: '600 28px ui-rounded, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
      color: "rgba(0,0,0,0.82)",
      align: "center",
    },
  },
  clean: {
    padding: 28,
    paddingBottom: 88,
    radius: 14,
    frameColor: "#ffffff",
    shadow: false,
    fit: "cover",
  },
  darkFrame: {
    padding: 34,
    paddingBottom: 108,
    radius: 18,
    frameColor: "#121418",
    shadow: { blur: 26, offsetY: 14, offsetX: 0, color: "rgba(0,0,0,0.55)" },
    caption: {
      font: '650 28px ui-rounded, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
      color: "rgba(255,255,255,0.88)",
      align: "center",
    },
  },
};

/**
 * @param {keyof typeof POLAROID_PRESETS | null | undefined} preset
 * @param {object} [overrides]
 */
export function polaroidOptions(preset, overrides = {}) {
  const base = preset ? POLAROID_PRESETS[preset] : null;
  return base ? { ...base, ...overrides } : { ...overrides };
}