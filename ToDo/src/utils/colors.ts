/** `#rrggbb` + alpha (0..1) -> `#rrggbbaa`. Used to tint a user-chosen category colour. */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  return `${hex}${Math.round(clamped * 255).toString(16).padStart(2, '0')}`;
}
