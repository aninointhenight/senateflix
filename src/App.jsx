import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home            from './pages/Home'
import Films           from './pages/Films'
import Series          from './pages/Series'
import MyFlix          from './pages/MyFlix'
import About           from './pages/About'
import Admin           from './pages/Admin'
import DisclaimerPopup from './components/DisclaimerPopup'

export default function App() {
  return (
    <BrowserRouter>
      <DisclaimerPopup />
      <Analytics />
      <Routes>
        <Route path="/"        element={<Home   />} />
        <Route path="/films"   element={<Films  />} />
        <Route path="/series"  element={<Series />} />
        <Route path="/my-flix" element={<MyFlix />} />
        <Route path="/about"   element={<About  />} />
        <Route path="/admin"   element={<Admin  />} />
      </Routes>
    </BrowserRouter>
  )
}
