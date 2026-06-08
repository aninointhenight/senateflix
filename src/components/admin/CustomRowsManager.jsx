import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getPosterThumbnail } from '../../lib/utils'

const inp = 'w-full bg-[#1f1f1f] border border-gray-700 text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600'

export default function CustomRowsManager() {
  const [rows,        setRows]        = useState([])
  const [allShows,    setAllShows]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editingRow,  setEditingRow]  = useState(null) // null = list view, row obj = editing
  const [isAdding,    setIsAdding]    = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [rowsRes, showsRes] = await Promise.all([
      supabase.from('custom_rows')
        .select('*, custom_row_shows(id, display_order, show_id, shows(id, title, youtube_id, thumbnail_vertical, season_count, episode_count, type, badge_override, created_at))')
        .order('display_order'),
      supabase.from('shows')
        .select('id, title, type, youtube_id, thumbnail_vertical, season_count, episode_count, badge_override, created_at, categories(name)')
        .order('title'),
    ])
    setRows(rowsRes.data || [])
    setAllShows(showsRes.data || [])
    setLoading(false)
  }

  async function deleteRow(id) {
    if (!confirm('Delete this collection row?')) return
    await supabase.from('custom_rows').delete().eq('id', id)
    fetchAll()
  }

  async function toggleActive(row) {
    await supabase.from('custom_rows').update({ active: !row.active }).eq('id', row.id)
    fetchAll()
  }

  if (loading) return <p className="text-gray-600 text-sm">Loading...</p>

  if (editingRow || isAdding) {
    return (
      <RowEditor
        row={editingRow}
        allShows={allShows}
        onSaved={() => { setEditingRow(null); setIsAdding(false); fetchAll() }}
        onCancel={() => { setEditingRow(null); setIsAdding(false) }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Custom Rows</h1>
          <p className="text-gray-600 text-sm">Admin-curated collections shown on the home page.</p>
        </div>
        <button onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-sf-red hover:bg-red-700 text-white font-bold text-sm px-5 py-2 rounded transition-colors">
          <span className="text-lg leading-none">+</span> New Row
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-lg py-12 text-center">
          <p className="text-gray-600 text-sm">No custom rows yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => {
            const showCount = row.custom_row_shows?.length || 0
            return (
              <div key={row.id}
                className="bg-[#1a1a1a] border border-gray-800/50 rounded-lg p-4 flex items-center gap-4">
                {/* Poster preview */}
                <div className="w-10 h-14 rounded overflow-hidden bg-[#2a2a2a] shrink-0">
                  {row.poster_url
                    ? <img src={row.poster_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs text-center px-1 font-bebas leading-tight">{row.title}</span>
                      </div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{row.title}</p>
                  <p className="text-gray-600 text-xs">{showCount} show{showCount !== 1 ? 's' : ''}</p>
                </div>

                {/* Active toggle */}
                <button onClick={() => toggleActive(row)}
                  className={`text-xs px-3 py-1 rounded transition-colors shrink-0 ${
                    row.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                  {row.active ? 'Active' : 'Hidden'}
                </button>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingRow(row)}
                    className="text-gray-400 hover:text-white text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteRow(row.id)}
                    className="text-gray-400 hover:text-red-400 text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Row editor ────────────────────────────────────────────────
function RowEditor({ row, allShows, onSaved, onCancel }) {
  const [title,      setTitle]      = useState(row?.title      || '')
  const [posterUrl,  setPosterUrl]  = useState(row?.poster_url || '')
  const [active,     setActive]     = useState(row?.active     ?? true)
  const [rowShows,   setRowShows]   = useState(
    (row?.custom_row_shows || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(crs => crs.shows)
      .filter(Boolean)
  )
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const isEditing = !!row

  const rowShowIds = new Set(rowShows.map(s => s.id))
  const available  = allShows.filter(s => !rowShowIds.has(s.id) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) || !search))

  function addShow(show) {
    setRowShows(prev => [...prev, show])
  }
  function removeShow(id) {
    setRowShows(prev => prev.filter(s => s.id !== id))
  }
  function moveUp(idx) {
    if (idx === 0) return
    setRowShows(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a })
  }
  function moveDown(idx) {
    setRowShows(prev => {
      if (idx >= prev.length - 1) return prev
      const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a
    })
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)

    let rowId = row?.id
    if (isEditing) {
      await supabase.from('custom_rows').update({ title: title.trim(), poster_url: posterUrl.trim() || null, active }).eq('id', rowId)
    } else {
      const { data } = await supabase.from('custom_rows').insert({ title: title.trim(), poster_url: posterUrl.trim() || null, active }).select().single()
      rowId = data?.id
    }

    if (rowId) {
      // Replace all row shows
      await supabase.from('custom_row_shows').delete().eq('row_id', rowId)
      if (rowShows.length > 0) {
        await supabase.from('custom_row_shows').insert(
          rowShows.map((s, i) => ({ row_id: rowId, show_id: s.id, display_order: i }))
        )
      }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white text-xl font-bold">{isEditing ? 'Edit Row' : 'New Row'}</h2>
      </div>

      {/* Row details */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Row Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Cayetano vs Gatchalian" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Collection Poster URL</label>
          <input type="url" value={posterUrl} onChange={e => setPosterUrl(e.target.value)}
            placeholder="https://... (optional, shows as first tile)" className={inp} />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setActive(a => !a)}
            className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-sf-red' : 'bg-gray-700'}`}>
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
          <span className="text-gray-300 text-sm">Show on home page</span>
        </div>
      </div>

      {/* Shows in this row */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Shows in this row ({rowShows.length})
        </p>
        {rowShows.length === 0 ? (
          <p className="text-gray-700 text-sm py-4 text-center border border-dashed border-gray-800 rounded-lg">
            No shows added yet. Add from the list below.
          </p>
        ) : (
          <div className="space-y-1.5">
            {rowShows.map((show, idx) => (
              <div key={show.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg px-3 py-2">
                <div className="flex flex-col gap-0 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}
                    className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === rowShows.length - 1}
                    className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <img
                  src={getPosterThumbnail(show)}
                  alt={show.title}
                  className="w-8 h-12 object-cover rounded shrink-0 bg-gray-800"
                  onError={e => { if (show.youtube_id) e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg` }}
                />
                <span className="flex-1 text-white text-sm truncate">{show.title}</span>
                <button onClick={() => removeShow(show.id)}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add shows */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Add Shows</p>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search shows..." className={`${inp} mb-3`} />
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {available.slice(0, 20).map(show => (
            <div key={show.id} className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] rounded-lg px-3 py-2 transition-colors">
              <img
                src={getPosterThumbnail(show)}
                alt={show.title}
                className="w-8 h-12 object-cover rounded shrink-0 bg-gray-800"
                onError={e => { if (show.youtube_id) e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{show.title}</p>
                <p className="text-gray-600 text-xs">{show.categories?.name || '—'}</p>
              </div>
              <button onClick={() => addShow(show)}
                className="text-gray-400 hover:text-white text-xs bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition-colors shrink-0">
                + Add
              </button>
            </div>
          ))}
          {available.length === 0 && (
            <p className="text-gray-700 text-sm text-center py-4">No shows available.</p>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 pt-2 border-t border-gray-800">
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded transition-colors">
          {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Row')}
        </button>
        <button onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
