import { describe, expect, it } from 'vitest'
import { isValidQuantityStep, quantityScaleForStep } from './quantity'

describe('quantityScaleForStep', () => {
  it.each([
    ['1', 0],
    ['0.5000', 1],
    ['0.2500', 2],
    ['0.0001', 4],
  ])('derives the visible scale for %s', (step, expected) => {
    expect(quantityScaleForStep(step)).toBe(expected)
  })

  it('accepts positive steps up to four decimal places', () => {
    expect(isValidQuantityStep(1)).toBe(true)
    expect(isValidQuantityStep(1.01)).toBe(true)
    expect(isValidQuantityStep(0.0001)).toBe(true)
    expect(isValidQuantityStep(0)).toBe(false)
    expect(isValidQuantityStep(-0.5)).toBe(false)
    expect(isValidQuantityStep(0.00001)).toBe(false)
  })
})
