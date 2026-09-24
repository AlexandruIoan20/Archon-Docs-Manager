const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `#RRGGBB` (or `#RGB`) with an alpha, as `rgba(r, g, b, a)`. Invalid input throws. */
export function hexToRgba(hex: string, alpha: number): string {
  const match = HEX.exec(hex.trim())
  if (!match?.[1]) throw new Error(`Not a hex color: ${hex}`)
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1]
  const value = Number.parseInt(digits, 16)
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${a})`
}
