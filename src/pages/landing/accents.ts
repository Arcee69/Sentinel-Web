/** The five accent hues the landing page cycles through across card grids. */
export const ACCENTS = [
  "var(--l-ember)",
  "var(--l-teal)",
  "var(--l-iris)",
  "var(--l-amber)",
  "var(--l-positive)",
] as const;

export function accentAt(index: number): string {
  return ACCENTS[index % ACCENTS.length];
}
