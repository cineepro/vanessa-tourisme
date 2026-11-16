// src/components/agency/FormFields.tsx — Vanessa Tourisme
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'

import { MONTH_LABELS_SHORT } from '@/config/constants'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------
   Conversions pour les champs numériques (saisis comme du texte)
------------------------------------------------------------ */
export function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') return null
  const number = Number(trimmed)
  return Number.isFinite(number) ? number : null
}

export const numberToString = (value: number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value)

/* ------------------------------------------------------------
   Mise en page
------------------------------------------------------------ */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="space-y-4 rounded-3xl border border-sable-200 bg-white p-4 sm:p-5">
      <legend className="px-2 font-display text-base font-bold text-sable-900">{title}</legend>
      {description && <p className="-mt-2 text-sm text-sable-600">{description}</p>}
      {children}
    </fieldset>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger-700">
      {message}
    </p>
  )
}

const controlClass =
  'h-12 w-full rounded-2xl border bg-white px-3 text-base text-sable-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

/* ------------------------------------------------------------
   Champs
------------------------------------------------------------ */
interface SelectFieldProps<T extends string> {
  label: string
  value: T | ''
  onChange: (value: T | '') => void
  options: { value: T; label: string }[]
  placeholder?: string
  error?: string
  required?: boolean
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: SelectFieldProps<T>) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-sable-800">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T | '')}
        aria-invalid={error ? true : undefined}
        className={cn(controlClass, error ? 'border-danger-500' : 'border-sable-300')}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  min?: number
  max?: number
  step?: number | 'any'
  required?: boolean
  placeholder?: string
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  min,
  max,
  step = 1,
  required,
  placeholder,
}: NumberFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-sable-800">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(controlClass, error ? 'border-danger-500' : 'border-sable-300')}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-sable-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sable-100 px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
      />
      <span className="text-sm">
        <span className="font-medium text-sable-900">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-sable-500">{hint}</span>}
      </span>
    </label>
  )
}

interface ChipMultiSelectProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T[]
  onChange: (value: T[]) => void
  hint?: string
  error?: string
  required?: boolean
}

export function ChipMultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  required,
}: ChipMultiSelectProps<T>) {
  const toggle = (item: T) =>
    onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item])

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-sable-800">
        {label}
        {required && <span className="text-danger-600"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
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
      {hint && !error && <p className="mt-1.5 text-xs text-sable-500">{hint}</p>}
      <FieldError message={error} />
    </fieldset>
  )
}

interface TagsInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  hint?: string
  maxLength?: number
  error?: string
}

/** Liste de mots : Entrée ou virgule pour ajouter, croix pour retirer. */
export function TagsInput({ label, value, onChange, placeholder, hint, maxLength = 200, error }: TagsInputProps) {
  const id = useId()
  const [draft, setDraft] = useState('')

  const commit = () => {
    const parts = draft
      .split(',')
      .map((part) => part.trim().slice(0, maxLength))
      .filter((part) => part && !value.includes(part))
    if (parts.length > 0) onChange([...value, ...parts])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-sable-800">
        {label}
      </label>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-2xl border bg-white p-2 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/20',
          error ? 'border-danger-500' : 'border-sable-300',
        )}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-primary-100 py-1 pl-3 pr-1.5 text-sm text-primary-900"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((entry) => entry !== item))}
              aria-label={`Retirer ${item}`}
              className="rounded-full p-0.5 hover:bg-primary-200"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-base focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-sable-500">{hint ?? 'Appuyez sur Entrée pour ajouter.'}</p>
      <FieldError message={error} />
    </div>
  )
}

/** Sélection des mois (1 à 12). */
export function MonthsPicker({
  value,
  onChange,
  label,
}: {
  value: number[]
  onChange: (value: number[]) => void
  label: string
}) {
  const toggle = (month: number) =>
    onChange(value.includes(month) ? value.filter((entry) => entry !== month) : [...value, month].sort((a, b) => a - b))

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-sable-800">{label}</legend>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {MONTH_LABELS_SHORT.map((name, index) => {
          const active = value.includes(index + 1)
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(index + 1)}
              aria-pressed={active}
              className={cn(
                'rounded-xl border py-2 text-sm font-medium capitalize transition-colors',
                active
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
              )}
            >
              {name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

const WEEKDAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
] as const

/** Sélection de jours de la semaine (0 = dimanche … 6 = samedi). */
export function WeekdaysPicker({
  value,
  onChange,
  label,
  hint,
}: {
  value: number[]
  onChange: (value: number[]) => void
  label: string
  hint?: string
}) {
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((entry) => entry !== day) : [...value, day])

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-sable-800">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((day) => {
          const active = value.includes(day.value)
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggle(day.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
              )}
            >
              {day.label}
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-sable-500">{hint}</p>}
    </fieldset>
  )
}