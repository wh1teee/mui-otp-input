import type React from 'react'

/** Preserves React 19 callback-ref cleanup while composing adapter and user refs. */
export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (value) => {
    const cleanups: (null | (() => void))[] = []

    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(value)
        cleanups.push(typeof cleanup === 'function' ? cleanup : null)
      } else {
        if (ref) {
          ref.current = value
        }

        cleanups.push(null)
      }
    }

    return () => {
      for (const [index, ref] of refs.entries()) {
        const cleanup = cleanups[index]

        if (cleanup) {
          cleanup()
        } else if (typeof ref === 'function') {
          ref(null)
        } else if (ref) {
          ref.current = null
        }
      }
    }
  }
}
