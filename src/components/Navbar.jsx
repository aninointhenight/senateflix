import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV_LINKS = [
  { to: '/',        label: 'Home'    },
  { to: '/films',   label: 'Films'   },
  { to: '/series',  label: 'Series'  },
  { to: '/my-flix', label: 'My Flix' },
]

const LAST_VISIT_KEY = 'sf_last_visit'
const LAST_NOTIF_KEY = 'sf_last_notif_check'
const SEVEN_DAYS_MS  = 7 * 24 * 60 * 60 * 1000

const GLASS = {
  background: 'rgba(18,18,18,0.78)',
  backdropFilter: 'blur(28px) saturate(1.7)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
}

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [session,       setSession]       = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  const profileRef = useRef(null)
  const notifRef   = useRef(null)
  const searchRef  = useRef(null)
  const searchInp  = useRef(null)
  const location   = useLocation()
  const navigate   = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))

    const now       = Date.now()
    const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0')
    const cutoff    = Math.max(lastVisit, now - SEVEN_DAYS_MS)
    localStorage.setItem(LAST_VISIT_KEY, String(now))
    fetchNotifications(cutoff)

    const closeOnOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (searchRef.current  && !searchRef.current.contains(e.target))  { setSearchOpen(false); setSearchQuery('') }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => {
      window.removeEventListener('scroll', onScroll)
      subscription.unsubscribe()
      document.removeEventListener('mousedown', closeOnOutside)
    }
  }, [])

  useEffect(() => {
    if (searchOpen && searchInp.current) searchInp.current.focus()
  }, [searchOpen])

  async function fetchNotifications(cutoffMs) {
    const cutoffISO = new Date(cutoffMs).toISOString()
    const lastCheck = localStorage.getItem(LAST_NOTIF_KEY)
    const { data }  = await supabase
      .from('shows')
      .select('id, title, type, created_at, thumbnail_vertical, youtube_id')
      .gt('created_at', cutoffISO)
      .order('created_at', { ascending: false })
      .limit(20)
    const notifs = data || []
    setNotifications(notifs)
    if (lastCheck) {
      setUnreadCount(notifs.filter(n => new Date(n.created_at) > new Date(lastCheck)).length)
    } else {
      setUnreadCount(notifs.length)
    }
  }

  function openNotif() {
    setNotifOpen(o => !o)
    setProfileOpen(false)
    localStorage.setItem(LAST_NOTIF_KEY, new Date().toISOString())
    setUnreadCount(0)
  }

  function handleSearchKey(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false); setSearchQuery('')
    }
    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setProfileOpen(false)
    navigate('/')
  }

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'navbar-glass' : 'navbar-fade'}`}>
      <div className="flex items-center px-3 sm:px-4 md:px-12 h-14 md:h-16 gap-2 md:gap-6">

        {/* Logo */}
        <Link to="/" className="text-sf-red font-bebas text-2xl sm:text-3xl md:text-4xl tracking-widest shrink-0 hover:opacity-90 transition-opacity">
          SENATEFLIX
        </Link>

        {/* Desktop nav links — strictly desktop only */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`px-3 py-1 text-sm rounded-full transition-all ${
                isActive(to) ? 'text-white font-semibold bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right side icons — always visible, compact on mobile */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">

          {/* Search */}
          <div className="relative" ref={searchRef}>
            {searchOpen ? (
              <div className="flex items-center rounded-full px-2.5 sm:px-3 py-1.5 gap-1.5 sm:gap-2"
                style={{ ...GLASS, border: '1px solid rgba(255,255,255,0.14)' }}>
                <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input ref={searchInp} value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                  placeholder="Search..."
                  className="bg-transparent text-white text-sm outline-none w-24 sm:w-40 placeholder-gray-600"
                />
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)}
                className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
                <svg className="w-[18px] h-[18px] md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={openNotif}
              className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5">
              <svg className="w-[18px] h-[18px] md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sf-red rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl overflow-hidden z-50 dropdown-enter" style={GLASS}>
                <p className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                  New Since Your Last Visit
                </p>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-gray-600 text-sm text-center">No new shows since your last visit.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <Link key={n.id} to={n.type === 'series' ? '/series' : '/films'}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-[#2a2a2a] shrink-0">
                          {(n.thumbnail_vertical || n.youtube_id) && (
                            <img
                              src={n.thumbnail_vertical || `https://img.youtube.com/vi/${n.youtube_id}/mqdefault.jpg`}
                              alt={n.title} className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{n.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {n.type === 'series' ? '📺 Series' : '🎬 Film'} · {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* About — desktop only */}
          <Link to="/about"
            className={`hidden md:block px-3 py-1 text-sm rounded-full transition-all ${
              isActive('/about') ? 'text-white font-semibold bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            About
          </Link>

          {/* Support — desktop only (mobile gets it in the scroll bar below) */}
          <a href="https://sociabuzz.com/anino/tribe" target="_blank" rel="noopener noreferrer"
            className="support-btn hidden md:flex items-center gap-1.5 bg-sf-red hover:bg-red-700 active:scale-95 text-white font-bold text-sm px-4 py-2 rounded-full transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Support
          </a>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => { setProfileOpen(p => !p); setNotifOpen(false) }} className="flex items-center gap-1">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-sf-red flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <svg className={`hidden sm:block w-3 h-3 text-white transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-52 rounded-2xl overflow-hidden z-50 dropdown-enter" style={GLASS}>
                {session ? (
                  <>
                    <p className="px-4 py-2.5 text-xs text-gray-500 border-b border-white/5 truncate">{session.user.email}</p>
                    <Link to="/admin" onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                      Admin Panel
                    </Link>
                    <button onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors border-t border-white/5">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/admin" onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                    Admin Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav — horizontal scroll, includes About + Support here */}
      <div className="md:hidden flex items-center overflow-x-auto no-scrollbar border-t border-white/5 px-3 h-9">
        {[...NAV_LINKS, { to: '/about', label: 'About' }].map(({ to, label }) => (
          <Link key={to} to={to}
            className={`shrink-0 px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
              isActive(to) ? 'text-white border-sf-red font-semibold' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}>
            {label}
          </Link>
        ))}
        <a href="https://sociabuzz.com/anino/tribe" target="_blank" rel="noopener noreferrer"
          className="shrink-0 px-2.5 py-1.5 text-xs text-sf-red border-b-2 border-transparent font-bold whitespace-nowrap">
          Support ♥
        </a>
      </div>
    </nav>
  )
}

function timeAgo(iso) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
