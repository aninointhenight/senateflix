import { useState, useEffect } from 'react'
import { supabase }         from '../lib/supabase'
import Navbar               from '../components/Navbar'
import ShowCard             from '../components/ShowCard'
import ShowModal            from '../components/ShowModal'
import { getWatchHistory, getWatchProgress } from '../lib/utils'

export default function MyFlix() {
  const [continueShows, setContinueShows] = useState([])
  const [selectedShow,  setSelectedShow]  = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    const history = getWatchHistory() // array of show IDs, most recent first
    if (!history.length) { setLoading(false); return }

    const { data } = await supabase
      .from('shows')
      .select('*, categories(id, name), seasons(id, season_number, episodes(id))')
      .in('id', history)

    if (!data) { setLoading(false); return }

    // Reorder to match localStorage history order and augment with progress
    const shows = history
      .map(id => data.find(s => s.id === id))
      .filter(Boolean)
      .map(show => {
        if (show.type === 'series') {
          const progress = getWatchProgress(show.id)
          const label = progress
            ? `S${progress.season_number}E${progress.episode_number}`
            : 'Continue'
          return { ...show, _continueLabel: label }
        }
        return { ...show, _continueLabel: 'Watched' }
      })

    setContinueShows(shows)
    setLoading(false)
  }

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
      <div className="pt-24 pb-20 px-4 md:px-12">
        <h1 className="font-bebas text-5xl md:text-6xl text-white mb-2">My Flix</h1>
        <p className="text-gray-600 text-sm mb-8">Stored in this browser only.</p>

        {continueShows.length > 0 ? (
          <>
            <h2 className="text-white font-bold text-lg mb-4">Continue Watching</h2>
            <div className="flex flex-wrap gap-3">
              {continueShows.map(show => (
                <ShowCard
                  key={show.id}
                  show={show}
                  onSelect={setSelectedShow}
                  progressLabel={show._continueLabel}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <p className="font-bebas text-5xl text-gray-700 mb-3">Nothing Here Yet</p>
            <p className="text-gray-600 text-sm mb-6">Start watching shows and they'll appear here.</p>
            <a href="/" className="text-sf-red hover:underline text-sm">Browse Senateflix →</a>
          </div>
        )}
      </div>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => { setSelectedShow(null); loadHistory() }} />}

      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="text-gray-700 text-xs">Senateflix — A satirical parody.</p>
      </footer>
    </div>
  )
}
