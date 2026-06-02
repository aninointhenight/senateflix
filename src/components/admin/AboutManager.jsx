import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ── Same inline renderer used in About.jsx for preview ────────
function renderInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sf-red hover:underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
}

function MarkdownPreview({ content }) {
  if (!content?.trim()) return <p className="text-gray-700 italic text-sm">Nothing to preview.</p>
  const lines = content.split('\n')
  const elements = []
  let paraLines = []

  const flushPara = () => {
    if (!paraLines.length) return
    elements.push(
      <p key={`p-${elements.length}`}
        className="text-gray-300 leading-relaxed mb-3 text-sm"
        dangerouslySetInnerHTML={{ __html: renderInline(paraLines.join('<br/>')) }}
      />
    )
    paraLines = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('# '))      { flushPara(); elements.push(<h1 key={i} className="font-bebas text-4xl text-white mt-6 mb-2 first:mt-0">{line.slice(2)}</h1>) }
    else if (line.startsWith('## ')){ flushPara(); elements.push(<h2 key={i} className="font-bebas text-2xl text-white mt-5 mb-2">{line.slice(3)}</h2>) }
    else if (line.startsWith('### ')){ flushPara(); elements.push(<h3 key={i} className="text-white font-bold mt-4 mb-1">{line.slice(4)}</h3>) }
    else if (line.trim() === '---') { flushPara(); elements.push(<hr key={i} className="border-gray-700 my-4"/>) }
    else if (line.trim() === '')    { flushPara() }
    else                            { paraLines.push(line) }
  })
  flushPara()
  return <div>{elements}</div>
}

export default function AboutManager() {
  const [content,   setContent]   = useState('')
  const [starring,  setStarring]  = useState('')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [preview,   setPreview]   = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('about_page').select('content, starring').eq('id', 1).single()
    if (data) {
      setContent(data.content   || '')
      setStarring(data.starring || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await supabase
      .from('about_page')
      .upsert({ id: 1, content, starring, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <p className="text-gray-600 text-sm">Loading...</p>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">About Page</h1>
        <p className="text-gray-600 text-sm mt-1">
          Changes are live immediately after saving. Visit{' '}
          <a href="/about" target="_blank" className="text-sf-red hover:underline">/about</a> to see it.
        </p>
      </div>

      {/* ── Content editor ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Page Content</label>
          <button
            onClick={() => setPreview(p => !p)}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              preview ? 'bg-sf-red text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div className="bg-[#0d0d0d] border border-gray-700/50 rounded-lg p-5 min-h-64">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={18}
              placeholder={`Write anything here. Markdown supported:\n\n# Big heading\n## Smaller heading\n\n**bold text**  *italic text*\n\n[Link text](https://example.com)\n\n---  (horizontal divider)`}
              className="w-full bg-[#1f1f1f] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:border-gray-500 placeholder-gray-700 resize-y"
            />
            <p className="text-gray-700 text-xs mt-1.5">
              Tip: <code className="text-gray-500">[text](url)</code> for links · <code className="text-gray-500">**bold**</code> · <code className="text-gray-500">*italic*</code> · <code className="text-gray-500"># Heading</code> · <code className="text-gray-500">---</code> for divider
            </p>
          </>
        )}
      </div>

      {/* ── Starring ──────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
          Starring
        </label>
        <p className="text-gray-600 text-xs mb-2">
          Comma-separated names. Displays as "Starring: Name 1, Name 2, Name 3..."
        </p>
        <textarea
          value={starring}
          onChange={e => setStarring(e.target.value)}
          rows={3}
          placeholder="Ronald Dela Rosa, Sara Duterte, Pia Cayetano, ..."
          className="w-full bg-[#1f1f1f] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-700 resize-none"
        />
        {/* Live preview of starring names */}
        {starring.trim() && (
          <div className="mt-2 p-3 bg-[#0d0d0d] rounded border border-gray-800/50">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Preview</p>
            <p className="text-gray-300 text-sm">
              <span className="text-gray-500">Starring: </span>
              {starring.split(',').map(s => s.trim()).filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* ── Save button ───────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-green-400 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
