import { useEffect, useRef } from 'react'
import { getShowBadge, BADGE_CONFIG, getYouTubeEmbedUrl } from '../lib/utils'

export default function ShowModal({ show, onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!show) return null

  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const catName  = show.categories?.name || ''

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[999] bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="relative bg-[#141414] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* YouTube embed — uses getYouTubeEmbedUrl which includes start time if set */}
        <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
          <iframe
            src={getYouTubeEmbedUrl(show)}
            title={show.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Show info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="font-bebas text-4xl md:text-5xl text-white leading-none">
              {show.title}
            </h2>
            {show.year && (
              <span className="text-gray-400 text-sm shrink-0 mt-1">{show.year}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {badgeCfg && (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
                {badgeCfg.label}
              </span>
            )}
            {catName && (
              <span className="text-xs px-2 py-0.5 rounded border border-gray-600 text-gray-400">
                {catName}
              </span>
            )}
            {/* Show timestamp indicator if set */}
            {show.youtube_start > 0 && (
              <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-500">
                ▶ starts at {formatTime(show.youtube_start)}
              </span>
            )}
          </div>

          {show.tagline && (
            <p className="text-gray-400 italic text-sm mb-3">"{show.tagline}"</p>
          )}

          {show.description && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{show.description}</p>
          )}

          {show.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
              {show.tags.map(t => (
                <span key={t} className="text-xs text-gray-500 bg-[#1f1f1f] px-2.5 py-1 rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Converts seconds to h:mm:ss or m:ss for display
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}
