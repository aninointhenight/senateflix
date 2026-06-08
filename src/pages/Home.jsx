import { useState, useEffect, useMemo } from 'react'
import { supabase }           from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import Navbar                 from '../components/Navbar'
import HeroCarousel           from '../components/HeroCarousel'
import ShowRow                from '../components/ShowRow'
import TopShowsRow            from '../components/TopShowsRow'
import CustomRow              from '../components/CustomRow'
import ShowModal              from '../components/ShowModal'
import { getWatchHistory }    from '../lib/utils'

// Slim select for card rows (no description needed)
const SLIM = 'id, title, type, year, category_id, youtube_id, thumbnail_horizontal, thumbnail_vertical, logo_url, tags, badge_override, view_count, season_count, episode_count, created_at, categories(id, name)'
// Featured select includes description + tagline for hero carousel
const FEATURED = SLIM + ', description, tagline'

export default function Home() {
  const [shows,         setShows]         = useState([])
  const [featuredShows, setFeaturedShows] = useState([])
  const [customRows,    setCustomRows]    = useState([])
  const [selectedShow,  setSelectedShow]  = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const cachedShows    = cacheGet('shows_all')
      const cachedFeatured = cacheGet('shows_featured')
      const cachedRows     = cacheGet('custom_rows')

      const [showsRes, featRes, rowsRes] = await Promise.all([
        cachedShows
          ? Promise.resolve({ data: cachedShows })
          : supabase.from('shows').select(SLIM).order('created_at', { ascending: false }),
        cachedFeatured
          ? Promise.resolve({ data: cachedFeatured })
          : supabase.from('shows').select(FEATURED).eq('is_featured', true).order('featured_order').limit(7),
        cachedRows
          ? Promise.resolve({ data: cachedRows })
          : supabase.from('custom_rows')
              .select(`*, custom_row_shows(
                id, display_order,
                shows(id, title, type, year, youtube_id, thumbnail_vertical,
                  badge_override, season_count, episode_count, created_at, categories(id, name))
              )`)
              .eq('active', true)
              .order('display_order'),
      ])

      if (showsRes.error) throw showsRes.error

      const allShows = showsRes.data || []
      if (!cachedShows)    cacheSet('shows_all',      allShows)
      if (!cachedFeatured) cacheSet('shows_featured', featRes.data || [])
      if (!cachedRows)     cacheSet('custom_rows',    rowsRes.data || [])

      setShows(allShows)
      setFeaturedShows(featRes.data || [])
      setCustomRows(rowsRes.data || [])
    } catch (e) {
      console.error('[Senateflix]', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Top Shows sorted by real view counts
  const topShows = useMemo(
    () => [...shows].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)),
    [shows]
  )

  // Personalized "Since you watched X" rows
  const personalizedRows = useMemo(() => {
    try {
      const history      = getWatchHistory()
      const watchedSet   = new Set(history)
      const watchedShows = shows.filter(s => watchedSet.has(s.id))
      const allUnwatched = shows.filter(s => !watchedSet.has(s.id))
      const usedIds      = new Set()
      const rows         = []

      watchedShows.slice(0, 2).forEach(watched => {
        if (!watched.tags?.length) return
        const similar = allUnwatched
          .filter(s => !usedIds.has(s.id) && s.tags?.some(t => watched.tags.includes(t)))
          .slice(0, 10)
        if (similar.length >= 2) {
          similar.forEach(s => usedIds.add(s.id))
          rows.push({ title: `Since you watched ${watched.title}`, shows: similar })
        }
      })
      return rows
    } catch { return [] }
  }, [shows])

  if (loading) return (
    <div className="min-h-screen bg-sf-dark flex items-center justify-center">
      <p className="font-bebas text-sf-red text-6xl tracking-widest animate-pulse">SENATEFLIX</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-sf-dark flex items-center justify-center flex-col gap-4">
      <p className="font-bebas text-sf-red text-4xl">Something went wrong</p>
      <p className="text-gray-500 text-sm max-w-md text-center">{error}</p>
      <button onClick={fetchAll} className="bg-sf-red text-white px-6 py-2 rounded text-sm">Retry</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-sf-dark">
      <Navbar />
      <HeroCarousel featuredShows={featuredShows} onSelectShow={setSelectedShow} />

      <div className="relative z-10 -mt-6 pb-20">
        {/* Top Shows — real view counts */}
        {topShows.length >= 3 && (
          <TopShowsRow shows={topShows} onSelectShow={setSelectedShow} />
        )}

        {/* Admin-curated custom rows */}
        {customRows.map(row => (
          <CustomRow key={row.id} row={row} onSelectShow={setSelectedShow} />
        ))}

        {/* Personalized rows (only if user has watched shows with matching tags) */}
        {personalizedRows.map(row => (
          <ShowRow key={row.title} title={row.title} shows={row.shows} onSelectShow={setSelectedShow} />
        ))}

        {/* New This Week fallback */}
        {personalizedRows.length === 0 && customRows.length === 0 && (() => {
          const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          const newWeek = shows.filter(s => new Date(s.created_at) > oneWeekAgo).slice(0, 10)
          return newWeek.length > 0
            ? <ShowRow title="New This Week" shows={newWeek} onSelectShow={setSelectedShow} />
            : null
        })()}

        {!shows.length && (
          <div className="text-center py-32">
            <p className="font-bebas text-5xl text-gray-700 mb-2">Coming Soon</p>
            <p className="text-gray-600 text-sm">No shows yet.</p>
          </div>
        )}
      </div>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}

      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="font-bebas text-sf-red/40 text-2xl mb-1">SENATEFLIX</p>
        <p className="text-gray-700 text-xs">A satirical parody. Not affiliated with the Philippine Senate.</p>
      </footer>
    </div>
  )
}
