import { useState, useEffect } from 'react'
import { supabase }       from '../lib/supabase'
import Navbar             from '../components/Navbar'
import HeroCarousel       from '../components/HeroCarousel'
import ShowRow            from '../components/ShowRow'
import TopShowsRow        from '../components/TopShowsRow'
import ShowModal          from '../components/ShowModal'

export default function Home() {
  const [categories,    setCategories]    = useState([])
  const [shows,         setShows]         = useState([])
  const [featuredShows, setFeaturedShows] = useState([])
  const [selectedShow,  setSelectedShow]  = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [catsRes, showsRes, featRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true }),

        // Include seasons(episodes) so cards can show season/episode counts
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
      setCategories(catsRes.data   || [])
      setShows(showsRes.data       || [])
      setFeaturedShows(featRes.data || [])
    } catch (e) {
      console.error('[Senateflix] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const showsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = shows.filter(s => s.category_id === cat.id)
    return acc
  }, {})

  const recentShows = shows.slice(0, 8)

  if (loading) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center">
        <p className="font-bebas text-sf-red text-6xl tracking-widest animate-pulse">SENATEFLIX</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sf-dark">
      <Navbar categories={categories} />

      <HeroCarousel featuredShows={featuredShows} onSelectShow={setSelectedShow} />

      <div className="relative z-10 -mt-6 pb-20">
        {shows.length >= 3 && (
          <TopShowsRow shows={shows} onSelectShow={setSelectedShow} />
        )}

        {recentShows.length > 0 && (
          <ShowRow title="Popular on Senateflix" shows={recentShows} onSelectShow={setSelectedShow} />
        )}

        {categories.map(cat => {
          const catShows = showsByCategory[cat.id] || []
          if (!catShows.length) return null
          return (
            <div key={cat.id} id={`row-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <ShowRow title={cat.name} shows={catShows} onSelectShow={setSelectedShow} />
            </div>
          )
        })}

        {!shows.length && (
          <div className="text-center py-32 px-4">
            <p className="font-bebas text-5xl text-gray-700 mb-2">Coming Soon</p>
            <p className="text-gray-600 text-sm">No shows yet. Log in as admin to add content.</p>
          </div>
        )}
      </div>

      {selectedShow && (
        <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />
      )}

      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="font-bebas text-sf-red/40 text-2xl mb-1">SENATEFLIX</p>
        <p className="text-gray-700 text-xs">
          A satirical parody. Not affiliated with the Philippine Senate or any broadcaster.
        </p>
      </footer>
    </div>
  )
}
