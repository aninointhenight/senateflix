// ── Thumbnails ────────────────────────────────────────────────
export function getBannerThumbnail(show) {
  if (show.thumbnail_horizontal) return show.thumbnail_horizontal
  if (show.youtube_id) return `https://img.youtube.com/vi/${show.youtube_id}/maxresdefault.jpg`
  return null
}
export function getPosterThumbnail(show) {
  if (show.thumbnail_vertical) return show.thumbnail_vertical
  if (show.youtube_id) return `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
  return null
}
export function getEpisodeThumbnail(episode) {
  if (episode.thumbnail) return episode.thumbnail
  return `https://img.youtube.com/vi/${episode.youtube_id}/mqdefault.jpg`
}
export const getHorizontalThumbnail = getBannerThumbnail
export const getVerticalThumbnail   = getPosterThumbnail

// ── Badge logic ───────────────────────────────────────────────
// badge_override is now FREE TEXT (admin can type anything, e.g. "Senate Pick").
// 'none' (lowercase, exact match) still suppresses the badge entirely.
// Auto "Recently Added" still applies within 3 days if no override is set.
export function getShowBadge(show) {
  if (show.badge_override === 'none') return null
  if (show.badge_override) return show.badge_override // free text, shown as-is
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 3)
  if (new Date(show.created_at) > cutoff) return 'Recently Added'
  return null
}

// Generic badge style — red background, used for all text badges
// (since badges are now freeform text rather than fixed types).
export const BADGE_STYLE = { bg: 'bg-sf-red', text: 'text-white' }

// Award takes priority over any badge when displaying the top-left label.
// Returns { label, isAward } so callers know which style to apply.
export function getDisplayBadge(show) {
  if (show.award?.trim()) {
    return { label: `🏆 ${show.award.trim()}`, isAward: true }
  }
  const badge = getShowBadge(show)
  return badge ? { label: badge, isAward: false } : null
}

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
  const h = t.match(/(\d+)h/); const m = t.match(/(\d+)m/); const s = t.match(/(\d+)s/)
  if (h) seconds += parseInt(h[1]) * 3600
  if (m) seconds += parseInt(m[1]) * 60
  if (s) seconds += parseInt(s[1])
  return seconds > 0 ? seconds : null
}
export function buildEmbedUrl(youtubeId, startSeconds) {
  let url = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
  if (startSeconds) url += `&start=${startSeconds}`
  return url
}
export function getYouTubeEmbedUrl(show) {
  return show.youtube_id ? buildEmbedUrl(show.youtube_id, show.youtube_start) : null
}
export function getEpisodeEmbedUrl(episode) {
  return buildEmbedUrl(episode.youtube_id, episode.youtube_start)
}

// ── Facebook video helpers ────────────────────────────────────
const FB_APP_ID = '1276153117655984'

export function isFacebookUrl(input) {
  if (!input) return false
  return /facebook\.com\/(watch|video|live|[\w.]+\/videos|[\w.]+\/posts)/i.test(input)
    || /fb\.watch\//i.test(input)
}
export function getFacebookEmbedUrl(fbUrl) {
  const encoded = encodeURIComponent(fbUrl)
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&app_id=${FB_APP_ID}&show_text=false&autoplay=false&width=800`
}
export function getVideoEmbedUrl(show) {
  if (show.fb_url) return getFacebookEmbedUrl(show.fb_url)
  if (show.youtube_id) return buildEmbedUrl(show.youtube_id, show.youtube_start)
  return null
}
export function getEpisodeVideoEmbedUrl(episode) {
  if (episode.fb_url) return getFacebookEmbedUrl(episode.fb_url)
  if (episode.youtube_id) return buildEmbedUrl(episode.youtube_id, episode.youtube_start)
  return null
}

// ── Watch progress (per-series, localStorage) ─────────────────
export function getWatchProgress(showId) {
  try { return JSON.parse(localStorage.getItem(`sf_progress_${showId}`)) || null }
  catch { return null }
}
export function setWatchProgress(showId, episodeId, seasonNumber, episodeNumber) {
  try {
    localStorage.setItem(`sf_progress_${showId}`, JSON.stringify({
      episode_id: episodeId, season_number: seasonNumber, episode_number: episodeNumber,
    }))
  } catch {}
}

// ── Watch history ──────────────────────────────────────────────
const HISTORY_KEY = 'sf_history'
const MAX_HISTORY = 30
export function getWatchHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [] }
  catch { return [] }
}
export function addToWatchHistory(showId) {
  try {
    const history = getWatchHistory().filter(id => id !== showId)
    history.unshift(showId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {}
}

// ── Misc ──────────────────────────────────────────────────────
export function formatTime(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}
