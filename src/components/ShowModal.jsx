import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  getDisplayBadge,
  getEpisodeThumbnail,
  getWatchProgress, setWatchProgress, addToWatchHistory, formatTime,
  getVideoEmbedUrl, getEpisodeVideoEmbedUrl,
} from '../lib/utils'

async function trackView(showId) {
  try { await supabase.rpc('increment_view', { show_id: showId }) } catch {}
}

async function fetchFullShow(showId) {
  const { data } = await supabase
    .from('shows').select('*, categories(id, name)').eq('id', showId).single()
  return data || null
}

export default function ShowModal({ show, onClose }) {
  if (!show) return null
  return show.type === 'series'
    ? <SeriesModal show={show} onClose={onClose} />
    : <FilmModal   show={show} onClose={onClose} />
}

// ── Shared overlay ────────────────────────────────────────────
function ModalShell({ onClose, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    // Simple overflow-based scroll lock. A previous version used
    // position:fixed + negative top-offset on the body, but that
    // interacted badly with the modal's own position:fixed — both
    // establish fixed-positioning contexts simultaneously, which made
    // the modal anchor near the top of the page instead of the current
    // viewport. Plain overflow:hidden on html+body avoids that entirely.
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow

    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)

    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 modal-backdrop modal-backdrop-enter"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl modal-enter"
        style={{
          background: 'rgba(16,16,16,0.92)',
          backdropFilter: 'blur(40px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
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

// ── Film modal ────────────────────────────────────────────────
function FilmModal({ show, onClose }) {
  const [fullShow, setFullShow] = useState(show)

  useEffect(() => {
    addToWatchHistory(show.id)
    trackView(show.id)
    fetchFullShow(show.id).then(data => { if (data) setFullShow(data) })
  }, [show.id])

  const display      = getDisplayBadge(fullShow)
  const embedUrl     = getVideoEmbedUrl(fullShow)
  const isFB         = !!fullShow.fb_url
  const starringList = fullShow.starring?.split(',').map(s => s.trim()).filter(Boolean) || []

  return (
    <ModalShell onClose={onClose}>
      {embedUrl ? (
        <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden">
          <iframe src={embedUrl} title={fullShow.title} className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen scrolling={isFB ? 'no' : undefined}
            style={isFB ? { border: 'none', overflow: 'hidden' } : undefined}
          />
        </div>
      ) : (
        <div className="aspect-video rounded-t-2xl flex items-center justify-center bg-[#0d0d0d]">
          <p className="text-gray-600 text-sm">No video available</p>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="font-bebas text-4xl md:text-5xl text-white leading-none">{fullShow.title}</h2>
          {fullShow.year && <span className="text-gray-400 text-sm shrink-0 mt-1">{fullShow.year}</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {display && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              display.isAward ? 'bg-amber-400 text-black' : 'bg-sf-red text-white'
            }`}>
              {display.label}
            </span>
          )}
          {fullShow.categories?.name && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-600/60 text-gray-400"
              style={{ backdropFilter: 'blur(8px)' }}>
              {fullShow.categories.name}
            </span>
          )}
          {fullShow.youtube_start > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-500">
              ▶ starts at {formatTime(fullShow.youtube_start)}
            </span>
          )}
        </div>
        {fullShow.tagline    && <p className="text-gray-400 italic text-sm mb-3">"{fullShow.tagline}"</p>}
        {fullShow.description && <p className="text-gray-300 text-sm leading-relaxed mb-4">{fullShow.description}</p>}
        {starringList.length > 0 && (
          <p className="text-gray-500 text-xs mb-4">
            <span className="text-gray-600 uppercase tracking-wider">Starring: </span>
            {starringList.join(', ')}
          </p>
        )}
        {fullShow.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {fullShow.tags.map(t => (
              <span key={t} className="text-xs text-gray-500 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  )
}

// ── Series modal ──────────────────────────────────────────────
function SeriesModal({ show, onClose }) {
  const [fullShow,   setFullShow]   = useState(show)
  const [seasons,    setSeasons]    = useState([])
  const [loadingEps, setLoadingEps] = useState(true)
  const [view,       setView]       = useState('player')
  const [playing,    setPlaying]    = useState(null)

  useEffect(() => {
    addToWatchHistory(show.id)
    Promise.all([
      fetchFullShow(show.id),
      supabase.from('seasons').select('*, episodes(*)')
        .eq('show_id', show.id).order('season_number', { ascending: true }),
    ]).then(([fullData, { data: seasonsData }]) => {
      if (fullData) setFullShow(fullData)
      const sorted = (seasonsData || []).map(s => ({
        ...s, episodes: [...(s.episodes || [])].sort((a, b) => a.episode_number - b.episode_number),
      }))
      setSeasons(sorted)
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
    })
  }, [show.id])

  function playEpisode(episode, season) {
    setWatchProgress(show.id, episode.id, season.season_number, episode.episode_number)
    trackView(show.id)
    setPlaying({ episode, season })
    setView('player')
  }

  const allEps     = seasons.flatMap(s => s.episodes.map(e => ({ episode: e, season: s })))
  const currentIdx = playing ? allEps.findIndex(({ episode }) => episode.id === playing.episode.id) : -1
  const prevEntry  = currentIdx > 0 ? allEps[currentIdx - 1] : null
  const nextEntry  = currentIdx >= 0 && currentIdx < allEps.length - 1 ? allEps[currentIdx + 1] : null
  const display    = getDisplayBadge(fullShow)

  return (
    <ModalShell onClose={onClose}>
      {loadingEps ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-600 text-sm animate-pulse">Loading episodes...</p>
        </div>
      ) : view === 'player' && playing ? (
        <>
          <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden">
            <iframe key={playing.episode.id} src={getEpisodeVideoEmbedUrl(playing.episode)}
              title={playing.episode.title} className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <button onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              All Episodes
            </button>
            <span className="text-gray-500 text-xs">S{playing.season.season_number} · E{playing.episode.episode_number}</span>
            <button onClick={() => nextEntry && playEpisode(nextEntry.episode, nextEntry.season)}
              disabled={!nextEntry}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bebas text-3xl text-white leading-none">{playing.episode.title}</h3>
              {playing.episode.air_date && (
                <span className="text-gray-500 text-xs shrink-0 mt-1">
                  {new Date(playing.episode.air_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mb-3">
              {fullShow.title} · {playing.season.title || `Season ${playing.season.season_number}`}
              {playing.episode.youtube_start > 0 && ` · starts at ${formatTime(playing.episode.youtube_start)}`}
            </p>
            {playing.episode.description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-4">{playing.episode.description}</p>
            )}
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
              {prevEntry && (
                <button onClick={() => playEpisode(prevEntry.episode, prevEntry.season)}
                  className="flex-1 flex items-center gap-2 text-gray-300 text-xs rounded-xl p-2.5 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                <button onClick={() => playEpisode(nextEntry.episode, nextEntry.season)}
                  className="flex-1 flex items-center justify-end gap-2 text-gray-300 text-xs rounded-xl p-2.5 transition-all text-right"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
        <>
          <div className="p-5 pb-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <h2 className="font-bebas text-4xl text-white leading-none mb-1">{fullShow.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {fullShow.year && <span className="text-green-400 text-sm font-semibold">{fullShow.year}</span>}
                  {display && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      display.isAward ? 'bg-amber-400 text-black' : 'bg-sf-red text-white'
                    }`}>
                      {display.label}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-500">
                    {seasons.length > 1 ? `${seasons.length} Seasons` : `${allEps.length} Episodes`}
                  </span>
                </div>
              </div>
              {playing && (
                <button onClick={() => setView('player')}
                  className="flex items-center gap-1.5 bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-200 transition-all active:scale-95 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Resume
                </button>
              )}
            </div>
            {fullShow.description && (
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-2">{fullShow.description}</p>
            )}
            {fullShow.starring && (
              <p className="text-gray-600 text-xs">
                <span className="text-gray-700 uppercase tracking-wider">Starring: </span>
                {fullShow.starring.split(',').map(s => s.trim()).filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="pb-4">
            {seasons.map(season => (
              <SeasonBlock key={season.id} season={season}
                playingEpisodeId={playing?.episode?.id}
                onPlay={(ep) => playEpisode(ep, season)} />
            ))}
            {!seasons.length && <p className="text-gray-600 text-sm text-center py-8">No episodes yet.</p>}
          </div>
        </>
      )}
    </ModalShell>
  )
}

// ── Season accordion ─────────────────────────────────────────
function SeasonBlock({ season, playingEpisodeId, onPlay }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t border-white/5">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors">
        <div className="text-left">
          <p className="text-white font-semibold text-sm">
            Season {season.season_number}{season.title ? `: ${season.title}` : ''}
          </p>
          <p className="text-gray-600 text-xs">{season.episodes.length} episodes</p>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div>
          {season.episodes.map(ep => {
            const isPlaying = ep.id === playingEpisodeId
            return (
              <div key={ep.id} onClick={() => onPlay(ep)}
                className={`flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                  isPlaying ? 'border-l-2 border-sf-red bg-white/[0.03]' : ''
                }`}>
                <div className="relative shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-[#1a1a1a]">
                  <img src={getEpisodeThumbnail(ep)} alt={ep.title} className="w-full h-full object-cover"
                    onError={e => { e.target.src = `https://img.youtube.com/vi/${ep.youtube_id}/hqdefault.jpg` }} />
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-medium leading-tight mb-0.5 ${isPlaying ? 'text-white' : 'text-gray-300'}`}>
                    <span className="text-gray-600 mr-1">{ep.episode_number}.</span>
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
