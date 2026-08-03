export function appendFormListItem<T>(items: T[], createItem: () => T): T[] {
  return [...items, createItem()]
}

export function removeFormListItem<T>(items: T[], index: number): T[] {
  if (index < 0 || index >= items.length) return items
  const next = items.slice()
  next.splice(index, 1)
  return next
}

export function moveFormListItem<T>(items: T[], index: number, target: number): T[] {
  if (index < 0 || index >= items.length || target < 0 || target >= items.length || index === target) return items
  const next = items.slice()
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
