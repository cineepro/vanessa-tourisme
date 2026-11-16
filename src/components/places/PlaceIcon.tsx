// src/components/places/PlaceIcon.tsx — Vanessa Tourisme
import {
  Banknote,
  BedDouble,
  Bus,
  Clapperboard,
  CookingPot,
  Flag,
  Fuel,
  Hospital,
  Landmark,
  MapPin,
  Music,
  PartyPopper,
  Pill,
  ShieldAlert,
  ShoppingCart,
  Soup,
  Stethoscope,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { PLACE_TYPE_META } from '@/config/constants'
import type { PlaceGroup, PlaceType } from '@/types'

/** Les noms d'icônes viennent de PLACE_TYPE_META (config/constants.ts). */
const ICONS: Record<string, LucideIcon> = {
  Banknote,
  BedDouble,
  Bus,
  Clapperboard,
  CookingPot,
  Flag,
  Fuel,
  Hospital,
  Landmark,
  Music,
  PartyPopper,
  Pill,
  ShieldAlert,
  ShoppingCart,
  Soup,
  Stethoscope,
  Store,
  UtensilsCrossed,
}

export const GROUP_COLORS: Record<PlaceGroup, string> = {
  sante: 'bg-danger-100 text-danger-700',
  restauration: 'bg-accent-100 text-accent-800',
  loisirs: 'bg-sky-100 text-sky-700',
  services: 'bg-sable-200 text-sable-700',
  hebergement: 'bg-primary-100 text-primary-700',
}

export function PlaceIcon({ type, className }: { type: PlaceType; className?: string }) {
  const Icon = ICONS[PLACE_TYPE_META[type].icon] ?? MapPin
  return <Icon className={className} aria-hidden="true" />
}