import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { extractYouTubeId, extractYouTubeTimestamp } from '../../lib/utils'

const EMPTY_SEASON  = { season_number: '', title: '', description: '' }
const EMPTY_EPISODE = {
  episode_number: '', title: '', youtube_id: '', youtube_start: '',
  air_date: '', description: '', thumbnail: '', fb_url: '',
}

const inp = 'w-full bg-[#1a1a1a] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

export default function SeriesManager({ showId }) {
  const [seasons,          setSeasons]          = useState([])
  const [loading,          setLoading]          = useState(true)
  const [expandedSeason,   setExpandedSeason]   = useState(null)

  // Season form
  const [addingSeason,   setAddingSeason]   = useState(false)
  const [editingSeason,  setEditingSeason]  = useState(null) // season object
  const [seasonForm,     setSeasonForm]     = useState(EMPTY_SEASON)
  const [savingSeason,   setSavingSeason]   = useState(false)

  // Episode form
  const [addingEpTo,   setAddingEpTo]   = useState(null)   // season_id
  const [editingEp,    setEditingEp]    = useState(null)   // episode object
  const [epForm,       setEpForm]       = useState(EMPTY_EPISODE)
  const [savingEp,     setSavingEp]     = useState(false)

  useEffect(() => { fetchSeasons() }, [showId])

  async function fetchSeasons() {
    setLoading(true)
    const { data } = await supabase
      .from('seasons')
      .select('*, episodes(*)')
      .eq('show_id', showId)
      .order('season_number', { ascending: true })

    const sorted = (data || []).map(s => ({
      ...s,
      episodes: [...(s.episodes || [])].sort((a, b) => a.episode_number - b.episode_number),
    }))
    setSeasons(sorted)

    if (sorted.length > 0 && expandedSeason === null) setExpandedSeason(sorted[0].id)
    setLoading(false)
  }

  // ── Season CRUD ───────────────────────────────────────────
  function startAddSeason() {
    const nextNum = (seasons.length > 0 ? Math.max(...seasons.map(s => s.season_number)) : 0) + 1
    setSeasonForm({ ...EMPTY_SEASON, season_number: nextNum })
    setAddingSeason(true)
    setEditingSeason(null)
  }

  function startEditSeason(season) {
    setSeasonForm({ season_number: season.season_number, title: season.title || '', description: season.description || '' })
    setEditingSeason(season)
    setAddingSeason(false)
  }

  async function saveSeason(e) {
    e.preventDefault()
    setSavingSeason(true)
    const payload = {
      show_id:       showId,
      season_number: parseInt(seasonForm.season_number),
      title:         seasonForm.title.trim() || null,
      description:   seasonForm.description.trim() || null,
    }
    if (editingSeason) {
      await supabase.from('seasons').update(payload).eq('id', editingSeason.id)
    } else {
      await supabase.from('seasons').insert(payload)
    }
    setAddingSeason(false)
    setEditingSeason(null)
    fetchSeasons()
    setSavingSeason(false)
  }

  async function deleteSeason(id) {
    if (!confirm('Delete this season AND all its episodes? This cannot be undone.')) return
    await supabase.from('seasons').delete().eq('id', id)
    fetchSeasons()
  }

  // ── Episode CRUD ──────────────────────────────────────────
  function startAddEpisode(seasonId) {
    const season    = seasons.find(s => s.id === seasonId)
    const nextNum   = season?.episodes.length > 0
      ? Math.max(...season.episodes.map(e => e.episode_number)) + 1
      : 1
    setEpForm({ ...EMPTY_EPISODE, episode_number: nextNum })
    setAddingEpTo(seasonId)
    setEditingEp(null)
  }

  function startEditEpisode(episode) {
    setEpForm({
      episode_number: episode.episode_number,
      title:          episode.title,
      youtube_id:     episode.youtube_id,
      youtube_start:  episode.youtube_start || '',
      air_date:       episode.air_date       || '',
      description:    episode.description    || '',
      thumbnail:      episode.thumbnail      || '',
    })
    setEditingEp(episode)
    setAddingEpTo(null)
  }

  function setEpField(key, value) {
    setEpForm(f => ({ ...f, [key]: value }))
    if (key === 'youtube_id') {
      const ts = extractYouTubeTimestamp(value)
      if (ts !== null) setEpForm(f => ({ ...f, youtube_id: value, youtube_start: String(ts) }))
    }
  }

  async function saveEpisode(e, seasonId) {
    e.preventDefault()
    setSavingEp(true)
    const ytId = extractYouTubeId(epForm.youtube_id)
    const payload = {
      season_id:      seasonId,
      episode_number: parseInt(epForm.episode_number),
      title:          epForm.title.trim(),
      youtube_id:     ytId,
      youtube_start:  epForm.youtube_start !== '' ? parseInt(epForm.youtube_start) || null : null,
      air_date:       epForm.air_date  || null,
      description:    epForm.description.trim() || null,
      thumbnail:      epForm.thumbnail.trim()   || null,
	  fb_url: 		epForm.fb_url?.trim() 		|| null,
    }
    if (editingEp) {
      await supabase.from('episodes').update(payload).eq('id', editingEp.id)
    } else {
      await supabase.from('episodes').insert(payload)
    }
    setAddingEpTo(null)
    setEditingEp(null)
    fetchSeasons()
    setSavingEp(false)
  }

  async function deleteEpisode(id) {
    if (!confirm('Delete this episode?')) return
    await supabase.from('episodes').delete().eq('id', id)
    fetchSeasons()
  }

  function cancelEpForm() { setAddingEpTo(null); setEditingEp(null) }
  function cancelSeasonForm() { setAddingSeason(false); setEditingSeason(null) }

  // ── Render ────────────────────────────────────────────────
  if (loading) return <p className="text-gray-600 text-sm py-4">Loading seasons...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Seasons & Episodes</h3>
        <button
          onClick={startAddSeason}
          className="text-sm bg-[#2a2a2a] hover:bg-[#333] text-gray-300 hover:text-white px-4 py-2 rounded transition-colors flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add Season
        </button>
      </div>

      {/* Add/Edit season form */}
      {(addingSeason || editingSeason) && (
        <form onSubmit={saveSeason} className="bg-[#1a1a1a] border border-gray-700/50 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-white text-sm font-semibold">{editingSeason ? 'Edit Season' : 'New Season'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Season Number *">
              <input required type="number" min="1" value={seasonForm.season_number}
                onChange={e => setSeasonForm(f => ({ ...f, season_number: e.target.value }))}
                className={inp} />
            </Field>
            <Field label="Season Title">
              <input value={seasonForm.title}
                onChange={e => setSeasonForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. House of Representatives" className={inp} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={seasonForm.description} rows={2}
              onChange={e => setSeasonForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional season description..." className={`${inp} resize-none`} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" disabled={savingSeason}
              className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded transition-colors">
              {savingSeason ? 'Saving...' : (editingSeason ? 'Save' : 'Add Season')}
            </button>
            <button type="button" onClick={cancelSeasonForm}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Seasons list */}
      {seasons.length === 0 && !addingSeason && (
        <p className="text-gray-600 text-sm text-center py-6 border border-dashed border-gray-800 rounded-lg">
          No seasons yet. Add one above.
        </p>
      )}

      {seasons.map(season => {
        const isExpanded = expandedSeason === season.id
        const isEditingThis = editingSeason?.id === season.id
        return (
          <div key={season.id} className="border border-gray-800/60 rounded-lg mb-3 overflow-hidden">
            {/* Season header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a]">
              <button
                onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white text-sm font-semibold">
                  Season {season.season_number}{season.title ? `: ${season.title}` : ''}
                </span>
                <span className="text-gray-600 text-xs">{season.episodes.length} ep{season.episodes.length !== 1 ? 's' : ''}</span>
              </button>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEditSeason(season)}
                  className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                <button onClick={() => deleteSeason(season.id)}
                  className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
              </div>
            </div>

            {/* Episodes */}
            {isExpanded && (
              <div className="divide-y divide-gray-800/40">
                {season.episodes.map(ep => {
                  const isEditingEp = editingEp?.id === ep.id
                  return (
                    <div key={ep.id}>
                      {isEditingEp ? (
                        <EpisodeForm
                          form={epForm}
                          setField={setEpField}
                          onSave={(e) => saveEpisode(e, season.id)}
                          onCancel={cancelEpForm}
                          saving={savingEp}
                          isEditing
                        />
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors">
                          <span className="text-gray-600 text-xs font-mono mt-0.5 shrink-0 w-6 text-right">
                            {ep.episode_number}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{ep.title}</p>
                            <p className="text-gray-600 text-xs">
                              {ep.air_date && new Date(ep.air_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {ep.air_date && ep.youtube_start ? ' · ' : ''}
                              {ep.youtube_start ? `starts ${ep.youtube_start}s` : ''}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => startEditEpisode(ep)}
                              className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                            <button onClick={() => deleteEpisode(ep.id)}
                              className="text-gray-500 hover:text-red-400 text-xs transition-colors">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add episode inline form */}
                {addingEpTo === season.id ? (
                  <EpisodeForm
                    form={epForm}
                    setField={setEpField}
                    onSave={(e) => saveEpisode(e, season.id)}
                    onCancel={cancelEpForm}
                    saving={savingEp}
                    isEditing={false}
                  />
                ) : (
                  <div className="px-4 py-2">
                    <button
                      onClick={() => startAddEpisode(season.id)}
                      className="text-gray-500 hover:text-white text-xs transition-colors flex items-center gap-1"
                    >
                      <span className="text-base leading-none">+</span> Add Episode
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Reusable episode form ─────────────────────────────────────
function EpisodeForm({ form, setField, onSave, onCancel, saving, isEditing }) {
  const inp = 'w-full bg-[#141414] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600'

  return (
    <form onSubmit={onSave} className="px-4 py-4 bg-[#181818] space-y-3 border-t border-gray-700/50">
      <p className="text-white text-sm font-semibold">{isEditing ? 'Edit Episode' : 'New Episode'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Episode # *</label>
          <input required type="number" min="1" value={form.episode_number}
            onChange={e => setField('episode_number', e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Air Date</label>
          <input type="date" value={form.air_date}
            onChange={e => setField('air_date', e.target.value)} className={inp} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Title *</label>
        <input required value={form.title} onChange={e => setField('title', e.target.value)}
          placeholder="Episode title" className={inp} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">YouTube URL or ID *</label>
          <input required value={form.youtube_id} onChange={e => setField('youtube_id', e.target.value)}
            placeholder="URL or ID — timestamp auto-fills" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Start (seconds)</label>
          <input type="number" min="0" value={form.youtube_start}
            onChange={e => setField('youtube_start', e.target.value)}
            placeholder="Auto from URL" className={inp} />
        </div>
      </div>
	  
		<div>
		  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
			Facebook Video URL (optional)
		  </label>
		  <input type="url" value={form.fb_url || ''}
			onChange={e => setField('fb_url', e.target.value)}
			placeholder="https://www.facebook.com/watch?v=..."
			className={inp} />
		</div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description</label>
        <textarea value={form.description} rows={2}
          onChange={e => setField('description', e.target.value)}
          placeholder="Episode description..." className={`${inp} resize-none`} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Custom Thumbnail URL</label>
        <input type="url" value={form.thumbnail} onChange={e => setField('thumbnail', e.target.value)}
          placeholder="https://... (leave blank to use YouTube auto-thumb)" className={inp} />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded transition-colors">
          {saving ? 'Saving...' : (isEditing ? 'Save Episode' : 'Add Episode')}
        </button>
        <button type="button" onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
