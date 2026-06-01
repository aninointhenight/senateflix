// ── Thumbnails ────────────────────────────────────────────────
export function getBannerThumbnail(show) {
  if (show.thumbnail_horizontal) return show.thumbnail_horizontal
  return `https://img.youtube.com/vi/${show.youtube_id}/maxresdefault.jpg`
}

export function getPosterThumbnail(show) {
  if (show.thumbnail_vertical) return show.thumbnail_vertical
  return `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
}

export function getEpisodeThumbnail(episode) {
  if (episode.thumbnail) return episode.thumbnail
  return `https://img.youtube.com/vi/${episode.youtube_id}/mqdefault.jpg`
}

// Aliases so old imports don't break
export const getHorizontalThumbnail = getBannerThumbnail
export const getVerticalThumbnail   = getPosterThumbnail

// ── Badge logic ───────────────────────────────────────────────
export function getShowBadge(show) {
  if (show.badge_override) return show.badge_override
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 49)
  if (new Date(show.created_at) > cutoff) return 'recently_added'
  return null
}

export const BADGE_CONFIG = {
  recently_added: { label: 'Recently Added', bg: 'bg-sf-red',    text: 'text-white' },
  new_episode:    { label: 'New Episode',     bg: 'bg-white',     text: 'text-black' },
  leaving_soon:   { label: 'Leaving Soon',    bg: 'bg-amber-500', text: 'text-black' },
  coming_soon:    { label: 'Coming Soon',     bg: 'bg-gray-600',  text: 'text-white' },
}

export const BADGE_OPTIONS = [
  { value: '',             label: 'None (auto-detect recently added)' },
  { value: 'new_episode',  label: 'New Episode'                       },
  { value: 'leaving_soon', label: 'Leaving Soon'                      },
  { value: 'coming_soon',  label: 'Coming Soon'                       },
]

// ── YouTube helpers ───────────────────────────────────────────
export function extractYouTubeId(input) {
  if (!input) return ''
  const match = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : input.trim().slice(0, 11)
}

export function extractYouTubeTimestamp(input) {
  if (!input) return null
  const tMatch = input.match(/[?&#]t=([^&\s]+)/)
  if (!tMatch) return null
  const t = tMatch[1]
  if (/^\d+$/.test(t)) return parseInt(t)
  let seconds = 0
  const h = t.match(/(\d+)h/)
  const m = t.match(/(\d+)m/)
  const s = t.match(/(\d+)s/)
  if (h) seconds += parseInt(h[1]) * 3600
  if (m) seconds += parseInt(m[1]) * 60
  if (s) seconds += parseInt(s[1])
  return seconds > 0 ? seconds : null
}

// Generic embed URL builder — used for both shows and episodes
export function buildEmbedUrl(youtubeId, startSeconds) {
  let url = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
  if (startSeconds) url += `&start=${startSeconds}`
  return url
}

export function getYouTubeEmbedUrl(show) {
  return buildEmbedUrl(show.youtube_id, show.youtube_start)
}

export function getEpisodeEmbedUrl(episode) {
  return buildEmbedUrl(episode.youtube_id, episode.youtube_start)
}

// ── Watch progress (localStorage, per-device) ─────────────────
export function getWatchProgress(showId) {
  try {
    const raw = localStorage.getItem(`sf_progress_${showId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setWatchProgress(showId, episodeId, seasonNumber, episodeNumber) {
  try {
    localStorage.setItem(`sf_progress_${showId}`, JSON.stringify({
      episode_id:     episodeId,
      season_number:  seasonNumber,
      episode_number: episodeNumber,
    }))
  } catch {}
}

// ── Misc ──────────────────────────────────────────────────────
// Formats seconds → h:mm:ss or m:ss
export function formatTime(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}
