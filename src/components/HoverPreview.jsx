import { createPortal } from 'react-dom'
import { getShowBadge, BADGE_CONFIG } from '../lib/utils'

// Rendered via portal directly into document.body, positioned with
// fixed coordinates from the card's bounding rect. This is necessary
// because overflow-x-auto rows force overflow-y to also clip in most
// browsers (a CSS spec quirk) — a portal sidesteps that entirely.
export default function HoverPreview({ show, visible, anchorRect }) {
  if (!anchorRect) return null

  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const isSeries = show.type === 'series'
  const seasonCount  = show.season_count  || 0
  const episodeCount = show.episode_count || 0
  const seriesLabel  = isSeries && episodeCount > 0
    ? (seasonCount > 1 ? `${seasonCount} Seasons` : `${episodeCount} Episode${episodeCount !== 1 ? 's' : ''}`)
    : null

  // Position to the right of the card; flip to the left if it would
  // overflow the viewport edge.
  const PREVIEW_WIDTH = 224 // w-56
  const wouldOverflow = anchorRect.right + 8 + PREVIEW_WIDTH > window.innerWidth
  const left = wouldOverflow ? anchorRect.left - PREVIEW_WIDTH - 8 : anchorRect.right + 8
  const top  = anchorRect.top

  return createPortal(
    <div
      className="hidden md:block fixed z-[200] transition-all duration-200"
      style={{
        left, top,
        width: PREVIEW_WIDTH,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(0) scale(1)'
          : `translateX(${wouldOverflow ? '8px' : '-8px'}) scale(0.96)`,
        pointerEvents: 'none',
      }}
    >
      <div
        className="rounded-xl p-3.5"
        style={{
          background: 'rgba(20,20,20,0.92)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}
      >
        <p className="text-white font-bold text-sm leading-tight mb-1.5">{show.title}</p>

        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {show.year && <span className="text-green-400 text-xs font-semibold">{show.year}</span>}
          {badgeCfg && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
              {badgeCfg.label}
            </span>
          )}
          {seriesLabel && <span className="text-gray-400 text-xs">{seriesLabel}</span>}
        </div>

        {show.tagline && (
          <p className="text-gray-400 text-xs italic leading-relaxed mb-1.5 line-clamp-2">"{show.tagline}"</p>
        )}

        {show.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {show.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
