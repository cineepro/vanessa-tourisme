// src/components/ui/Button.tsx — Vanessa Tourisme
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-primary-50 text-primary-800 hover:bg-primary-100',
  accent: 'bg-accent-400 text-sable-900 shadow-sm hover:bg-accent-300',
  outline: 'border border-sable-300 bg-white text-sable-800 hover:bg-sable-100',
  ghost: 'text-sable-700 hover:bg-sable-100',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
}

/** Classes d'un bouton, pour styler un <Link> comme un bouton. */
export function buttonClasses(
  options: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {},
): string {
  const { variant = 'primary', size = 'md', fullWidth, className } = options
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
})