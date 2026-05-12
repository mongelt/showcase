/**
 * Stage 5 — Score Spectrum Utility
 * Converts a numeric score (0–1) to CSS color values for card backgrounds and text.
 *
 * Spectrum (spec §Colors):
 *   Score 0.00      → background #0f0e0e, title #b0b0b0
 *   Score 0.01–0.50 → Gradient A: background #0f0e0e → #2e2c2c, title always #b0b0b0
 *   Score 0.51–1.00 → Gradient B: background #9a9994 → #c7c7c2, title always #1a1a1a
 *   Score 1.00      → background #c7c7c2, title #1a1a1a
 */

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** Linearly interpolates between two hex colors by factor t ∈ [0, 1]. */
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

/** Converts a hex color + opacity to an rgba() string. */
function hexWithOpacity(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns background, title text, and description text colors for a card at the given score.
 * Apply as: `<div style={interpolateMenuScore(score)}>`
 *
 * descColor:
 *   score <= 0.50 (related/dark bg): '#989898' — lighter for legibility on dark
 *   score >  0.50 (focus/light bg):  '#303030' — darker for legibility on light
 */
export function interpolateMenuScore(score: number): { background: string; color: string; descColor: string } {
  if (score <= 0) return { background: '#0f0e0e', color: '#b0b0b0', descColor: '#989898' }
  if (score >= 1) return { background: '#c7c7c2', color: '#1a1a1a', descColor: '#303030' }

  if (score <= 0.50) {
    // Gradient A: #0f0e0e → #2e2c2c, title always #b0b0b0
    const t = score / 0.50
    return { background: lerpHex('#0f0e0e', '#2e2c2c', t), color: '#b0b0b0', descColor: '#989898' }
  } else {
    // Gradient B: #9a9994 → #c7c7c2, title always #1a1a1a
    const t = (score - 0.50) / 0.50
    return { background: lerpHex('#9a9994', '#c7c7c2', t), color: '#1a1a1a', descColor: '#303030' }
  }
}

/**
 * Returns a border color for a card at the given score.
 * Border = title color at 0.35 opacity.
 */
export function borderColorFromScore(score: number): string {
  const titleColor = score > 0.50 ? '#1a1a1a' : '#b0b0b0'
  return hexWithOpacity(titleColor, 0.35)
}
