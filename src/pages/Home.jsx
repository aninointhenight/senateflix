import { useState, useEffect, useMemo } from 'react'
import { supabase }        from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import Navbar              from '../components/Navbar'
import HeroCarousel        from '../components/HeroCarousel'
import ShowRow             from '../components/ShowRow'
import TopShowsRow         from '../components/TopShowsRow'
import ShowModal           from '../components/ShowModal'
import { getWatchHistory } from '../lib/utils'

const WEEKLY_THEMES = [
  'Senate Sundays', 'Monday Mayhem', 'Testimony Tuesdays',
  'Walkout Wednesday', 'Throwback Thursday', 'Fiery Friday', 'Scandal Saturday',
]

// Slim select — NO nested seasons/episodes join
// season_count and episode_count come from denormalized columns
const SHOWS_SELECT = 'id, title, type, year, category_id, youtube_id, thumbnail_horizontal, thumbnail_vertical, logo_url, tags, badge_override, is_featured, featured_order, view_count, season_count, episode_count, created_at, categories(id, name)'

export default function Home() {
  const [shows,         setShows]         = useState([])
  const [featuredShows, setFeaturedShows] = useState([])
  const [selectedShow,  setSelectedShow]  = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)

    try {
      // Try cache first — avoids Supabase round-trip on repeat visits
      const cachedShows    = cacheGet('shows_all')
      const cachedFeatured = cacheGet('shows_featured')

      if (cachedShows && cachedFeatured) {
        setShows(cachedShows)
        setFeaturedShows(cachedFeatured)
        setLoading(false)
        return
      }

      const [showsRes, featRes] = await Promise.all([
        supabase.from('shows').select(SHOWS_SELECT).order('created_at', { ascending: false }),
        supabase.from('shows').select(SHOWS_SELECT).eq('is_featured', true).order('featured_order').limit(7),
      ])

      if (showsRes.error) throw showsRes.error

      const allShows      = showsRes.data || []
      const featuredData  = featRes.data  || []

      cacheSet('shows_all',      allShows)
      cacheSet('shows_featured', featuredData)

      setShows(allShows)
      setFeaturedShows(featuredData)
    } catch (e) {
      console.error('[Senateflix]', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const topShows = useMemo(
    () => [...shows].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)),
    [shows]
  )

  const { personalizedRows, themedShows, newThisWeek } = useMemo(() => {
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

      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      let themed = shows.filter(s => !usedIds.has(s.id) && new Date(s.created_at) > twoWeeksAgo).slice(0, 10)
      if (themed.length < 3) themed = shows.filter(s => !usedIds.has(s.id)).slice(0, 10)
      themed.forEach(s => usedIds.add(s.id))

      const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const newWeek = shows.filter(s => !usedIds.has(s.id) && new Date(s.created_at) > oneWeekAgo).slice(0, 10)

      return { personalizedRows: rows, themedShows: themed, newThisWeek: newWeek }
    } catch {
      return { personalizedRows: [], themedShows: shows.slice(0, 10), newThisWeek: [] }
    }
  }, [shows])

  const weeklyTitle = WEEKLY_THEMES[new Date().getDay()]

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
        {topShows.length >= 3 && <TopShowsRow shows={topShows} onSelectShow={setSelectedShow} />}
        {personalizedRows.map(row => (
          <ShowRow key={row.title} title={row.title} shows={row.shows} onSelectShow={setSelectedShow} />
        ))}
        {themedShows.length > 0 && (
          <ShowRow title={weeklyTitle} shows={themedShows} onSelectShow={setSelectedShow} />
        )}
        {newThisWeek.length > 0 && (
          <ShowRow title="New This Week" shows={newThisWeek} onSelectShow={setSelectedShow} />
        )}
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
