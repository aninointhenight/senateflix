import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

// ── Simple markdown renderer ──────────────────────────────────
// Supports: # ## ### headings, **bold**, *italic*, [text](url), ---
function renderInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sf-red hover:underline transition-colors">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g,     '<em class="italic">$1</em>')
}

function MarkdownContent({ content }) {
  if (!content?.trim()) return null

  const lines = content.split('\n')
  const elements = []
  let paraLines = []

  const flushPara = () => {
    if (!paraLines.length) return
    elements.push(
      <p key={`p-${elements.length}`}
        className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base"
        dangerouslySetInnerHTML={{ __html: renderInline(paraLines.join('<br/>')) }}
      />
    )
    paraLines = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      flushPara()
      elements.push(
        <h1 key={i} className="font-bebas text-5xl md:text-6xl text-white tracking-wide mt-10 mb-4 first:mt-0">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushPara()
      elements.push(
        <h2 key={i} className="font-bebas text-3xl text-white tracking-wide mt-8 mb-3">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushPara()
      elements.push(
        <h3 key={i} className="text-white font-bold text-lg mt-6 mb-2">
          {line.slice(4)}
        </h3>
      )
    } else if (line.trim() === '---') {
      flushPara()
      elements.push(<hr key={i} className="border-gray-800 my-8" />)
    } else if (line.trim() === '') {
      flushPara()
    } else {
      paraLines.push(line)
    }
  })
  flushPara()

  return <div>{elements}</div>
}

// ── About page ────────────────────────────────────────────────
export default function About() {
  const [content,  setContent]  = useState('')
  const [starring, setStarring] = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('about_page')
      .select('content, starring')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setContent(data.content  || '')
          setStarring(data.starring || '')
        }
        setLoading(false)
      })
  }, [])

  const starringNames = starring
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

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

      {/* Hero header */}
      <div className="relative pt-32 pb-16 px-4 md:px-20 border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-sf-dark pointer-events-none" />
        <div className="relative max-w-3xl">
          <p className="text-sf-red font-bebas text-xl tracking-[0.3em] mb-2">S</p>
          <h1 className="font-bebas text-6xl md:text-8xl text-white tracking-wide leading-none">
            ABOUT
          </h1>
          <p className="text-gray-500 text-sm mt-2 tracking-widest uppercase">Senateflix</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">

        {content.trim() ? (
          <MarkdownContent content={content} />
        ) : (
          <p className="text-gray-700 text-sm italic">Nothing here yet.</p>
        )}

        {/* Starring section */}
        {starringNames.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-[0.25em] mb-4">Starring</p>
            <p className="text-gray-200 text-sm md:text-base leading-relaxed">
              {starringNames.map((name, i) => (
                <span key={i}>
                  <span className="text-white">{name}</span>
                  {i < starringNames.length - 1 && (
                    <span className="text-gray-600">, </span>
                  )}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 text-center mt-8">
        <p className="font-bebas text-sf-red/40 text-2xl mb-1">SENATEFLIX</p>
        <p className="text-gray-700 text-xs">A satirical parody. Not affiliated with the Philippine Senate.</p>
      </footer>
    </div>
  )
}
