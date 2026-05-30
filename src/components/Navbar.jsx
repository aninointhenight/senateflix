import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ categories = [] }) {
  const [scrolled,     setScrolled]     = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [session,      setSession]      = useState(null)
  const profileRef = useRef(null)
  const navigate   = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))

    const closeOnOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)

    return () => {
      window.removeEventListener('scroll', onScroll)
      subscription.unsubscribe()
      document.removeEventListener('mousedown', closeOnOutside)
    }
  }, [])

  function scrollToRow(name) {
    const id = `row-${name.toLowerCase().replace(/\s+/g, '-')}`
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setProfileOpen(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setProfileOpen(false)
    navigate('/')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#141414]' : 'navbar-fade'
      }`}
    >
      <div className="flex items-center px-4 md:px-12 h-16 gap-4 md:gap-6">

        {/* ── Logo ──────────────────────────────────────────── */}
        <Link
          to="/"
          className="text-sf-red font-bebas text-3xl md:text-4xl tracking-widest shrink-0 hover:opacity-90 transition-opacity"
        >
          SENATEFLIX
        </Link>

        {/* ── Nav links (desktop) ───────────────────────────── */}
        <div className="hidden md:flex items-center gap-5 flex-1 overflow-hidden">
          <Link to="/" className="text-sm text-white hover:text-gray-300 transition-colors shrink-0">
            Home
          </Link>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToRow(cat.name)}
              className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Right side icons ──────────────────────────────── */}
        <div className="ml-auto flex items-center gap-4">

          {/* Search */}
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Notification bell */}
          <button className="text-gray-400 hover:text-white transition-colors hidden md:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-1.5 group"
            >
              <div className="w-8 h-8 rounded bg-sf-red flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <svg
                className={`w-3 h-3 text-white transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1a] border border-gray-700/60 rounded shadow-2xl overflow-hidden z-50">
                {session ? (
                  <>
                    <p className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-700/50 truncate">
                      {session.user.email}
                    </p>
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                    >
                      Admin Panel
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors border-t border-gray-700/50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/admin"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                  >
                    Admin Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
