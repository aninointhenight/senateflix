import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

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
    const html = paraLines.map(l => renderInline(l)).join('<br/>')
    elements.push(
      <p key={`p-${elements.length}`}
        className="text-gray-300 leading-relaxed mb-3 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
    paraLines = []
  }

  lines.forEach((line, i) => {
    if      (line.startsWith('# '))   { flushPara(); elements.push(<h1 key={i} className="font-bebas text-4xl text-white mt-6 mb-2 first:mt-0">{line.slice(2)}</h1>) }
    else if (line.startsWith('## '))  { flushPara(); elements.push(<h2 key={i} className="font-bebas text-2xl text-white mt-5 mb-2">{line.slice(3)}</h2>) }
    else if (line.startsWith('### ')) { flushPara(); elements.push(<h3 key={i} className="text-white font-bold mt-4 mb-1">{line.slice(4)}</h3>) }
    else if (line.trim() === '---')   { flushPara(); elements.push(<hr key={i} className="border-gray-700 my-4"/>) }
    else if (line.trim() === '')      { flushPara(); elements.push(<div key={i} className="mb-2" />) }
    else                              { paraLines.push(line) }
  })
  flushPara()
  return <div>{elements}</div>
}

export default function AboutManager() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    supabase.from('about_page').select('content').eq('id', 1).single()
      .then(({ data }) => { if (data) setContent(data.content || ''); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    await supabase.from('about_page').upsert({ id: 1, content, updated_at: new Date().toISOString() })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Keyboard shortcuts: Ctrl+B = bold, Ctrl+I = italic, Ctrl+K = link
  function handleKeyDown(e) {
    if (!e.ctrlKey && !e.metaKey) return

    const ta    = textareaRef.current
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = content.slice(start, end)
    const before = content.slice(0, start)
    const after  = content.slice(end)

    let wrapped = null
    let cursorOffset = 0

    if (e.key === 'b') {
      e.preventDefault()
      wrapped = sel ? `**${sel}**` : '**bold text**'
      cursorOffset = sel ? 0 : -2
    } else if (e.key === 'i') {
      e.preventDefault()
      wrapped = sel ? `*${sel}*` : '*italic text*'
      cursorOffset = sel ? 0 : -1
    } else if (e.key === 'k') {
      e.preventDefault()
      wrapped = sel ? `[${sel}](url)` : '[link text](url)'
      cursorOffset = sel ? -1 : -5  // put cursor before closing )
    }

    if (wrapped !== null) {
      const newContent = before + wrapped + after
      setContent(newContent)
      // Restore cursor position after React re-render
      setTimeout(() => {
        const newPos = start + wrapped.length + cursorOffset
        ta.setSelectionRange(newPos, newPos)
        ta.focus()
      }, 0)
    }
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Page Content</label>
          <button onClick={() => setPreview(p => !p)}
            className={`text-xs px-3 py-1 rounded transition-colors ${preview ? 'bg-sf-red text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>
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
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={18}
              placeholder={`Write anything here.\n\n# Big heading\n## Smaller heading\n\n**bold**  *italic*\n\n[Link text](https://example.com)\n\n--- for divider\n\nEnter once = line break\nEnter twice = new paragraph`}
              className="w-full bg-[#1f1f1f] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:border-gray-500 placeholder-gray-700 resize-y"
            />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              <span className="text-gray-700 text-xs">Shortcuts:</span>
              <span className="text-gray-600 text-xs"><kbd className="bg-[#2a2a2a] px-1 rounded text-gray-500">Ctrl+B</kbd> bold</span>
              <span className="text-gray-600 text-xs"><kbd className="bg-[#2a2a2a] px-1 rounded text-gray-500">Ctrl+I</kbd> italic</span>
              <span className="text-gray-600 text-xs"><kbd className="bg-[#2a2a2a] px-1 rounded text-gray-500">Ctrl+K</kbd> link</span>
              <span className="text-gray-700 text-xs ml-2">Syntax: <code className="text-gray-600">[text](url)</code> · <code className="text-gray-600">---</code> divider · <code className="text-gray-600"># Heading</code></span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-2.5 rounded transition-colors">
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
