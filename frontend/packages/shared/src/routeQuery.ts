import type { LocationQueryValue } from 'vue-router'

/** Repeated and valueless parameters are not valid scalar input. */
export function queryText(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function queryPositiveInteger(value: LocationQueryValue | LocationQueryValue[] | undefined): number | undefined {
  const text = queryText(value)
  if (!text || !/^[1-9]\d*$/.test(text)) return undefined
  const number = Number(text)
  return Number.isSafeInteger(number) ? number : undefined
}
