'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login, resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      
      // Get user role from backend
      const auth = (await import('@/lib/firebase')).auth
      const token = await auth.currentUser?.getIdToken()
      
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        
        if (response.ok) {
          const userData = await response.json()
          const userRole = userData.data?.role || 'consumer'
          
          // Redirect based on role
          if (userRole === 'supplier') {
            router.push('/supplier/dashboard')
          } else {
            router.push('/')
          }
        } else {
          // Fallback to home if API call fails
          router.push('/')
        }
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      
      // User-friendly error messages
      if (err.message.includes('invalid-credential') || err.message.includes('user-not-found') || err.message.includes('wrong-password')) {
        setError('Invalid email or password')
      } else if (err.message.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)

    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
    } catch (err: any) {
      if (err.message.includes('user-not-found')) {
        setResetError('No account found with this email')
      } else {
        setResetError('Failed to send reset email. Please try again.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="inline-block">
          <Image
            src="/images/lokolo-logo.png"
            alt="Lokolo"
            width={80}
            height={80}
            className="w-20 h-20"
          />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome back!
            </h1>
            <p className="text-text-secondary">
              Sign in to save favorites and connect with businesses
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-semibold">
                    {error}
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                  placeholder="your@email.com"
                  disabled={loading}
                  style={{ fontSize: '16px' }} // Prevents iOS zoom
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                  placeholder="••••••••"
                  disabled={loading}
                  style={{ fontSize: '16px' }} // Prevents iOS zoom
                />
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                  className="mt-2 text-sm text-orange hover:text-[#A04D15] font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-cream"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-text-secondary">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link href="/signup">
              <button
                type="button"
                className="w-full py-4 bg-cream text-text-primary font-bold rounded-xl hover:bg-disabled transition-colors"
              >
                Create Account
              </button>
            </Link>
          </div>

          {/* Skip Login */}
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Continue without account →
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {resetSuccess ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Check your email</h3>
                  <p className="text-text-secondary">
                    We've sent a password reset link to <span className="font-semibold">{resetEmail}</span>
                  </p>
                </div>
                <button
                  onClick={() => { setShowForgotPassword(false); setResetSuccess(false); setResetEmail(''); }}
                  className="w-full py-3 bg-gold text-text-primary font-bold rounded-xl"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-primary mb-2">Reset Password</h3>
                <p className="text-text-secondary mb-6">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleForgotPassword}>
                  {resetError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                      <p className="text-red-600 text-sm">{resetError}</p>
                    </div>
                  )}
                  
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary mb-4"
                    style={{ fontSize: '16px' }}
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setResetError(''); }}
                      className="flex-1 py-3 border-2 border-cream text-text-secondary font-semibold rounded-xl hover:bg-cream"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 py-3 bg-gold text-text-primary font-bold rounded-xl disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
