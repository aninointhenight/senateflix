import { useState, useEffect } from 'react'
import { supabase }            from '../../lib/supabase'
import { BADGE_OPTIONS, extractYouTubeId } from '../../lib/utils'

const EMPTY = {
  title:                '',
  tagline:              '',
  description:          '',
  year:                 new Date().getFullYear(),
  category_id:          '',
  youtube_id:           '',
  thumbnail_horizontal: '',
  thumbnail_vertical:   '',
  tags:                 '',        // stored as comma-separated string in form
  badge_override:       '',
  is_featured:          false,
  featured_order:       0,
}

// Shared input class
const inp = 'w-full bg-[#1f1f1f] border border-gray-700 text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
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
    // Load categories for the select
    supabase.from('categories').select('*').order('display_order').then(({ data }) => {
      setCategories(data || [])
    })
    // Populate form if editing
    if (show) {
      setForm({
        title:                show.title               || '',
        tagline:              show.tagline             || '',
        description:          show.description         || '',
        year:                 show.year                || new Date().getFullYear(),
        category_id:          show.category_id         || '',
        youtube_id:           show.youtube_id          || '',
        thumbnail_horizontal: show.thumbnail_horizontal || '',
        thumbnail_vertical:   show.thumbnail_vertical   || '',
        tags:                 (show.tags || []).join(', '),
        badge_override:       show.badge_override       || '',
        is_featured:          show.is_featured          || false,
        featured_order:       show.featured_order        || 0,
      })
      setYtPreview(show.youtube_id || '')
    }
  }, [show])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (key === 'youtube_id') setYtPreview(extractYouTubeId(value))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const ytId = extractYouTubeId(form.youtube_id)
    if (!ytId) { setError('Enter a valid YouTube URL or video ID.'); setLoading(false); return }

    const payload = {
      title:                form.title.trim(),
      tagline:              form.tagline.trim()              || null,
      description:          form.description.trim()          || null,
      year:                 form.year ? parseInt(form.year)  : null,
      category_id:          form.category_id                 || null,
      youtube_id:           ytId,
      thumbnail_horizontal: form.thumbnail_horizontal.trim() || null,
      thumbnail_vertical:   form.thumbnail_vertical.trim()   || null,
      tags:                 form.tags.split(',').map(t => t.trim()).filter(Boolean),
      badge_override:       form.badge_override               || null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-white text-xl font-bold">
        {isEditing ? 'Edit Show' : 'Add New Show'}
      </h2>

      {error && (
        <div className="bg-sf-red/10 border border-sf-red/40 text-red-400 text-sm rounded p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title *">
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Under Attack" className={inp} />
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

        <Field label="YouTube ID or URL *">
          <input required value={form.youtube_id} onChange={e => set('youtube_id', e.target.value)}
            placeholder="dQw4w9WgXcQ or full URL" className={inp} />
        </Field>

        <Field label="Badge">
          <select value={form.badge_override} onChange={e => set('badge_override', e.target.value)} className={inp}>
            {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="Custom Thumbnail — Horizontal (banner)">
          <input type="url" value={form.thumbnail_horizontal}
            onChange={e => set('thumbnail_horizontal', e.target.value)}
            placeholder="https://i.imgur.com/..." className={inp} />
        </Field>

        <Field label="Custom Thumbnail — Vertical (poster)">
          <input type="url" value={form.thumbnail_vertical}
            onChange={e => set('thumbnail_vertical', e.target.value)}
            placeholder="https://i.imgur.com/..." className={inp} />
        </Field>
      </div>

      <Field label="Tags (comma-separated)">
        <input value={form.tags} onChange={e => set('tags', e.target.value)}
          placeholder="ICC, Warrant, Senate, Bato, Drugs" className={inp} />
      </Field>

      <Field label="Description">
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} placeholder="Full episode/show description..."
          className={`${inp} resize-none`} />
      </Field>

      {/* Featured toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('is_featured', !form.is_featured)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-sf-red' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_featured ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
        </button>
        <span className="text-gray-300 text-sm">Feature in Hero Carousel</span>
      </div>

      {form.is_featured && (
        <Field label="Featured Order (lower number = appears first)">
          <input type="number" min="0" max="99" value={form.featured_order}
            onChange={e => set('featured_order', e.target.value)}
            className={`${inp} w-28`} />
        </Field>
      )}

      {/* YT thumbnail preview */}
      {ytPreview && (
        <div className="rounded overflow-hidden border border-gray-700/50">
          <p className="text-xs text-gray-600 px-3 py-2 bg-[#1a1a1a]">Auto thumbnail preview</p>
          <img
            src={`https://img.youtube.com/vi/${ytPreview}/maxresdefault.jpg`}
            alt="thumbnail preview"
            className="w-full max-h-44 object-cover"
            onError={e => { e.target.src = `https://img.youtube.com/vi/${ytPreview}/hqdefault.jpg` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded transition-colors"
        >
          {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Show')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
