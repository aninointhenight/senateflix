import { useState, useEffect } from 'react'

export default function DisclaimerPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('sf_disclaimer')
    if (!dismissed) setTimeout(() => setVisible(true), 400)
  }, [])

  function dismiss() {
    localStorage.setItem('sf_disclaimer', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center modal-backdrop modal-backdrop-enter"
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div
        className="w-full max-w-sm mx-4 p-8 text-center rounded-2xl modal-enter"
        style={{
          background: 'rgba(16,16,16,0.88)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
        }}
      >
        <p className="font-bebas text-sf-red text-5xl tracking-widest mb-1">SENATEFLIX</p>
        <div className="w-10 h-0.5 bg-sf-red mx-auto mb-5" />
        <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-3">Disclaimer</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          <span className="text-white font-semibold">Senateflix</span> is a satirical parody website.
          The "shows" listed here are for political commentary and entertainment purposes only.
        </p>
        <button
          onClick={dismiss}
          className="bg-sf-red hover:bg-red-700 active:scale-95 text-white font-bold text-sm uppercase tracking-wider px-10 py-3 rounded-full transition-all"
        >
          I Understand
        </button>
      </div>
    </div>
  )
}
