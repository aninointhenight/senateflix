import { useState, useEffect } from 'react'
import { supabase }            from '../lib/supabase'
import { cacheGet, cacheSet }  from '../lib/cache'
import Navbar                  from '../components/Navbar'
import ShowRow                 from '../components/ShowRow'
import ShowModal               from '../components/ShowModal'

const SHOWS_SELECT = 'id, title, type, year, category_id, youtube_id, thumbnail_horizontal, thumbnail_vertical, logo_url, tags, badge_override, view_count, season_count, episode_count, created_at, categories(id, name)'

export default function Series() {
  const [categories,   setCategories]   = useState([])
  const [shows,        setShows]        = useState([])
  const [selectedShow, setSelectedShow] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function fetchData() {
      const cachedAll  = cacheGet('shows_all')
      const cachedCats = cacheGet('categories')

      if (cachedAll && cachedCats) {
        setCategories(cachedCats)
        setShows(cachedAll.filter(s => s.type === 'series'))
        setLoading(false)
        return
      }

      const [catsRes, showsRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('shows').select(SHOWS_SELECT).eq('type', 'series').order('created_at', { ascending: false }),
      ])
      const cats  = catsRes.data  || []
      const shows = showsRes.data || []
      cacheSet('categories', cats)
      setCategories(cats)
      setShows(shows)
      setLoading(false)
    }
    fetchData()
  }, [])

  const showsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = shows.filter(s => s.category_id === cat.id)
    return acc
  }, {})
  const uncategorized = shows.filter(s => !s.category_id)

  if (loading) return (
    <div className="min-h-screen bg-sf-dark flex items-center justify-center">
      <p className="font-bebas text-sf-red text-5xl animate-pulse">SENATEFLIX</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-sf-dark">
      <Navbar />
      <div className="pt-24 pb-20">
        <h1 className="font-bebas text-5xl md:text-6xl text-white px-4 md:px-12 mb-6">Series</h1>
        {categories.map(cat => {
          const catShows = showsByCategory[cat.id] || []
          if (!catShows.length) return null
          return <ShowRow key={cat.id} title={cat.name} shows={catShows} onSelectShow={setSelectedShow} />
        })}
        {uncategorized.length > 0 && (
          <ShowRow title="Uncategorized" shows={uncategorized} onSelectShow={setSelectedShow} />
        )}
        {!shows.length && <p className="text-gray-600 text-center py-20 text-sm">No series yet.</p>}
      </div>
      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}
      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="text-gray-700 text-xs">Senateflix — A satirical parody.</p>
      </footer>
    </div>
  )
}
