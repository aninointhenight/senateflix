import { useState, useEffect } from 'react'
import { supabase }            from '../../lib/supabase'
import ShowForm                from './ShowForm'
import { getHorizontalThumbnail, getShowBadge, BADGE_CONFIG } from '../../lib/utils'

export default function ShowsManager() {
  const [shows,      setShows]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(null)   // show object being edited
  const [showForm,   setShowForm]   = useState(false)  // add-new form visible
  const [search,     setSearch]     = useState('')

  useEffect(() => { fetchShows() }, [])

  async function fetchShows() {
    setLoading(true)
    const { data } = await supabase
      .from('shows')
      .select('*, categories(id, name)')
      .order('created_at', { ascending: false })
    setShows(data || [])
    setLoading(false)
  }

  async function deleteShow(id) {
    if (!confirm('Delete this show? This cannot be undone.')) return
    await supabase.from('shows').delete().eq('id', id)
    fetchShows()
  }

  function onSaved() {
    setShowForm(false)
    setEditing(null)
    fetchShows()
  }

  const filtered = shows.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    s.categories?.name?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Form view ────────────────────────────────────────────────
  if (showForm || editing) {
    return (
      <div className="max-w-2xl">
        <ShowForm
          show={editing}
          onSaved={onSaved}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Shows</h1>
          <p className="text-gray-600 text-sm">{shows.length} total</p>
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, tag, category..."
            className="bg-[#1f1f1f] border border-gray-700 text-white rounded px-4 py-2 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600 w-64"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-sf-red hover:bg-red-700 text-white font-bold text-sm px-5 py-2 rounded transition-colors shrink-0"
          >
            <span className="text-lg leading-none">+</span>
            Add Show
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(show => {
            const badge    = getShowBadge(show)
            const badgeCfg = badge ? BADGE_CONFIG[badge] : null
            const thumb    = getHorizontalThumbnail(show)

            return (
              <div
                key={show.id}
                className="bg-[#1a1a1a] border border-gray-800/50 hover:border-gray-700 rounded-lg flex items-center gap-4 p-3 transition-colors"
              >
                {/* Thumb */}
                <img
                  src={thumb}
                  alt={show.title}
                  className="w-24 h-14 object-cover rounded bg-gray-800 shrink-0"
                  onError={e => { e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/hqdefault.jpg` }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-white font-semibold text-sm truncate">{show.title}</p>
                    {show.year && <span className="text-gray-600 text-xs">{show.year}</span>}
                    {show.is_featured && (
                      <span className="text-xs bg-sf-red/20 text-sf-red px-1.5 py-0.5 rounded">
                        Hero
                      </span>
                    )}
                    {badgeCfg && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
                        {badgeCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">
                    {[show.categories?.name, ...(show.tags?.slice(0, 3) || [])].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditing(show)}
                    className="text-gray-400 hover:text-white text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteShow(show.id)}
                    className="text-gray-400 hover:text-red-400 text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}

          {!filtered.length && (
            <p className="text-gray-600 text-sm text-center py-12">
              {search ? 'No shows match your search.' : 'No shows yet. Add your first one!'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
