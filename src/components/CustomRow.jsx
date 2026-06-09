import ShowCard from './ShowCard'

// Netflix-style curated collection row
// First tile = collection poster, then show cards
export default function CustomRow({ row, onSelectShow }) {
  const shows = (row.custom_row_shows || [])
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map(crs => crs.shows)
    .filter(Boolean)

  if (!shows.length) return null

  return (
    <div className="mb-10 group/row">
      <h2 className="text-white font-bold text-lg md:text-xl mb-3 px-4 md:px-12">{row.title}</h2>

      <div className="relative">
        <div className="flex gap-2 overflow-x-auto px-4 md:px-12 pb-4 no-scrollbar">

          {/* ── Collection poster tile (first, wider than show cards) ─ */}
          <div className="shrink-0 rounded overflow-hidden relative cursor-default border border-gray-700/50"
            style={{ width: '160px', aspectRatio: '2/3' }}>
            {row.poster_url ? (
              <img src={row.poster_url} alt={row.title}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#0d0d0d] flex flex-col justify-end p-3">
                <p className="text-white font-bebas text-2xl leading-tight">{row.title}</p>
              </div>
            )}
          </div>

          {/* ── Show cards ────────────────────────────────────── */}
          {shows.map(show => (
            <ShowCard key={show.id} show={show} onSelect={onSelectShow} />
          ))}
        </div>
      </div>
    </div>
  )
}
