import { useState, useEffect, useCallback } from 'react'
import { getHorizontalThumbnail, getShowBadge, BADGE_CONFIG } from '../lib/utils'

const INTERVAL_MS = 7000

export default function HeroCarousel({ featuredShows, onSelectShow }) {
  const [idx,    setIdx]    = useState(0)
  const [fading, setFading] = useState(false)
  const n = featuredShows.length

  const goTo = useCallback((next) => {
    if (fading || n <= 1) return
    setFading(true)
    setTimeout(() => { setIdx(next); setFading(false) }, 600)
  }, [fading, n])

  const next = useCallback(() => goTo((idx + 1) % n), [goTo, idx, n])
  const prev = useCallback(() => goTo((idx - 1 + n) % n), [goTo, idx, n])

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(next, INTERVAL_MS)
    return () => clearInterval(t)
  }, [next, n])

  if (!n) {
    return (
      <div className="h-[75vh] bg-[#0a0a0a] flex items-end pb-28 pl-12">
        <p className="text-gray-700 text-sm">No featured shows set — add some from the Admin panel.</p>
      </div>
    )
  }

  const show    = featuredShows[idx]
  const badge   = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const catName  = show.categories?.name?.toUpperCase() || 'SERIES'

  return (
    <div className="relative w-full h-[80vh] min-h-[520px] overflow-hidden select-none">

      {/* ── Slide backgrounds (stacked, fading) ────────────── */}
      {featuredShows.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img
            src={getHorizontalThumbnail(s)}
            alt={s.title}
            className="w-full h-full object-cover object-center"
            onError={e => { e.target.src = `https://img.youtube.com/vi/${s.youtube_id}/hqdefault.jpg` }}
          />
        </div>
      ))}

      {/* ── Overlay gradients ───────────────────────────────── */}
      <div className="absolute inset-0 hero-overlay pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-sf-dark to-transparent pointer-events-none" />

      {/* ── Content panel ───────────────────────────────────── */}
      <div
        className={`absolute bottom-28 left-8 md:left-12 max-w-xl transition-all duration-500 ${
          fading ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Category label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sf-red font-bold text-xl leading-none">S</span>
          <span className="text-gray-300 text-xs tracking-[0.2em] uppercase">{catName}</span>
        </div>

        {/* Title */}
        <h1 className="font-bebas text-[5.5rem] md:text-[7.5rem] leading-none text-white tracking-wide drop-shadow-2xl mb-2">
          {show.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {show.year && (
            <span className="text-green-400 text-sm font-semibold">{show.year}</span>
          )}
          {badgeCfg && (
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
              {badgeCfg.label}
            </span>
          )}
          {show.tags?.slice(0, 3).map(t => (
            <span key={t} className="text-gray-400 text-xs border border-gray-600/70 px-2 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>

        {/* Description */}
        {(show.description || show.tagline) && (
          <p className="text-gray-200 text-sm leading-relaxed mb-5 max-w-md line-clamp-3 drop-shadow">
            {show.description || show.tagline}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onSelectShow(show)}
            className="flex items-center gap-2 bg-white text-black font-bold text-sm px-7 py-2.5 rounded hover:bg-gray-200 transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            onClick={() => onSelectShow(show)}
            className="flex items-center gap-2 bg-gray-500/50 hover:bg-gray-500/70 text-white font-semibold text-sm px-7 py-2.5 rounded transition-colors backdrop-blur-sm active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* ── Carousel arrows ──────────────────────────────────── */}
      {n > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* ── Dot indicators ───────────────────────────────────── */}
      {n > 1 && (
        <div className="absolute bottom-10 right-10 flex items-center gap-2">
          {featuredShows.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? 'bg-white w-6 h-1.5' : 'bg-gray-600 hover:bg-gray-400 w-1.5 h-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
