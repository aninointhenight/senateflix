import { useState, useEffect, useMemo } from 'react'
import { supabase }      from '../lib/supabase'
import Navbar            from '../components/Navbar'
import HeroCarousel      from '../components/HeroCarousel'
import ShowRow           from '../components/ShowRow'
import TopShowsRow       from '../components/TopShowsRow'
import ShowModal         from '../components/ShowModal'
import { getWatchHistory } from '../lib/utils'

const WEEKLY_THEMES = [
  'Senate Sundays', 'Monday Mayhem', 'Testimony Tuesdays',
  'Walkout Wednesday', 'Throwback Thursday', 'Fiery Friday', 'Scandal Saturday',
]

export default function Home() {
  const [shows,         setShows]         = useState([])
  const [featuredShows, setFeaturedShows] = useState([])
  const [selectedShow,  setSelectedShow]  = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [showsRes, featRes] = await Promise.all([
        supabase
          .from('shows')
          .select('*, categories(id, name), seasons(id, season_number, episodes(id))')
          .order('created_at', { ascending: false }),
        supabase
          .from('shows')
          .select('*, categories(id, name), seasons(id, season_number, episodes(id))')
          .eq('is_featured', true)
          .order('featured_order', { ascending: true })
          .limit(7),
      ])
      setShows(showsRes.data || [])
      setFeaturedShows(featRes.data || [])
    } catch (e) {
      console.error('[Senateflix]', e)
    } finally {
      setLoading(false)
    }
  }

  // Top Shows sorted by view_count (real views, updated live)
  const topShows = useMemo(
    () => [...shows].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)),
    [shows]
  )

  // Personalized rows based on watch history
  const { personalizedRows, themedShows, newThisWeek } = useMemo(() => {
    const history    = getWatchHistory()
    const watchedSet = new Set(history)
    const watchedShows = shows.filter(s => watchedSet.has(s.id))
    const allUnwatched = shows.filter(s => !watchedSet.has(s.id))
    const usedIds    = new Set()
    const rows       = []

    // "Since you watched X" — up to 2 watched shows with matching tags
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

    // Themed row (day-based fun name) — recently added shows or fallback
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    let themed = shows.filter(s => !usedIds.has(s.id) && new Date(s.created_at) > twoWeeksAgo).slice(0, 10)
    if (themed.length < 3) themed = shows.filter(s => !usedIds.has(s.id)).slice(0, 10)
    themed.forEach(s => usedIds.add(s.id))

    // New This Week
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newWeek = shows.filter(s => !usedIds.has(s.id) && new Date(s.created_at) > oneWeekAgo).slice(0, 10)

    return { personalizedRows: rows, themedShows: themed, newThisWeek: newWeek }
  }, [shows])

  const weeklyTitle = WEEKLY_THEMES[new Date().getDay()]

  if (loading) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center">
        <p className="font-bebas text-sf-red text-6xl tracking-widest animate-pulse">SENATEFLIX</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sf-dark">
      <Navbar />

      <HeroCarousel featuredShows={featuredShows} onSelectShow={setSelectedShow} />

      <div className="relative z-10 -mt-6 pb-20">

        {/* Top Shows — sorted by real view counts */}
        {topShows.length >= 3 && (
          <TopShowsRow shows={topShows} onSelectShow={setSelectedShow} />
        )}

        {/* Personalized rows (only if user has watched something with matching tags) */}
        {personalizedRows.map(row => (
          <ShowRow key={row.title} title={row.title} shows={row.shows} onSelectShow={setSelectedShow} />
        ))}

        {/* Weekly themed row */}
        {themedShows.length > 0 && (
          <ShowRow title={weeklyTitle} shows={themedShows} onSelectShow={setSelectedShow} />
        )}

        {/* New This Week */}
        {newThisWeek.length > 0 && (
          <ShowRow title="New This Week" shows={newThisWeek} onSelectShow={setSelectedShow} />
        )}

        {/* Empty state */}
        {!shows.length && (
          <div className="text-center py-32">
            <p className="font-bebas text-5xl text-gray-700 mb-2">Coming Soon</p>
            <p className="text-gray-600 text-sm">No shows yet. Log in as admin to add content.</p>
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
