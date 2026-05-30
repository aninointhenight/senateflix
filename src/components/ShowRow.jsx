import { useRef, useState } from 'react'
import ShowCard from './ShowCard'

export default function ShowRow({ title, shows, onSelectShow }) {
  const rowRef               = useRef(null)
  const [canLeft,  setLeft]  = useState(false)
  const [canRight, setRight] = useState(true)

  function scroll(dir) {
    const el = rowRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' })
  }

  function updateArrows() {
    const el = rowRef.current
    if (!el) return
    setLeft(el.scrollLeft > 4)
    setRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  if (!shows?.length) return null

  return (
    <div className="mb-10 group/row">
      {/* Row heading */}
      <h2 className="text-white font-bold text-lg md:text-xl mb-3 px-4 md:px-12">
        {title}
      </h2>

      <div className="relative">
        {/* Left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 z-20 w-14 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <svg className="w-7 h-7 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {canRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 z-20 w-14 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <svg className="w-7 h-7 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Scrollable cards */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex gap-2 overflow-x-auto px-4 md:px-12 pb-4 no-scrollbar"
        >
          {shows.map(show => (
            <ShowCard key={show.id} show={show} onSelect={onSelectShow} />
          ))}
        </div>
      </div>
    </div>
  )
}
