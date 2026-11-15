import { useCallback, useEffect, useRef, useState } from 'react'

import { geolocationErrorMessage, getCurrentPosition, type DevicePosition } from '@/lib/geo'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'error'

const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { position: DevicePosition; at: number } | null = null

const readCache = (): DevicePosition | null =>
  cache && Date.now() - cache.at < CACHE_TTL_MS ? cache.position : null

interface Options {
  /** Demande la position des le montage, seulement si deja autorisee (sans pop-up) */
  autoRequest?: boolean
}

/**
 * Position de l'appareil. La demande d'autorisation n'a lieu que lorsque
 * `request()` est appele (action explicite du touriste).
 */
export function useGeolocation({ autoRequest = false }: Options = {}) {
  const cached = readCache()
  const [position, setPosition] = useState<DevicePosition | null>(cached)
  const [status, setStatus] = useState<GeoStatus>(cached ? 'granted' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const request = useCallback(async (): Promise<DevicePosition | null> => {
    setStatus('loading')
    setError(null)
    try {
      const result = await getCurrentPosition()
      cache = { position: result, at: Date.now() }
      if (mounted.current) {
        setPosition(result)
        setStatus('granted')
      }
      return result
    } catch (err) {
      if (mounted.current) {
        const code = (err as { code?: number } | null)?.code
        setStatus(
          code === 1
            ? 'denied'
            : err instanceof Error && err.message === 'GEOLOCATION_UNSUPPORTED'
              ? 'unavailable'
              : 'error',
        )
        setError(geolocationErrorMessage(err))
      }
      return null
    }
  }, [])

  const clear = useCallback(() => {
    cache = null
    setPosition(null)
    setStatus('idle')
    setError(null)
  }, [])

  useEffect(() => {
    if (!autoRequest || readCache() || !('permissions' in navigator)) return

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'granted') void request()
        else if (result.state === 'denied' && mounted.current) setStatus('denied')
      })
      .catch(() => {
        /* navigateur sans API permissions : on attend une action explicite */
      })
  }, [autoRequest, request])

  return { position, status, error, isLoading: status === 'loading', request, clear }
}