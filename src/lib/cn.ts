export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, unknown>

/**
 * Assemble des noms de classes CSS en ignorant les valeurs vides.
 *
 * cn('p-4', isActive && 'bg-primary-600', { 'opacity-50': disabled })
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const inner = cn(...input)
      if (inner) out.push(inner)
    } else if (typeof input === 'object') {
      for (const [className, enabled] of Object.entries(input)) {
        if (enabled) out.push(className)
      }
    }
  }

  return out.join(' ')
}