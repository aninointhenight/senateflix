import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

function renderInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sf-red hover:underline transition-colors">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g,     '<em class="italic">$1</em>')
}

function MarkdownContent({ content }) {
  if (!content?.trim()) return null
  // Split on blank lines to get blocks, preserving single-line breaks within blocks
  const blocks = content.split(/\n{2,}/)
  const elements = []

  blocks.forEach((block, bi) => {
    const line = block.trim()
    if (!line) return

    if (line.startsWith('# ')) {
      elements.push(<h1 key={bi} className="font-bebas text-5xl md:text-6xl text-white tracking-wide mt-10 mb-4 first:mt-0">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={bi} className="font-bebas text-3xl text-white tracking-wide mt-8 mb-3">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={bi} className="text-white font-bold text-lg mt-6 mb-2">{line.slice(4)}</h3>)
    } else if (line === '---') {
      elements.push(<hr key={bi} className="border-gray-800 my-8" />)
    } else {
      // Render each line within the block, joining with <br/>
      const html = line
        .split('\n')
        .map(l => renderInline(l))
        .join('<br/>')
      elements.push(
        <p key={bi}
          className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    }
  })

  return <div>{elements}</div>
}

export default function About() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('about_page').select('content').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setContent(data.content || '')
        setLoading(false)
      })
  }, [])

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

      {/* Header */}
      <div className="relative pt-32 pb-16 px-4 md:px-20 border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-sf-dark pointer-events-none" />
        <div className="relative max-w-3xl">
          <h1 className="font-bebas text-6xl md:text-8xl text-white tracking-wide leading-none">ABOUT</h1>
          <p className="text-gray-500 text-sm mt-2 tracking-widest uppercase">Senateflix</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        {content.trim()
          ? <MarkdownContent content={content} />
          : <p className="text-gray-700 text-sm italic">Nothing here yet.</p>
        }
      </div>

      <footer className="border-t border-gray-800/50 py-8 text-center mt-8">
        <p className="font-bebas text-sf-red/40 text-2xl mb-1">SENATEFLIX</p>
        <p className="text-gray-700 text-xs">A satirical parody. Not affiliated with the Philippine Senate.</p>
      </footer>
    </div>
  )
}
