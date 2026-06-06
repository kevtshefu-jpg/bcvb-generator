import { useCallback, useRef, useState } from 'react'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error' | 'timeout'

export function useAsyncState<T>() {
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runIdRef = useRef(0)

  const run = useCallback(
    async (task: () => Promise<T>, options?: { timeoutMs?: number }) => {
      const runId = ++runIdRef.current
      setStatus('loading')
      setError(null)

      const timeoutMs = options?.timeoutMs ?? 12000

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error('TIMEOUT'))
          }, timeoutMs)
        })

        const result = await Promise.race([task(), timeoutPromise])

        if (runId !== runIdRef.current) return null

        setData(result)
        setStatus('success')
        return result
      } catch (err) {
        if (runId !== runIdRef.current) return null

        const message = err instanceof Error ? err.message : 'Erreur inconnue.'
        if (message === 'TIMEOUT') {
          setStatus('timeout')
          setError('Le chargement a pris trop de temps.')
        } else {
          setStatus('error')
          setError(message)
        }

        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    runIdRef.current += 1
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error' || status === 'timeout',
    run,
    reset,
  }
}
