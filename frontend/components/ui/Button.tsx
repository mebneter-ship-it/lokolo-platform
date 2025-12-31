'use client'

import { forwardRef } from 'react'

/**
 * Lokolo Design System - Button Component
 * 
 * Usage:
 *   <Button>Primary Button</Button>
 *   <Button variant="secondary">Secondary</Button>
 *   <Button variant="danger" size="sm">Delete</Button>
 *   <Button variant="outline" icon={<EditIcon />}>Edit</Button>
 */

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-text-primary hover:bg-[#E69515]',
  secondary: 'bg-teal text-white hover:bg-[#0E5A50]',
  tertiary: 'bg-orange text-white hover:bg-[#8F4814]',
  outline: 'bg-white border-2 border-gold text-text-primary hover:bg-gold',
  ghost: 'bg-transparent text-text-primary hover:bg-cream',
  danger: 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'font-semibold transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed'
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${icon ? 'flex items-center justify-center gap-2' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
