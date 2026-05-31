// ── Thumbnails ────────────────────────────────────────────────
// DB columns are still thumbnail_horizontal / thumbnail_vertical
// but we call them "banner" and "poster" everywhere in the UI.

export function getBannerThumbnail(show) {
  if (show.thumbnail_horizontal) return show.thumbnail_horizontal
  return `https://img.youtube.com/vi/${show.youtube_id}/maxresdefault.jpg`
}

export function getPosterThumbnail(show) {
  if (show.thumbnail_vertical) return show.thumbnail_vertical
  return `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
}

// Keep old names as aliases so nothing silently breaks
export const getHorizontalThumbnail = getBannerThumbnail
export const getVerticalThumbnail   = getPosterThumbnail

// ── Badge logic ───────────────────────────────────────────────
export function getShowBadge(show) {
  if (show.badge_override) return show.badge_override
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 49) // 7 weeks
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

// Extracts the 11-char video ID from any YouTube URL or raw ID
export function extractYouTubeId(input) {
  if (!input) return ''
  const match = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : input.trim().slice(0, 11)
}

// Extracts timestamp in seconds from a YouTube URL
// Handles: ?t=4620  ?t=1h23m45s  ?t=23m10s  &t=90  #t=120
export function extractYouTubeTimestamp(input) {
  if (!input) return null
  const tMatch = input.match(/[?&#]t=([^&\s]+)/)
  if (!tMatch) return null
  const t = tMatch[1]

  // Pure integer seconds
  if (/^\d+$/.test(t)) return parseInt(t)

  // Human-readable: 1h23m45s / 23m10s / 90s
  let seconds = 0
  const h = t.match(/(\d+)h/)
  const m = t.match(/(\d+)m/)
  const s = t.match(/(\d+)s/)
  if (h) seconds += parseInt(h[1]) * 3600
  if (m) seconds += parseInt(m[1]) * 60
  if (s) seconds += parseInt(s[1])
  return seconds > 0 ? seconds : null
}

// Builds the final YouTube embed URL, including start time if set
export function getYouTubeEmbedUrl(show) {
  let url = `https://www.youtube.com/embed/${show.youtube_id}?autoplay=1&rel=0&modestbranding=1`
  if (show.youtube_start) url += `&start=${show.youtube_start}`
  return url
}
