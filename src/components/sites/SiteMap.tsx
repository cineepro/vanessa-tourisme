// src/components/sites/SiteMap.tsx — Vanessa Tourisme
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import { BENIN_CENTER } from '@/config/constants'
import { env } from '@/config/env'
import { cn } from '@/lib/cn'
import type { LatLng } from '@/types'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  subtitle?: string
  /** Lien affiché dans la fenêtre du repère */
  href?: string
  tone?: 'primary' | 'accent' | 'danger'
}

interface SiteMapProps {
  markers: MapMarker[]
  /** Centre forcé (sinon la carte s'ajuste aux repères) */
  center?: LatLng
  zoom?: number
  /** Position du touriste (point bleu) */
  userPosition?: LatLng | null
  height?: number | string
  className?: string
  onMarkerClick?: (id: string) => void
}

const toneClass = {
  primary: 'bg-primary-600',
  accent: 'bg-accent-400',
  danger: 'bg-danger-600',
} as const

function createPin(tone: keyof typeof toneClass, title: string): HTMLButtonElement {
  const pin = document.createElement('button')
  pin.type = 'button'
  pin.setAttribute('aria-label', title)
  pin.className = `h-5 w-5 cursor-pointer rounded-full border-[3px] border-white shadow-lg ${toneClass[tone]}`
  return pin
}

function createPopupContent(marker: MapMarker): HTMLElement {
  const root = document.createElement('div')
  root.className = 'max-w-[220px] p-1 font-sans'

  const title = document.createElement('p')
  title.className = 'text-sm font-bold text-sable-900'
  title.textContent = marker.title
  root.appendChild(title)

  if (marker.subtitle) {
    const subtitle = document.createElement('p')
    subtitle.className = 'mt-0.5 text-xs text-sable-600'
    subtitle.textContent = marker.subtitle
    root.appendChild(subtitle)
  }

  if (marker.href) {
    const link = document.createElement('a')
    link.href = marker.href
    link.className = 'mt-2 inline-block text-xs font-semibold text-primary-700 underline'
    link.textContent = 'Voir la fiche'
    root.appendChild(link)
  }

  return root
}

export function SiteMap({
  markers,
  center,
  zoom,
  userPosition,
  height = 380,
  className,
  onMarkerClick,
}: SiteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<MapLibreMarker[]>([])
  const clickRef = useRef(onMarkerClick)
  clickRef.current = onMarkerClick
  const [ready, setReady] = useState(false)

  // Clés stables : évitent de reconstruire la carte quand le parent recrée ses tableaux
  const markersKey = JSON.stringify(markers)
  const userKey = userPosition ? `${userPosition.lat},${userPosition.lng}` : ''
  const centerKey = center ? `${center.lat},${center.lng}` : ''

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: env.mapStyleUrl,
      center: [center?.lng ?? BENIN_CENTER.lng, center?.lat ?? BENIN_CENTER.lat],
      zoom: zoom ?? BENIN_CENTER.zoom,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map
    map.on('load', () => setReady(true))

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Repères
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    markers.forEach((item) => {
      const pin = createPin(item.tone ?? 'primary', item.title)
      pin.addEventListener('click', () => clickRef.current?.(item.id))

      const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setDOMContent(
        createPopupContent(item),
      )

      markersRef.current.push(
        new maplibregl.Marker({ element: pin }).setLngLat([item.lng, item.lat]).setPopup(popup).addTo(map),
      )
    })

    if (userPosition) {
      const dot = document.createElement('div')
      dot.className = 'h-4 w-4 rounded-full border-[3px] border-white bg-sky-500 shadow-lg'
      dot.setAttribute('aria-label', 'Votre position')
      markersRef.current.push(
        new maplibregl.Marker({ element: dot }).setLngLat([userPosition.lng, userPosition.lat]).addTo(map),
      )
    }

    // Cadrage : centre forcé, sinon ajusté à l'ensemble des repères
    if (!center) {
      const points: [number, number][] = markers.map((m) => [m.lng, m.lat])
      if (userPosition) points.push([userPosition.lng, userPosition.lat])

      if (points.length === 1) {
        map.jumpTo({ center: points[0], zoom: zoom ?? 11 })
      } else if (points.length > 1) {
        const bounds = new maplibregl.LngLatBounds(points[0], points[0])
        points.forEach((point) => bounds.extend(point))
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 })
      }
    }
  }, [markersKey, userKey, centerKey, zoom, ready])

  // Recentrage si le centre change
  useEffect(() => {
    if (center && mapRef.current && ready) {
      mapRef.current.jumpTo({ center: [center.lng, center.lat], zoom: zoom ?? 11 })
    }
  }, [centerKey, zoom, ready])

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Carte"
      style={{ height }}
      className={cn('w-full overflow-hidden rounded-3xl border border-sable-200 bg-sable-100', className)}
    />
  )
}