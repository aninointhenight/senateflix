import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Admin from './pages/Admin'
import DisclaimerPopup from './components/DisclaimerPopup'

export default function App() {
  return (
    <BrowserRouter>
      <DisclaimerPopup />
      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
