import { getHorizontalThumbnail, getShowBadge, BADGE_CONFIG } from '../lib/utils'

export default function ShowCard({ show, onSelect }) {
  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const thumb    = getHorizontalThumbnail(show)

  return (
    <div
      onClick={() => onSelect(show)}
      className="card-hover relative shrink-0 w-44 md:w-52 cursor-pointer rounded overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1a1a1a]">
        <img
          src={thumb}
          alt={show.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => {
            e.target.onerror = null
            e.target.src = `https://img.youtube.com/vi/${show.youtube_id}/hqdefault.jpg`
          }}
        />

        {/* Badge */}
        {badgeCfg && (
          <span className={`absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
            {badgeCfg.label}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
          {/* Play button */}
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75">
            <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Info */}
          <p className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow">
            {show.title}
          </p>
          {show.year && (
            <p className="text-green-400 text-xs mt-0.5">{show.year}</p>
          )}
          {show.tags?.length > 0 && (
            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
              {show.tags.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
