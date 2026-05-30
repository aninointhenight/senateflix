import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase }          from '../lib/supabase'
import ShowsManager          from '../components/admin/ShowsManager'
import CategoriesManager     from '../components/admin/CategoriesManager'
import FeaturedManager       from '../components/admin/FeaturedManager'

const TABS = [
  { id: 'shows',      label: 'Shows'          },
  { id: 'categories', label: 'Categories'     },
  { id: 'featured',   label: 'Hero Carousel'  },
]

export default function Admin() {
  const [session,      setSession]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('shows')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [authError,    setAuthError]    = useState('')
  const [authLoading,  setAuthLoading]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center">
        <p className="font-bebas text-sf-red text-5xl animate-pulse">SENATEFLIX</p>
      </div>
    )
  }

  // ── Login form ───────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Link to="/" className="block text-center font-bebas text-sf-red text-5xl tracking-widest mb-8 hover:opacity-80 transition-opacity">
            SENATEFLIX
          </Link>

          <div className="bg-[#181818] rounded-lg p-8 shadow-2xl border border-gray-800/50">
            <h1 className="text-white text-2xl font-bold mb-1">Admin</h1>
            <p className="text-gray-500 text-sm mb-6">Sign in to manage Senateflix</p>

            {authError && (
              <div className="bg-sf-red/10 border border-sf-red/40 text-red-400 text-sm rounded p-3 mb-4">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-[#222] border border-gray-700 text-white rounded px-4 py-3 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#222] border border-gray-700 text-white rounded px-4 py-3 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors mt-2"
              >
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-700 text-xs mt-4">
            <Link to="/" className="hover:text-gray-500 transition-colors">← Back to Senateflix</Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Admin panel ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Admin header */}
      <header className="bg-[#141414] border-b border-gray-800 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bebas text-sf-red text-2xl tracking-widest hover:opacity-80 transition-opacity">
            SENATEFLIX
          </Link>
          <span className="text-gray-600 text-xs hidden md:block border-l border-gray-700 pl-4">
            Admin Panel
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-xs hidden md:block truncate max-w-48">
            {session.user.email}
          </span>
          <Link
            to="/"
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            View Site
          </Link>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 bg-[#141414]">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-sf-red text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 md:p-8">
        {tab === 'shows'      && <ShowsManager      />}
        {tab === 'categories' && <CategoriesManager />}
        {tab === 'featured'   && <FeaturedManager   />}
      </div>
    </div>
  )
}
