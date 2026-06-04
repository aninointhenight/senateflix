import { getPosterThumbnail, getShowBadge, BADGE_CONFIG } from '../lib/utils'

export default function ShowCard({ show, onSelect, progressLabel }) {
  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const thumb    = getPosterThumbnail(show)
  const isSeries = show.type === 'series'

  // Use denormalized counts — no nested join needed
  const seasonCount  = show.season_count  || 0
  const episodeCount = show.episode_count || 0
  const seriesLabel  = isSeries && episodeCount > 0
    ? (seasonCount > 1 ? `${seasonCount} Seasons` : `${episodeCount} Episode${episodeCount !== 1 ? 's' : ''}`)
    : null

  return (
    <div
      onClick={() => onSelect(show)}
      className="card-hover relative shrink-0 w-32 md:w-36 cursor-pointer rounded overflow-hidden group"
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

        {/* Badge */}
        {badgeCfg && (
          <span className={`absolute top-2 left-1 right-1 text-center z-10 text-xs py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
            {badgeCfg.label}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75">
            <svg className="w-3.5 h-3.5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white font-bold text-xs leading-tight line-clamp-2 drop-shadow">{show.title}</p>
          {show.year && <p className="text-green-400 text-xs mt-0.5">{show.year}</p>}
          {seriesLabel && <p className="text-gray-400 text-xs mt-0.5">📺 {seriesLabel}</p>}
        </div>
      </div>

      {seriesLabel && (
        <div className="bg-[#0d0d0d] text-gray-500 text-xs text-center py-1 leading-none">{seriesLabel}</div>
      )}
      {progressLabel && (
        <div className="bg-[#0d0d0d] text-sf-red text-xs text-center py-1 leading-none font-semibold">▶ {progressLabel}</div>
      )}
    </div>
  )
}
