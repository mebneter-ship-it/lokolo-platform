'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface User {
  id: string
  email: string
  display_name: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState<User | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkAdminAccess()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers()
    }
  }, [userRole, roleFilter, page])

  const checkAdminAccess = async () => {
    try {
      const token = await user!.getIdToken()
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (meResponse.ok) {
        const meData = await meResponse.json()
        setUserRole(meData.data?.role)
        
        if (meData.data?.role !== 'admin') {
          setError('Access denied. Admin privileges required.')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Admin access check failed:', err)
      setError('Failed to verify admin access')
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = await user!.getIdToken()
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users?page=${page}&limit=20`
      if (roleFilter) url += `&role=${roleFilter}`
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users || [])
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1)
          setTotal(data.data.pagination.total || 0)
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ))
        setShowRoleModal(null)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update role')
      }
    } catch (err) {
      console.error('Failed to update user role:', err)
      alert('Failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u => 
    !searchQuery || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || (loading && !userRole)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <img src="/images/lokolo-logo.png" alt="Lokolo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-xl font-bold text-white">Manage Users</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Email or name..."
                  className="flex-1 px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-gold"
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                />
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-cream rounded-lg hover:bg-gold/20"
                >
                  Search
                </button>
              </div>
            </div>
            
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="">All Roles</option>
                <option value="consumer">Consumer</option>
                <option value="supplier">Supplier</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {/* Total */}
            <div className="flex items-end">
              <div className="w-full px-4 py-2 bg-cream rounded-lg text-center">
                <span className="text-text-secondary">{total} users</span>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Joined</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-cream/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                            <span className="text-lg font-bold text-text-primary">
                              {u.display_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-semibold text-text-primary">{u.display_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'supplier' ? 'bg-gold/10 text-gold' :
                          'bg-teal/10 text-teal'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setShowRoleModal(u)}
                          className="px-3 py-1 text-sm text-orange hover:bg-orange/10 rounded-lg"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-cream">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Change User Role</h3>
            
            <div className="mb-4">
              <p className="text-text-secondary">
                User: <span className="font-semibold text-text-primary">{showRoleModal.email}</span>
              </p>
              <p className="text-text-secondary">
                Current role: <span className="font-semibold text-text-primary">{showRoleModal.role}</span>
              </p>
            </div>
            
            <div className="space-y-2 mb-6">
              {['consumer', 'supplier', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => updateUserRole(showRoleModal.id, role)}
                  disabled={actionLoading === showRoleModal.id || showRoleModal.role === role}
                  className={`w-full p-3 rounded-xl border-2 text-left font-semibold transition-colors ${
                    showRoleModal.role === role 
                      ? 'border-gold bg-gold/10 text-text-primary' 
                      : 'border-cream hover:border-gold/50'
                  } disabled:opacity-50`}
                >
                  <span className="capitalize">{role}</span>
                  {showRoleModal.role === role && <span className="ml-2 text-sm text-text-secondary">(current)</span>}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowRoleModal(null)}
              className="w-full py-3 border-2 border-cream text-text-secondary font-semibold rounded-xl hover:bg-cream transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
