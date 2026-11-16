// src/components/sites/SiteFilters.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import {
  CLIMATE_LABELS,
  DEPARTMENTS,
  DIFFICULTY_LABELS,
  ENVIRONMENT_LABELS,
  MONTH_LABELS_LONG,
  SITE_CATEGORY_LABELS,
  VIBE_LABELS,
  toOptions,
} from '@/config/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/cn'
import type { Environment, SiteCategory, SiteFilters as Filters, SiteSort, Vibe } from '@/types'

interface SiteFiltersProps {
  value: Filters
  onChange: (next: Filters) => void
  className?: string
}

const selectClass =
  'h-11 w-full rounded-2xl border border-sable-300 bg-white px-3 text-sm text-sable-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

function toggleIn<T>(list: T[] | undefined, item: T): T[] | undefined {
  const current = list ?? []
  const next = current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]
  return next.length > 0 ? next : undefined
}

function countActive(filters: Filters): number {
  return [
    filters.q,
    filters.department,
    filters.categories?.length,
    filters.vibes?.length,
    filters.environments?.length,
    filters.climateFeel,
    filters.difficulty,
    filters.familyFriendly,
    filters.month,
  ].filter(Boolean).length
}

export function SiteFilters({ value, onChange, className }: SiteFiltersProps) {
  const [term, setTerm] = useState(value.q ?? '')
  const debouncedTerm = useDebounce(term, 350)
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  // La recherche texte est envoyée après une courte pause de frappe
  useEffect(() => {
    const next = debouncedTerm.trim() || undefined
    if (next !== value.q) onChange({ ...value, q: next, offset: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm])

  const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch, offset: 0 })

  const reset = () => {
    setTerm('')
    onChange({ sort: value.sort, limit: value.limit })
  }

  const activeCount = countActive(value)

  return (
    <section aria-label="Filtres" className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sable-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Rechercher un site, une ville…"
            aria-label="Rechercher un site"
            className="h-12 w-full rounded-full border border-sable-300 bg-white pl-11 pr-4 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          leftIcon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
          className="md:hidden"
        >
          Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </div>

      <div
        className={cn(
          'space-y-5 rounded-3xl border border-sable-200 bg-white p-4 sm:p-5',
          open ? 'block' : 'hidden md:block',
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium text-sable-700">
            Département
            <select
              className={cn(selectClass, 'mt-1.5')}
              value={value.department ?? ''}
              onChange={(event) =>
                update({ department: (event.target.value || undefined) as Filters['department'] })
              }
            >
              <option value="">Tout le Bénin</option>
              {DEPARTMENTS.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-sable-700">
            Mois de visite
            <select
              className={cn(selectClass, 'mt-1.5')}
              value={value.month ?? ''}
              onChange={(event) =>
                update({ month: event.target.value ? Number(event.target.value) : undefined })
              }
            >
              <option value="">Toute l’année</option>
              {MONTH_LABELS_LONG.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-sable-700">
            Difficulté
            <select
              className={cn(selectClass, 'mt-1.5')}
              value={value.difficulty ?? ''}
              onChange={(event) =>
                update({ difficulty: (event.target.value || undefined) as Filters['difficulty'] })
              }
            >
              <option value="">Toutes</option>
              {toOptions(DIFFICULTY_LABELS).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-sable-700">
            Trier par
            <select
              className={cn(selectClass, 'mt-1.5')}
              value={value.sort ?? 'recent'}
              onChange={(event) => update({ sort: event.target.value as SiteSort })}
            >
              <option value="recent">Plus récents</option>
              <option value="rating">Mieux notés</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </label>
        </div>

        <ChipGroup
          label="Type de site"
          options={toOptions<SiteCategory>(SITE_CATEGORY_LABELS)}
          selected={value.categories}
          onToggle={(item) => update({ categories: toggleIn(value.categories, item) })}
        />

        <button
          type="button"
          onClick={() => setShowMore((current) => !current)}
          aria-expanded={showMore}
          className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
        >
          {showMore ? 'Moins de filtres' : 'Plus de filtres'}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', showMore && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {showMore && (
          <div className="space-y-5">
            <ChipGroup
              label="Ambiance"
              options={toOptions<Vibe>(VIBE_LABELS)}
              selected={value.vibes}
              onToggle={(item) => update({ vibes: toggleIn(value.vibes, item) })}
            />
            <ChipGroup
              label="Cadre"
              options={toOptions<Environment>(ENVIRONMENT_LABELS)}
              selected={value.environments}
              onToggle={(item) => update({ environments: toggleIn(value.environments, item) })}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-sable-700">
                Sensation climatique
                <select
                  className={cn(selectClass, 'mt-1.5')}
                  value={value.climateFeel ?? ''}
                  onChange={(event) =>
                    update({ climateFeel: (event.target.value || undefined) as Filters['climateFeel'] })
                  }
                >
                  <option value="">Peu importe</option>
                  {toOptions(CLIMATE_LABELS).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 self-end rounded-2xl bg-sable-100 px-4 py-3 text-sm font-medium text-sable-800">
                <input
                  type="checkbox"
                  checked={Boolean(value.familyFriendly)}
                  onChange={(event) => update({ familyFriendly: event.target.checked || undefined })}
                  className="h-4 w-4 accent-primary-600"
                />
                Adapté aux familles
              </label>
            </div>
          </div>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          >
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    </section>
  )
}

interface ChipGroupProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  selected: T[] | undefined
  onToggle: (value: T) => void
}

function ChipGroup<T extends string>({ label, options, selected, onToggle }: ChipGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-sable-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected?.includes(option.value) ?? false
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}