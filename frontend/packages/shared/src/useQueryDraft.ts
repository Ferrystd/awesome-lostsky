import { computed, ref, watch } from 'vue'

export interface DraftSubmission<T> {
  key: string
  generation: number
  value: T
}

/** Plain, serializable form values; query data and mutable drafts never share references. */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const fingerprint = (value: unknown): string => JSON.stringify(value)

export function useQueryDraft<T>(options: {
  key: () => string
  read: () => T
  apply: (value: T) => void
  initial?: () => T
}) {
  const initial = copy(options.read())
  const baseline = ref(fingerprint(initial))
  let key = options.key()
  let generation = 0
  const dirty = computed(() => fingerprint(options.read()) !== baseline.value)

  function reset(value = options.initial ? options.initial() : initial) {
    options.apply(copy(value))
    baseline.value = fingerprint(options.read())
  }
  watch(options.key, next => {
    key = next
    generation++
    reset()
  }, { flush: 'sync' })

  function hydrate(value: T, targetKey = options.key()) {
    if (targetKey !== key || dirty.value) return false
    reset(value)
    return true
  }
  function capture(): DraftSubmission<T> {
    return { key, generation, value: copy(options.read()) }
  }
  function isCurrent(submission: DraftSubmission<T>) {
    return submission.key === key && submission.generation === generation
  }
  function accept(submission: DraftSubmission<T>, saved = submission.value) {
    if (!isCurrent(submission)) return false
    if (fingerprint(options.read()) === fingerprint(submission.value)) reset(saved)
    else baseline.value = fingerprint(saved)
    return true
  }
  return { dirty, hydrate, capture, accept, isCurrent, reset }
}
