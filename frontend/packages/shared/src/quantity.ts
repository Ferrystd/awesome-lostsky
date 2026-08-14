export function quantityScaleForStep(step: string | number | null | undefined): number {
  const match = String(step ?? '').trim().match(/^\d+(?:\.(\d{1,4}))?$/)
  return (match?.[1] ?? '').replace(/0+$/, '').length
}

export function isValidQuantityStep(step: number): boolean {
  return Number.isFinite(step)
    && step > 0
    && /^\d+(?:\.\d{1,4})?$/.test(String(step))
}
