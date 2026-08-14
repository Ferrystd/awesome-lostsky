export type ServiceDistributionRates = {
  handler: number
  sender: number
  customerService: number
}

type Money = number | null

const numeric = (value: Money) => typeof value === 'number' && Number.isFinite(value) ? value : 0
const cents = (value: Money) => Math.round(numeric(value) * 100)

export function calculateDefaultServiceDistribution(
  totalPrice: Money,
  cost: Money,
  rates: ServiceDistributionRates,
) {
  const available = Math.max(0, Math.round((numeric(totalPrice) - numeric(cost)) * 100))
  const handler = Math.floor(available * numeric(rates.handler) / 100)
  const sender = Math.floor(available * numeric(rates.sender) / 100)
  const customerService = Math.floor(available * numeric(rates.customerService) / 100)

  return {
    handler: handler / 100,
    sender: sender / 100,
    customerService: customerService / 100,
    team: (available - handler - sender - customerService) / 100,
  }
}

export function calculateServiceTeamCut(
  totalPrice: Money,
  cost: Money,
  handler: Money,
  sender: Money,
  customerService: Money,
) {
  return (cents(totalPrice) - cents(cost) - cents(handler) - cents(sender) - cents(customerService)) / 100
}
