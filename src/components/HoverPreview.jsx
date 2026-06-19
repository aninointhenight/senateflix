import { createPortal } from 'react-dom'
import { getDisplayBadge } from '../lib/utils'

// Tall preview card matched to the poster's own height so it reads as
// one connected unit rather than a floating tooltip. Rendered via portal
// to escape row clipping (overflow-x-auto rows force overflow-y to clip
// in most browsers — a long-standing CSS spec quirk).
export default function HoverPreview({ show, visible, anchorRect, onPlay }) {
  if (!anchorRect) return null

  const display      = getDisplayBadge(show)
  const seasonCount   = show.season_count  || 0
  const episodeCount  = show.episode_count || 0
  const isSeries      = show.type === 'series'
  const seriesLabel   = isSeries && episodeCount > 0
    ? (seasonCount > 1 ? `${seasonCount} Seasons` : `${episodeCount} Episode${episodeCount !== 1 ? 's' : ''}`)
    : null
  const starringList = show.starring?.split(',').map(s => s.trim()).filter(Boolean) || []
  const blurb         = show.tagline || show.description || ''

  const PREVIEW_WIDTH = 240
  const wouldOverflow  = anchorRect.right + 8 + PREVIEW_WIDTH > window.innerWidth
  const left = wouldOverflow ? anchorRect.left - PREVIEW_WIDTH - 8 : anchorRect.right + 8
  const top  = anchorRect.top

  return createPortal(
    <div
      className="hidden md:block fixed z-[200] transition-all duration-[400ms] ease-out"
      style={{
        left, top,
        width: PREVIEW_WIDTH,
        height: anchorRect.height, // matched to poster height
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(0) scale(1)'
          : `translateX(${wouldOverflow ? '10px' : '-10px'}) scale(0.95)`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="h-full flex flex-col rounded-xl p-3.5 overflow-hidden"
        style={{
          background: 'rgba(20,20,20,0.94)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}
      >
        {/* Title */}
        <p className="text-white font-bold text-sm leading-tight mb-1.5">{show.title}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {show.year && <span className="text-green-400 text-xs font-semibold">{show.year}</span>}
          {display && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                display.isAward ? 'bg-amber-400 text-black' : 'bg-sf-red text-white'
              }`}
            >
              {display.label}
            </span>
          )}
          {seriesLabel && <span className="text-gray-400 text-xs">{seriesLabel}</span>}
        </div>

        {/* Category */}
        {show.categories?.name && (
          <p className="text-gray-500 text-[11px] mb-1.5">{show.categories.name}</p>
        )}

        {/* Tagline / description */}
        {blurb && (
          <p className="text-gray-400 text-xs leading-relaxed mb-2 line-clamp-3">{blurb}</p>
        )}

        {/* Starring */}
        {starringList.length > 0 && (
          <p className="text-gray-500 text-[11px] leading-relaxed mb-2 line-clamp-1">
            <span className="text-gray-600">Starring: </span>
            {starringList.join(', ')}
          </p>
        )}

        {/* Tags fill remaining space */}
        {show.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
            {show.tags.slice(0, 4).map(t => (
              <span key={t} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Play button */}
        {onPlay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(show) }}
            className="mt-2 flex items-center justify-center gap-1.5 bg-white text-black text-xs font-bold py-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Play
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
