import { useState, useEffect } from 'react'
import { supabase }   from '../lib/supabase'
import Navbar         from '../components/Navbar'
import ShowRow        from '../components/ShowRow'
import ShowModal      from '../components/ShowModal'

export default function Series() {
  const [categories,   setCategories]   = useState([])
  const [shows,        setShows]        = useState([])
  const [selectedShow, setSelectedShow] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase
        .from('shows')
        .select('*, categories(id, name), seasons(id, season_number, episodes(id))')
        .eq('type', 'series')
        .order('created_at', { ascending: false }),
    ]).then(([catsRes, showsRes]) => {
      setCategories(catsRes.data || [])
      setShows(showsRes.data || [])
      setLoading(false)
    })
  }, [])

  const showsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = shows.filter(s => s.category_id === cat.id)
    return acc
  }, {})
  const uncategorized = shows.filter(s => !s.category_id)

  if (loading) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center">
        <p className="font-bebas text-sf-red text-5xl animate-pulse">SENATEFLIX</p>
      </div>
    )
  }

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

        {!shows.length && (
          <p className="text-gray-600 text-center py-20 text-sm">No series yet.</p>
        )}
      </div>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}

      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="text-gray-700 text-xs">Senateflix — A satirical parody.</p>
      </footer>
    </div>
  )
}
