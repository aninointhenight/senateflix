import { useState, useRef } from 'react'
import { getPosterThumbnail, getShowBadge, BADGE_CONFIG } from '../lib/utils'
import HoverPreview from './HoverPreview'

const HOVER_DELAY_MS = 1000

export default function ShowCard({ show, onSelect, progressLabel }) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [anchorRect,      setAnchorRect]     = useState(null)
  const hoverTimer = useRef(null)
  const cardRef     = useRef(null)

  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const thumb    = getPosterThumbnail(show)

  function handleMouseEnter() {
    hoverTimer.current = setTimeout(() => {
      if (cardRef.current) setAnchorRect(cardRef.current.getBoundingClientRect())
      setPreviewVisible(true)
    }, HOVER_DELAY_MS)
  }
  function handleMouseLeave() {
    clearTimeout(hoverTimer.current)
    setPreviewVisible(false)
  }

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(show)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="card-hover relative shrink-0 cursor-pointer rounded-lg md:rounded-xl overflow-hidden group"
      style={{ width: 'clamp(96px, 26vw, 144px)' }}
    >
      <div className="relative aspect-[2/3] bg-[#1a1a1a]">
        {thumb ? (
          <img src={thumb} alt={show.title} className="w-full h-full object-cover" loading="lazy"
            onError={e => {
              e.target.onerror = null
              if (show.youtube_id) e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2">
            <span className="text-gray-600 text-xs text-center font-bebas text-lg leading-tight">{show.title}</span>
          </div>
        )}

        {badgeCfg && (
          <span className={`absolute top-1.5 md:top-2 left-1 right-1 text-center z-10 text-[9px] md:text-xs py-0.5 rounded-full font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
            {badgeCfg.label}
          </span>
        )}

        {/* Simplified inline overlay — title + play icon only.
            Tagline / season / episode info moved into HoverPreview (1s delay). */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }}
        >
          <div
            className="absolute top-2 right-2 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white font-bold text-[11px] md:text-xs leading-tight line-clamp-2 drop-shadow">{show.title}</p>
        </div>
      </div>

      <HoverPreview show={show} visible={previewVisible} anchorRect={anchorRect} />

      {progressLabel && (
        <div className="bg-[#0d0d0d] text-sf-red text-[10px] md:text-xs text-center py-1 leading-none font-semibold">▶ {progressLabel}</div>
      )}
    </div>
  )
}
