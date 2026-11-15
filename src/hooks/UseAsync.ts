import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

import { getErrorMessage } from '@/lib/appwrite'

export interface AsyncState<T> {
  data: T | undefined
  error: string | null
  isLoading: boolean
  /** Relance la requete */
  reload: () => void
  /** Pour les mises a jour optimistes */
  setData: Dispatch<SetStateAction<T | undefined>>
}

/**
 * Charge des donnees asynchrones et gere chargement, erreur et annulation.
 * `deps` : valeurs qui, en changeant, relancent la requete.
 * `enabled: false` met la requete en pause (ex: pas encore de position).
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const { enabled = true } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [tick, setTick] = useState(0)

  // Toujours la derniere version du fetcher, sans relancer l'effet a chaque rendu
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(getErrorMessage(err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps])

  return {
    data,
    error,
    isLoading,
    reload: () => setTick((value) => value + 1),
    setData,
  }
}