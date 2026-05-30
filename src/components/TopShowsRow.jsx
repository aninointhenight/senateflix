import { getVerticalThumbnail, getShowBadge, BADGE_CONFIG } from '../lib/utils'

export default function TopShowsRow({ shows, onSelectShow }) {
  if (!shows?.length) return null

  return (
    <div className="mb-10">
      <h2 className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-3 px-4 md:px-12">
        Top Shows in the Philippines
      </h2>

      <div
        className="flex gap-1 overflow-x-auto px-4 md:px-12 pb-4 no-scrollbar"
      >
        {shows.slice(0, 10).map((show, i) => {
          const badge    = getShowBadge(show)
          const badgeCfg = badge ? BADGE_CONFIG[badge] : null
          const thumb    = getVerticalThumbnail(show)

          return (
            <div
              key={show.id}
              onClick={() => onSelectShow(show)}
              className="relative shrink-0 cursor-pointer group"
              style={{ width: '150px' }}
            >
              {/* Giant rank number (outline style like Netflix) */}
              <div
                className="absolute -left-4 bottom-2 font-bebas text-[7.5rem] leading-none select-none pointer-events-none z-10"
                style={{
                  color:             'transparent',
                  WebkitTextStroke:  '2px rgba(255,255,255,0.75)',
                  textShadow:        '3px 3px 10px rgba(0,0,0,0.95)',
                  letterSpacing:     '-0.02em',
                }}
              >
                {i + 1}
              </div>

              {/* Poster thumbnail */}
              <div className="relative aspect-[2/3] rounded overflow-hidden ml-10 bg-[#1a1a1a] group-hover:brightness-110 transition-all duration-200">
                <img
                  src={thumb}
                  alt={show.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
                  }}
                />
                {/* Badge */}
                {badgeCfg && (
                  <span className={`absolute bottom-2 left-1 right-1 text-center text-xs py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
                    {badgeCfg.label}
                  </span>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
