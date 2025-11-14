'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from 'firebase/auth'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Sign up the user
      await signup(email, password)
      
      // Update user profile with display name
      const { auth } = await import('@/lib/firebase')
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${firstName.trim()} ${lastName.trim()}`
        })
      }
      
      // Redirect to home after successful signup
      router.push('/')
    } catch (err: any) {
      console.error('Signup failed:', err)
      
      // User-friendly error messages
      if (err.message.includes('email-already-in-use')) {
        setError('This email is already registered. Try logging in instead.')
      } else if (err.message.includes('invalid-email')) {
        setError('Invalid email address')
      } else if (err.message.includes('weak-password')) {
        setError('Password is too weak. Use at least 6 characters.')
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
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
              Join Lokolo
            </h1>
            <p className="text-text-secondary">
              Discover and support Black-owned businesses in Southern Africa
            </p>
          </div>

          {/* Signup Form */}
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

              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-text-primary mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                    placeholder="John"
                    disabled={loading}
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-text-primary mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                    placeholder="Doe"
                    disabled={loading}
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

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
                  style={{ fontSize: '16px' }}
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
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                  placeholder="At least 6 characters"
                  disabled={loading}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-primary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                  placeholder="Re-enter password"
                  disabled={loading}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
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
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link href="/login">
              <button
                type="button"
                className="w-full py-4 bg-cream text-text-primary font-bold rounded-xl hover:bg-disabled transition-colors"
              >
                Sign In
              </button>
            </Link>
          </div>

          {/* Skip Signup */}
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
    </div>
  )
}
