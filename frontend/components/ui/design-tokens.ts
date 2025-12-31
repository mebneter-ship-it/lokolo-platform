/**
 * Lokolo Design System - Design Tokens
 * 
 * Central source of truth for all design decisions.
 * Import and use these constants throughout the app.
 * 
 * Usage:
 *   import { colors, spacing, typography } from '@/lib/design-tokens'
 */

// ===========================================
// COLORS - Brand Palette
// ===========================================
export const colors = {
  // Primary brand colors
  gold: '#F5A623',
  teal: '#156B60',
  orange: '#B85C1A',
  
  // Backgrounds
  cream: '#FAF7F2',
  white: '#FFFFFF',
  
  // Text
  textPrimary: '#2D2D2D',
  textSecondary: '#6B6B6B',
  
  // Status colors
  success: '#156B60',  // teal
  warning: '#F5A623',  // gold
  error: '#DC2626',
  info: '#3B82F6',
  
  // Gradients (as CSS strings)
  gradients: {
    header: 'linear-gradient(to right, #B85C1A, #F5A623)',  // orange to gold
    headerClass: 'bg-gradient-to-r from-orange to-gold',
  },
} as const

// ===========================================
// TYPOGRAPHY
// ===========================================
export const typography = {
  // Header titles
  headerTitle: 'text-xl font-bold text-white',
  headerSubtitle: 'text-sm text-white/80',
  
  // Page titles
  pageTitle: 'text-2xl font-bold text-text-primary',
  sectionTitle: 'text-xl font-bold text-text-primary',
  cardTitle: 'text-lg font-bold text-text-primary',
  
  // Body text
  body: 'text-text-primary',
  bodySecondary: 'text-text-secondary',
  small: 'text-sm text-text-secondary',
  
  // Labels & badges
  label: 'text-sm font-medium text-text-secondary',
  badge: 'text-xs font-semibold',
} as const

// ===========================================
// SPACING & LAYOUT
// ===========================================
export const layout = {
  // Header
  header: {
    className: 'sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md',
    padding: 'px-4 py-3',
  },
  
  // Page content
  page: {
    maxWidth: 'max-w-6xl mx-auto',
    padding: 'p-4',
  },
  
  // Cards
  card: {
    base: 'bg-white rounded-2xl shadow-md',
    padding: 'p-6',
    hover: 'hover:shadow-lg transition-shadow',
  },
} as const

// ===========================================
// BUTTONS
// ===========================================
export const buttons = {
  // Primary (gold)
  primary: 'px-4 py-2 bg-gold text-text-primary font-semibold rounded-xl hover:bg-[#E69515] active:scale-98 transition-all',
  
  // Secondary (teal)
  secondary: 'px-4 py-2 bg-teal text-white font-semibold rounded-xl hover:bg-[#0E5A50] active:scale-98 transition-all',
  
  // Tertiary (orange)
  tertiary: 'px-4 py-2 bg-orange text-white font-semibold rounded-xl hover:bg-[#8F4814] active:scale-98 transition-all',
  
  // Outline
  outline: 'px-4 py-2 bg-white border-2 border-gold text-text-primary font-semibold rounded-xl hover:bg-gold active:scale-98 transition-all',
  
  // Ghost (transparent)
  ghost: 'px-4 py-2 bg-transparent text-text-primary font-semibold rounded-xl hover:bg-cream active:scale-98 transition-all',
  
  // Danger
  danger: 'px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-500 hover:text-white transition-colors',
  
  // Icon button (round)
  icon: 'flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors',
  
  // Sizes
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  },
} as const

// ===========================================
// BADGES & STATUS
// ===========================================
export const badges = {
  // Status badges
  active: 'bg-teal/10 text-teal',
  pending: 'bg-gold/10 text-gold',
  draft: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-600',
  verified: 'bg-teal text-white',
  featured: 'bg-gold text-text-primary',
  
  // Base style
  base: 'px-3 py-1 rounded-full text-xs font-semibold',
} as const

// ===========================================
// FORM INPUTS
// ===========================================
export const inputs = {
  base: 'w-full px-4 py-3 rounded-xl border border-cream bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all',
  error: 'border-red-500 focus:ring-red-500',
  label: 'block text-sm font-medium text-text-secondary mb-2',
} as const

// ===========================================
// SHADOWS
// ===========================================
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const

// ===========================================
// BREAKPOINTS (for reference)
// ===========================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

// ===========================================
// Z-INDEX LAYERS
// ===========================================
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 40,
  header: 50,
  modal: 60,
  tooltip: 70,
  toast: 80,
} as const
