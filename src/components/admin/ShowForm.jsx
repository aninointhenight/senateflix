import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BADGE_OPTIONS, extractYouTubeId, extractYouTubeTimestamp } from '../../lib/utils'
import SeriesManager from './SeriesManager'

const EMPTY = {
  type:                 'film',
  title:                '',
  tagline:              '',
  description:          '',
  year:                 new Date().getFullYear(),
  category_id:          '',
  youtube_id:           '',
  youtube_start:        '',
  logo_url:             '',
  thumbnail_horizontal: '',
  thumbnail_vertical:   '',
  tags:                 '',
  badge_override:       '',
  is_featured:          false,
  featured_order:       0,
}

const inp = 'w-full bg-[#1f1f1f] border border-gray-700 text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-sf-red' : 'bg-gray-700'}`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
      />
    </button>
  )
}

export default function ShowForm({ show, onSaved, onCancel }) {
  const [categories, setCategories] = useState([])
  const [form,       setForm]       = useState(EMPTY)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [ytPreview,  setYtPreview]  = useState('')
  const isEditing = !!show

  useEffect(() => {
    supabase.from('categories').select('*').order('display_order').then(({ data }) => {
      setCategories(data || [])
    })
    if (show) {
      setForm({
        type:                 show.type                 || 'film',
        title:                show.title                || '',
        tagline:              show.tagline              || '',
        description:          show.description          || '',
        year:                 show.year                 || new Date().getFullYear(),
        category_id:          show.category_id          || '',
        youtube_id:           show.youtube_id           || '',
        youtube_start:        show.youtube_start        || '',
        logo_url:             show.logo_url             || '',
        thumbnail_horizontal: show.thumbnail_horizontal || '',
        thumbnail_vertical:   show.thumbnail_vertical   || '',
        tags:                 (show.tags || []).join(', '),
        badge_override:       show.badge_override       || '',
        is_featured:          show.is_featured          || false,
        featured_order:       show.featured_order       || 0,
      })
      setYtPreview(show.youtube_id || '')
    }
  }, [show])

  function set(key, value) { setForm(f => ({ ...f, [key]: value })) }

  function handleYouTubeInput(value) {
    set('youtube_id', value)
    const id = extractYouTubeId(value)
    const ts = extractYouTubeTimestamp(value)
    setYtPreview(id)
    if (ts !== null) set('youtube_start', String(ts))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // For series, youtube_id is optional (episodes carry the videos)
    const ytId = extractYouTubeId(form.youtube_id)
    if (form.type === 'film' && !ytId) {
      setError('Film requires a YouTube URL or ID.')
      setLoading(false)
      return
    }

    const startSecs = form.youtube_start !== '' ? parseInt(form.youtube_start) || null : null

    const payload = {
      type:                 form.type,
      title:                form.title.trim(),
      tagline:              form.tagline.trim()              || null,
      description:          form.description.trim()          || null,
      year:                 form.year ? parseInt(form.year)  : null,
      category_id:          form.category_id                 || null,
      youtube_id:           ytId || null,
      youtube_start:        startSecs,
      logo_url:             form.logo_url.trim()             || null,
      thumbnail_horizontal: form.thumbnail_horizontal.trim() || null,
      thumbnail_vertical:   form.thumbnail_vertical.trim()   || null,
      tags:                 form.tags.split(',').map(t => t.trim()).filter(Boolean),
      badge_override:       form.badge_override              || null,
      is_featured:          form.is_featured,
      featured_order:       form.is_featured ? parseInt(form.featured_order) || 0 : 0,
      updated_at:           new Date().toISOString(),
    }

    const { error: dbErr } = isEditing
      ? await supabase.from('shows').update(payload).eq('id', show.id)
      : await supabase.from('shows').insert(payload)

    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onSaved()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-white text-xl font-bold">{isEditing ? 'Edit Show' : 'Add New Show'}</h2>

        {error && (
          <div className="bg-sf-red/10 border border-sf-red/40 text-red-400 text-sm rounded p-3">{error}</div>
        )}

        {/* ── Type selector ────────────────────────────────── */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Type</label>
          <div className="flex gap-2">
            {['film', 'series'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-colors ${
                  form.type === t ? 'bg-sf-red text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                }`}
              >
                {t === 'film' ? '🎬' : '📺'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title *">
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. The Impeachment" className={inp} />
          </Field>

          <Field label="Tagline">
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
              placeholder="Short one-liner" className={inp} />
          </Field>

          <Field label="Year">
            <input type="number" min="1900" max="2099" value={form.year}
              onChange={e => set('year', e.target.value)} className={inp} />
          </Field>

          <Field label="Category">
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inp}>
              <option value="">— No category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field
            label={form.type === 'series' ? 'YouTube ID or URL (optional — used as trailer)' : 'YouTube ID or URL *'}
            hint="Paste a full URL and timestamp auto-fills"
          >
            <input
              required={form.type === 'film'}
              value={form.youtube_id}
              onChange={e => handleYouTubeInput(e.target.value)}
              placeholder="Paste URL or raw ID"
              className={inp}
            />
          </Field>

          <Field label="Start Timestamp (seconds)" hint="Auto-parsed from URL. Override if needed.">
            <input type="number" min="0" value={form.youtube_start}
              onChange={e => set('youtube_start', e.target.value)}
              placeholder="e.g. 4620 = 1h17m" className={inp} />
          </Field>

          <Field label="Badge">
            <select value={form.badge_override} onChange={e => set('badge_override', e.target.value)} className={inp}>
              {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="Logo Image URL" hint="Custom title logo shown in hero instead of white text.">
            <input type="url" value={form.logo_url}
              onChange={e => set('logo_url', e.target.value)}
              placeholder="https://..." className={inp} />
          </Field>

          <Field label="Banner URL" hint="Horizontal background image for the hero.">
            <input type="url" value={form.thumbnail_horizontal}
              onChange={e => set('thumbnail_horizontal', e.target.value)}
              placeholder="https://..." className={inp} />
          </Field>

          <Field label="Poster URL" hint="Vertical card image shown in browse rows.">
            <input type="url" value={form.thumbnail_vertical}
              onChange={e => set('thumbnail_vertical', e.target.value)}
              placeholder="https://..." className={inp} />
          </Field>
        </div>

        <Field label="Tags (comma-separated)">
          <input value={form.tags} onChange={e => set('tags', e.target.value)}
            placeholder="ICC, Warrant, Senate, Bato" className={inp} />
        </Field>

        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="Full description..." className={`${inp} resize-none`} />
        </Field>

        {/* Featured toggle */}
        <div className="flex items-center gap-3">
          <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} />
          <span className="text-gray-300 text-sm">Feature in Hero Carousel</span>
        </div>

        {form.is_featured && (
          <Field label="Featured Order (lower = first)">
            <input type="number" min="0" max="99" value={form.featured_order}
              onChange={e => set('featured_order', e.target.value)}
              className={`${inp} w-28`} />
          </Field>
        )}

        {/* YT preview */}
        {ytPreview && (
          <div className="rounded overflow-hidden border border-gray-700/50">
            <p className="text-xs text-gray-600 px-3 py-2 bg-[#1a1a1a]">
              Auto thumbnail preview{form.youtube_start ? ` — starts at ${form.youtube_start}s` : ''}
            </p>
            <img
              src={`https://img.youtube.com/vi/${ytPreview}/maxresdefault.jpg`}
              alt="preview"
              className="w-full max-h-44 object-cover"
              onError={e => { e.target.src = `https://img.youtube.com/vi/${ytPreview}/hqdefault.jpg` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded transition-colors">
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Show')}
          </button>
          <button type="button" onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* ── Series manager (only when editing a series) ────── */}
      {form.type === 'series' && isEditing && (
        <div className="border-t border-gray-800 pt-6">
          <SeriesManager showId={show.id} />
        </div>
      )}

      {form.type === 'series' && !isEditing && (
        <div className="bg-[#1a1a1a] border border-gray-700/40 rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            💡 Save this show first, then edit it to add seasons and episodes.
          </p>
        </div>
      )}
    </div>
  )
}
