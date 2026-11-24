// functions/tour-chat/src/geo.js — Vanessa Tourisme
// Géohash et distances (même logique que src/lib/geo.ts du site).

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
const KM_PER_DEGREE = 111.32
const toRad = (deg) => (deg * Math.PI) / 180

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function encodeGeohash(lat, lng, precision = 9) {
  const latR = [-90, 90]
  const lngR = [-180, 180]
  let hash = ''
  let bit = 0
  let chunk = 0
  let even = true
  while (hash.length < precision) {
    const range = even ? lngR : latR
    const value = even ? lng : lat
    const mid = (range[0] + range[1]) / 2
    if (value >= mid) {
      chunk = (chunk << 1) | 1
      range[0] = mid
    } else {
      chunk = chunk << 1
      range[1] = mid
    }
    even = !even
    bit += 1
    if (bit === 5) {
      hash += BASE32[chunk]
      bit = 0
      chunk = 0
    }
  }
  return hash
}

const cellSize = (precision) => {
  const bits = precision * 5
  return { lat: 180 / 2 ** Math.floor(bits / 2), lng: 360 / 2 ** Math.ceil(bits / 2) }
}
const wrapLng = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180
const clampLat = (lat) => Math.max(-89.999999, Math.min(89.999999, lat))

/** Préfixes géohash (cellule centrale + 8 voisines) couvrant un rayon autour d'un point. */
export function geohashPrefixesForRadius(center, radiusKm) {
  const lngScale = Math.max(Math.cos(toRad(center.lat)), 0.01)
  let precision = 1
  for (let p = 9; p >= 1; p -= 1) {
    const cell = cellSize(p)
    if (Math.min(cell.lat * KM_PER_DEGREE, cell.lng * KM_PER_DEGREE * lngScale) >= radiusKm) {
      precision = p
      break
    }
  }
  const cell = cellSize(precision)
  const set = new Set()
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      set.add(encodeGeohash(clampLat(center.lat + dy * cell.lat), wrapLng(center.lng + dx * cell.lng), precision))
    }
  }
  return [...set]
}