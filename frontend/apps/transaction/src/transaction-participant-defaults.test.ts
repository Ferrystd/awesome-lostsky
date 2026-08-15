import { describe, expect, it } from 'vitest'
import { transactionParticipantDefaults } from './lib'

describe('transactionParticipantDefaults', () => {
  it('uses the current Entity as sender without a customer', () => {
    expect(transactionParticipantDefaults(null, 11)).toEqual({ senderEntityId: 11, csEntityId: null })
  })

  it('uses the customer assignee as sender and current Entity as customer service', () => {
    expect(transactionParticipantDefaults({ assignee_entity_id: 22 }, 11)).toEqual({ senderEntityId: 22, csEntityId: 11 })
  })

  it('uses the current Entity as sender for an unassigned customer', () => {
    expect(transactionParticipantDefaults({ assignee_entity_id: null }, 11)).toEqual({ senderEntityId: 11, csEntityId: null })
  })

  it('allows the same Entity to fill multiple participant roles', () => {
    expect(transactionParticipantDefaults({ assignee_entity_id: 11 }, 11)).toEqual({ senderEntityId: 11, csEntityId: 11 })
  })
})
