import { useEffect, useState } from 'react'

export function useSafeLoading(isLoading: boolean, timeout = 2500) {
  const [safeLoading, setSafeLoading] = useState(isLoading)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    setSafeLoading(isLoading)
    setHasTimedOut(false)

    if (!isLoading) return

    const timer = window.setTimeout(() => {
      setSafeLoading(false)
      setHasTimedOut(true)
    }, timeout)

    return () => window.clearTimeout(timer)
  }, [isLoading, timeout])

  return { safeLoading, hasTimedOut }
}
