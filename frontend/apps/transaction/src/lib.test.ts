import { describe, expect, it } from 'vitest'
import { balanceLogType, transactionType } from './lib'

describe('serialized accounting enum labels', () => {
  it.each(['商城订单', '记账登记', '服务包收款', '权益核销', '履约加价收款', '履约加价业绩', '未使用权益结单'])('preserves the real backend transaction label %s', value => expect(transactionType(value)).toBe(value))
  it.each(['充值', '消费', '退款', '调整'])('preserves balance log label %s', value => expect(balanceLogType(value)).toBe(value))
  it('accepts numeric legacy fixtures and identifies editable manual transactions', () => {
    expect(transactionType(2)).toBe('记账登记')
    expect(transactionType('记账登记')).toBe('记账登记')
    expect(balanceLogType(1)).toBe('充值')
    expect(transactionType(null)).toBe('其他流水')
    expect(balanceLogType(undefined)).toBe('变动')
  })
})
