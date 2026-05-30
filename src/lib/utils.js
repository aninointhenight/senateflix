// ── Thumbnails ────────────────────────────────────────────────
export function getHorizontalThumbnail(show) {
  if (show.thumbnail_horizontal) return show.thumbnail_horizontal
  return `https://img.youtube.com/vi/${show.youtube_id}/maxresdefault.jpg`
}

export function getVerticalThumbnail(show) {
  if (show.thumbnail_vertical) return show.thumbnail_vertical
  return `https://img.youtube.com/vi/${show.youtube_id}/mqdefault.jpg`
}

// ── Badge logic ───────────────────────────────────────────────
// Returns badge key or null. badge_override takes priority;
// falls back to auto "recently_added" within 7 weeks of created_at.
export function getShowBadge(show) {
  if (show.badge_override) return show.badge_override
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 49) // 7 weeks
  if (new Date(show.created_at) > cutoff) return 'recently_added'
  return null
}

// ── Badge display config ──────────────────────────────────────
export const BADGE_CONFIG = {
  recently_added: { label: 'Recently Added', bg: 'bg-sf-red',    text: 'text-white'  },
  new_episode:    { label: 'New Episode',     bg: 'bg-white',     text: 'text-black'  },
  leaving_soon:   { label: 'Leaving Soon',    bg: 'bg-amber-500', text: 'text-black'  },
  coming_soon:    { label: 'Coming Soon',     bg: 'bg-gray-600',  text: 'text-white'  },
}

// ── Badge select options (for admin form) ─────────────────────
export const BADGE_OPTIONS = [
  { value: '',             label: 'None (auto-detect recently added)' },
  { value: 'new_episode',  label: 'New Episode'                       },
  { value: 'leaving_soon', label: 'Leaving Soon'                      },
  { value: 'coming_soon',  label: 'Coming Soon'                       },
]

// ── YouTube URL parser ────────────────────────────────────────
// Accepts full URLs or raw IDs
export function extractYouTubeId(input) {
  if (!input) return ''
  const match = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : input.trim()
}
