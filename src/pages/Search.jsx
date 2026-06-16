import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase }        from '../lib/supabase'
import Navbar              from '../components/Navbar'
import ShowCard            from '../components/ShowCard'
import ShowModal           from '../components/ShowModal'

const SHOWS_SELECT = 'id, title, type, year, category_id, youtube_id, thumbnail_horizontal, thumbnail_vertical, logo_url, tags, badge_override, view_count, season_count, episode_count, created_at, categories(id, name)'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query,        setQuery]        = useState(searchParams.get('q') || '')
  const [results,      setResults]      = useState([])
  const [loading,      setLoading]      = useState(false)
  const [searched,     setSearched]     = useState(false)
  const [selectedShow, setSelectedShow] = useState(null)

  // Run search whenever URL query param changes
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    if (q.trim()) runSearch(q.trim())
    else { setResults([]); setSearched(false) }
  }, [searchParams])

  async function runSearch(q) {
    setLoading(true)
    setSearched(true)

    // Search by title (ilike = case-insensitive) OR matching tags
    const { data } = await supabase
      .from('shows')
      .select(SHOWS_SELECT)
      .or(`title.ilike.%${q}%,tags.cs.{${q}}`)
      .order('view_count', { ascending: false })
      .limit(40)

    setResults(data || [])
    setLoading(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchParams({ q: query.trim() })
  }

  const q = searchParams.get('q') || ''

  return (
    <div className="min-h-screen bg-sf-dark">
      <Navbar />

      <div className="pt-28 pb-20 px-4 md:px-12">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mb-10">
          <div className="flex items-center bg-[#1a1a1a] border border-gray-700 focus-within:border-gray-500 rounded-lg overflow-hidden transition-colors">
            <svg className="w-5 h-5 text-gray-500 ml-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search shows, series, tags..."
              className="flex-1 bg-transparent text-white text-base px-4 py-3.5 outline-none placeholder-gray-600"
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSearchParams({}); setResults([]); setSearched(false) }}
                className="text-gray-600 hover:text-white px-4 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button type="submit"
              className="bg-sf-red hover:bg-red-700 text-white font-bold text-sm px-6 py-3.5 transition-colors shrink-0">
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        {loading && (
          <p className="text-gray-600 text-sm animate-pulse">Searching...</p>
        )}

        {!loading && searched && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              {results.length > 0
                ? <>{results.length} result{results.length !== 1 ? 's' : ''} for <span className="text-white">"{q}"</span></>
                : <>No results for <span className="text-white">"{q}"</span></>
              }
            </p>

            {results.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {results.map(show => (
                  <ShowCard key={show.id} show={show} onSelect={setSelectedShow} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-bebas text-4xl text-gray-700 mb-2">No Results</p>
                <p className="text-gray-600 text-sm">Try a different title or tag.</p>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-20">
            <p className="font-bebas text-5xl text-gray-800 mb-2">Search Senateflix</p>
            <p className="text-gray-700 text-sm">Find shows by title or tag.</p>
          </div>
        )}
      </div>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}

      <footer className="border-t border-gray-800/50 py-8 text-center">
        <p className="text-gray-700 text-xs">Senateflix — A satirical parody.</p>
      </footer>
    </div>
  )
}
