import { useState, useEffect, useCallback } from 'react'
import { getBannerThumbnail, getDisplayBadge } from '../lib/utils'

const INTERVAL_MS = 7000

export default function HeroCarousel({ featuredShows, onSelectShow }) {
  const [idx,     setIdx]     = useState(0)
  const [fading,  setFading]  = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const n = featuredShows.length

  const goTo = useCallback((next) => {
    if (fading || n <= 1) return
    setFading(true)
    // Swap index immediately so the crossfade starts right away —
    // previously this waited the full 600ms before changing anything,
    // which felt like a dead/laggy click.
    setIdx(next)
    setAnimKey(k => k + 1)
    setTimeout(() => setFading(false), 350)
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
      <div className="mx-2 sm:mx-3 md:mx-6 mt-16 md:mt-20 rounded-xl md:rounded-2xl overflow-hidden h-[60vh] md:h-[82vh] bg-[#0a0a0a] flex items-end pb-16 md:pb-28 pl-6 md:pl-12">
        <p className="text-gray-700 text-sm">No featured shows set.</p>
      </div>
    )
  }

  const show     = featuredShows[idx]
  const display  = getDisplayBadge(show)
  const catName  = show.categories?.name?.toUpperCase() || 'SERIES'

  return (
    <div className="px-2 sm:px-3 md:px-6 pt-16 md:pt-20">
      <div
        className="relative w-full rounded-xl md:rounded-2xl overflow-hidden"
        style={{ height: 'min(640px, 78vh)' }}
      >
        {/* Slide backgrounds */}
        {featuredShows.map((s, i) => (
          <div key={s.id} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0 }}>
            {getBannerThumbnail(s) ? (
              <img
                src={getBannerThumbnail(s)}
                alt={s.title}
                className="w-full h-full object-cover object-center"
                onError={e => { if (s.youtube_id) e.target.src = `https://img.youtube.com/vi/${s.youtube_id}/hqdefault.jpg` }}
              />
            ) : (
              <div className="w-full h-full bg-[#0a0a0a]" />
            )}
          </div>
        ))}

        {/* Overlays */}
        <div className="absolute inset-0 hero-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 md:h-56 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />

        {/* Content panel — sized down + repositioned for mobile */}
        <div key={animKey}
          className="absolute bottom-16 md:bottom-24 left-4 sm:left-6 md:left-14 right-4 sm:right-auto max-w-[88%] sm:max-w-md md:max-w-xl hero-content-enter">

          <div className="flex items-center gap-2 mb-1.5 md:mb-2">
            <span className="text-sf-red font-bold text-base md:text-xl leading-none">S</span>
            <span className="text-gray-300 text-[10px] md:text-xs tracking-[0.2em] uppercase">{catName}</span>
          </div>

          {show.logo_url ? (
            <img src={show.logo_url} alt={show.title}
              className="max-h-16 sm:max-h-24 md:max-h-48 w-auto object-contain mb-2 md:mb-4 drop-shadow-2xl"
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <h1 className="font-bebas leading-none text-white tracking-wide drop-shadow-2xl mb-1.5 md:mb-2"
              style={{ fontSize: 'clamp(2.25rem, 9vw, 7.5rem)' }}>
              {show.title}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
            {show.year && <span className="text-green-400 text-xs md:text-sm font-semibold">{show.year}</span>}
            {display && (
              <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold ${
                display.isAward ? 'bg-amber-400 text-black' : 'bg-sf-red text-white'
              }`}>
                {display.label}
              </span>
            )}
            {show.tags?.slice(0, 2).map(t => (
              <span key={t} className="text-gray-400 text-[10px] md:text-xs border border-gray-600/70 px-1.5 md:px-2 py-0.5 rounded backdrop-blur-sm hidden sm:inline-block">
                {t}
              </span>
            ))}
          </div>

          {(show.description || show.tagline) && (
            <p className="text-gray-200 text-xs md:text-sm leading-relaxed mb-3 md:mb-5 line-clamp-2 md:line-clamp-3 drop-shadow">
              {show.description || show.tagline}
            </p>
          )}

          <div className="flex gap-2 md:gap-3">
            <button onClick={() => onSelectShow(show)}
              className="flex items-center gap-1.5 md:gap-2 bg-white text-black font-bold text-xs md:text-sm px-4 md:px-7 py-2 md:py-2.5 rounded-full hover:bg-gray-200 transition-all active:scale-95">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            <button onClick={() => onSelectShow(show)}
              className="flex items-center gap-1.5 md:gap-2 text-white font-semibold text-xs md:text-sm px-4 md:px-7 py-2 md:py-2.5 rounded-full transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">More Info</span>
              <span className="sm:hidden">Info</span>
            </button>
          </div>
        </div>

        {/* Arrows — hidden on mobile, swipe-friendly instead */}
        {n > 1 && (
          <>
            <button onClick={prev}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center text-white transition-all active:scale-90"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={next}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center text-white transition-all active:scale-90"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots — repositioned for mobile, smaller */}
        {n > 1 && (
          <div className="absolute bottom-3 md:bottom-6 right-4 md:right-8 flex items-center gap-1.5">
            {featuredShows.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? '18px' : '5px', height: '5px', background: i === idx ? 'white' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
