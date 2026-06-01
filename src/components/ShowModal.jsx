import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  getShowBadge, BADGE_CONFIG,
  getYouTubeEmbedUrl, getEpisodeEmbedUrl, getEpisodeThumbnail,
  getWatchProgress, setWatchProgress, formatTime,
} from '../lib/utils'

// ── Entry point — routes to Film or Series modal ──────────────
export default function ShowModal({ show, onClose }) {
  if (!show) return null
  return show.type === 'series'
    ? <SeriesModal show={show} onClose={onClose} />
    : <FilmModal   show={show} onClose={onClose} />
}

// ── Shared overlay wrapper ────────────────────────────────────
function ModalShell({ onClose, children }) {
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

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[999] bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="relative bg-[#141414] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

// ── Film modal (same as before) ───────────────────────────────
function FilmModal({ show, onClose }) {
  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null
  const catName  = show.categories?.name || ''

  return (
    <ModalShell onClose={onClose}>
      <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
        <iframe
          src={getYouTubeEmbedUrl(show)}
          title={show.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="font-bebas text-4xl md:text-5xl text-white leading-none">{show.title}</h2>
          {show.year && <span className="text-gray-400 text-sm shrink-0 mt-1">{show.year}</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {badgeCfg && (
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
              {badgeCfg.label}
            </span>
          )}
          {catName && (
            <span className="text-xs px-2 py-0.5 rounded border border-gray-600 text-gray-400">{catName}</span>
          )}
          {show.youtube_start > 0 && (
            <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-500">
              ▶ starts at {formatTime(show.youtube_start)}
            </span>
          )}
        </div>
        {show.tagline   && <p className="text-gray-400 italic text-sm mb-3">"{show.tagline}"</p>}
        {show.description && <p className="text-gray-300 text-sm leading-relaxed mb-4">{show.description}</p>}
        {show.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
            {show.tags.map(t => (
              <span key={t} className="text-xs text-gray-500 bg-[#1f1f1f] px-2.5 py-1 rounded-full">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

// ── Series modal ──────────────────────────────────────────────
function SeriesModal({ show, onClose }) {
  const [seasons,       setSeasons]       = useState([])
  const [loadingEps,    setLoadingEps]    = useState(true)
  const [view,          setView]          = useState('player') // 'player' | 'list'
  const [playing,       setPlaying]       = useState(null)     // { episode, season }

  useEffect(() => { fetchSeasons() }, [show.id])

  async function fetchSeasons() {
    const { data } = await supabase
      .from('seasons')
      .select('*, episodes(*)')
      .eq('show_id', show.id)
      .order('season_number', { ascending: true })

    const sorted = (data || []).map(s => ({
      ...s,
      episodes: [...(s.episodes || [])].sort((a, b) => a.episode_number - b.episode_number),
    }))
    setSeasons(sorted)

    // Find which episode to auto-play
    const progress = getWatchProgress(show.id)
    let toPlay = null

    if (progress?.episode_id) {
      for (const season of sorted) {
        const ep = season.episodes.find(e => e.id === progress.episode_id)
        if (ep) { toPlay = { episode: ep, season }; break }
      }
    }

    if (!toPlay && sorted.length > 0 && sorted[0].episodes.length > 0) {
      toPlay = { episode: sorted[0].episodes[0], season: sorted[0] }
    }

    setPlaying(toPlay)
    setLoadingEps(false)
  }

  function playEpisode(episode, season) {
    setWatchProgress(show.id, episode.id, season.season_number, episode.episode_number)
    setPlaying({ episode, season })
    setView('player')
  }

  // Flat list for prev/next navigation
  const allEps = seasons.flatMap(s => s.episodes.map(e => ({ episode: e, season: s })))
  const currentIdx = playing ? allEps.findIndex(({ episode }) => episode.id === playing.episode.id) : -1
  const prevEntry  = currentIdx > 0 ? allEps[currentIdx - 1] : null
  const nextEntry  = currentIdx >= 0 && currentIdx < allEps.length - 1 ? allEps[currentIdx + 1] : null

  const badge    = getShowBadge(show)
  const badgeCfg = badge ? BADGE_CONFIG[badge] : null

  return (
    <ModalShell onClose={onClose}>
      {loadingEps ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-600 text-sm animate-pulse">Loading episodes...</p>
        </div>
      ) : view === 'player' && playing ? (
        // ── Player view ──────────────────────────────────────
        <>
          {/* Embed */}
          <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
            <iframe
              key={playing.episode.id}
              src={getEpisodeEmbedUrl(playing.episode)}
              title={playing.episode.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Nav bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-[#1a1a1a]">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              All Episodes
            </button>

            <span className="text-gray-500 text-xs">
              S{playing.season.season_number} · E{playing.episode.episode_number}
            </span>

            <button
              onClick={() => nextEntry && playEpisode(nextEntry.episode, nextEntry.season)}
              disabled={!nextEntry}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Episode info */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bebas text-3xl text-white leading-none">
                {playing.episode.title}
              </h3>
              {playing.episode.air_date && (
                <span className="text-gray-500 text-xs shrink-0 mt-1">
                  {new Date(playing.episode.air_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <p className="text-gray-500 text-xs mb-3">
              {show.title} · {playing.season.title || `Season ${playing.season.season_number}`}
              {playing.episode.youtube_start > 0 && ` · starts at ${formatTime(playing.episode.youtube_start)}`}
            </p>

            {playing.episode.description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {playing.episode.description}
              </p>
            )}

            {/* Prev/next episode buttons */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
              {prevEntry && (
                <button
                  onClick={() => playEpisode(prevEntry.episode, prevEntry.season)}
                  className="flex-1 flex items-center gap-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300 text-xs rounded p-2 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="truncate">
                    <span className="text-gray-600 block text-xs">Previous</span>
                    E{prevEntry.episode.episode_number} · {prevEntry.episode.title}
                  </span>
                </button>
              )}
              {nextEntry && (
                <button
                  onClick={() => playEpisode(nextEntry.episode, nextEntry.season)}
                  className="flex-1 flex items-center justify-end gap-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300 text-xs rounded p-2 transition-colors text-right"
                >
                  <span className="truncate">
                    <span className="text-gray-600 block text-xs">Next</span>
                    E{nextEntry.episode.episode_number} · {nextEntry.episode.title}
                  </span>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        // ── Episode list view ────────────────────────────────
        <>
          {/* Show header */}
          <div className="p-5 pb-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <h2 className="font-bebas text-4xl text-white leading-none mb-1">{show.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {show.year && <span className="text-green-400 text-sm font-semibold">{show.year}</span>}
                  {badgeCfg && (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeCfg.bg} ${badgeCfg.text}`}>
                      {badgeCfg.label}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-500">
                    {seasons.length > 1 ? `${seasons.length} Seasons` : `${allEps.length} Episodes`}
                  </span>
                </div>
              </div>
              {playing && (
                <button
                  onClick={() => setView('player')}
                  className="flex items-center gap-1.5 bg-white text-black text-xs font-bold px-4 py-2 rounded hover:bg-gray-200 transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Resume
                </button>
              )}
            </div>
            {show.description && (
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{show.description}</p>
            )}
          </div>

          {/* Seasons + episodes */}
          <div className="pb-4">
            {seasons.map(season => (
              <SeasonBlock
                key={season.id}
                season={season}
                playingEpisodeId={playing?.episode?.id}
                onPlay={(ep) => playEpisode(ep, season)}
              />
            ))}
            {!seasons.length && (
              <p className="text-gray-600 text-sm text-center py-8">No episodes yet.</p>
            )}
          </div>
        </>
      )}
    </ModalShell>
  )
}

// ── Season accordion block ────────────────────────────────────
function SeasonBlock({ season, playingEpisodeId, onPlay }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border-t border-gray-800/60">
      {/* Season header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="text-left">
          <p className="text-white font-semibold text-sm">
            Season {season.season_number}{season.title ? `: ${season.title}` : ''}
          </p>
          <p className="text-gray-600 text-xs">{season.episodes.length} episodes</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Episodes */}
      {open && (
        <div>
          {season.episodes.map(ep => {
            const isPlaying = ep.id === playingEpisodeId
            const thumb     = getEpisodeThumbnail(ep)
            return (
              <div
                key={ep.id}
                onClick={() => onPlay(ep)}
                className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[#1f1f1f] transition-colors ${
                  isPlaying ? 'bg-[#1f1f1f] border-l-2 border-sf-red' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-28 aspect-video rounded overflow-hidden bg-[#1a1a1a]">
                  <img
                    src={thumb}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = `https://img.youtube.com/vi/${ep.youtube_id}/hqdefault.jpg` }}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-medium leading-tight mb-0.5 ${isPlaying ? 'text-white' : 'text-gray-300'}`}>
                    <span className="text-gray-500 mr-1">{ep.episode_number}.</span>
                    {ep.title}
                    {isPlaying && <span className="ml-2 text-sf-red text-xs">▶ Playing</span>}
                  </p>
                  {ep.air_date && (
                    <p className="text-gray-600 text-xs mb-1">
                      {new Date(ep.air_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                  {ep.description && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{ep.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
