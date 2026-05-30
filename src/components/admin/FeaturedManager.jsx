import { useState, useEffect } from 'react'
import { supabase }            from '../../lib/supabase'
import { getHorizontalThumbnail } from '../../lib/utils'

export default function FeaturedManager() {
  const [featured,    setFeatured]    = useState([])
  const [available,   setAvailable]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [busy,        setBusy]        = useState(null) // id of show being toggled

  useEffect(() => { fetchShows() }, [])

  async function fetchShows() {
    setLoading(true)
    const { data } = await supabase
      .from('shows')
      .select('*, categories(name)')
      .order('featured_order', { ascending: true })
    const all = data || []
    setFeatured(all.filter(s => s.is_featured).sort((a, b) => a.featured_order - b.featured_order))
    setAvailable(all.filter(s => !s.is_featured))
    setLoading(false)
  }

  async function addToFeatured(show) {
    if (featured.length >= 7) { alert('Max 7 featured shows.'); return }
    setBusy(show.id)
    const maxOrder = featured.reduce((m, s) => Math.max(m, s.featured_order || 0), 0)
    await supabase.from('shows').update({ is_featured: true, featured_order: maxOrder + 1 }).eq('id', show.id)
    fetchShows()
    setBusy(null)
  }

  async function removeFromFeatured(show) {
    setBusy(show.id)
    await supabase.from('shows').update({ is_featured: false, featured_order: 0 }).eq('id', show.id)
    fetchShows()
    setBusy(null)
  }

  async function moveUp(idx) {
    if (idx === 0) return
    const a = featured[idx], b = featured[idx - 1]
    await Promise.all([
      supabase.from('shows').update({ featured_order: b.featured_order }).eq('id', a.id),
      supabase.from('shows').update({ featured_order: a.featured_order }).eq('id', b.id),
    ])
    fetchShows()
  }

  async function moveDown(idx) {
    if (idx === featured.length - 1) return
    const a = featured[idx], b = featured[idx + 1]
    await Promise.all([
      supabase.from('shows').update({ featured_order: b.featured_order }).eq('id', a.id),
      supabase.from('shows').update({ featured_order: a.featured_order }).eq('id', b.id),
    ])
    fetchShows()
  }

  // ── Shared row component ──────────────────────────────────────
  function ShowItem({ show, rank, onAdd, onRemove, onUp, onDown, totalFeatured }) {
    const thumb = getHorizontalThumbnail(show)
    const isBusy = busy === show.id

    return (
      <div className="bg-[#1a1a1a] border border-gray-800/50 rounded-lg flex items-center gap-3 p-3">
        {/* Rank */}
        {rank !== undefined && (
          <span className="font-bebas text-sf-red text-2xl w-5 text-center shrink-0">{rank}</span>
        )}

        {/* Thumbnail */}
        <img
          src={thumb}
          alt={show.title}
          className="w-20 h-12 object-cover rounded bg-gray-800 shrink-0"
          onError={e => { e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/hqdefault.jpg` }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{show.title}</p>
          {show.categories?.name && (
            <p className="text-gray-600 text-xs">{show.categories.name}</p>
          )}
        </div>

        {/* Reorder (featured only) */}
        {onUp && onDown && (
          <div className="flex flex-col gap-0 shrink-0">
            <button onClick={onUp}   className="text-gray-600 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
            </button>
            <button onClick={onDown} className="text-gray-600 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        )}

        {/* Add/Remove button */}
        {onRemove && (
          <button
            onClick={() => onRemove(show)}
            disabled={isBusy}
            className="text-gray-500 hover:text-red-400 text-xs transition-colors shrink-0 disabled:opacity-40"
          >
            {isBusy ? '...' : 'Remove'}
          </button>
        )}
        {onAdd && (
          <button
            onClick={() => onAdd(show)}
            disabled={isBusy || totalFeatured >= 7}
            className="text-gray-400 hover:text-white text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors shrink-0 disabled:opacity-40"
          >
            {isBusy ? '...' : '+ Feature'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Hero Carousel</h1>
        <p className="text-gray-600 text-sm">
          {featured.length}/7 shows featured. These rotate in the hero banner on the home page.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Currently Featured ────────────────────────── */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sf-red inline-block" />
              Currently Featured ({featured.length}/7)
            </h2>
            <div className="space-y-2 min-h-20">
              {featured.length === 0 ? (
                <div className="border border-dashed border-gray-800 rounded-lg py-8 text-center text-gray-700 text-sm">
                  No featured shows yet.
                </div>
              ) : (
                featured.map((show, idx) => (
                  <ShowItem
                    key={show.id}
                    show={show}
                    rank={idx + 1}
                    onRemove={removeFromFeatured}
                    onUp={() => moveUp(idx)}
                    onDown={() => moveDown(idx)}
                    totalFeatured={featured.length}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Available Shows ───────────────────────────── */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
              Available Shows
            </h2>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {available.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-6">All shows are already featured.</p>
              ) : (
                available.map(show => (
                  <ShowItem
                    key={show.id}
                    show={show}
                    onAdd={addToFeatured}
                    totalFeatured={featured.length}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
