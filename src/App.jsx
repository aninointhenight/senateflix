import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home             from './pages/Home'
import Films            from './pages/Films'
import Series           from './pages/Series'
import MyFlix           from './pages/MyFlix'
import Admin            from './pages/Admin'
import DisclaimerPopup  from './components/DisclaimerPopup'

export default function App() {
  return (
    <BrowserRouter>
      <DisclaimerPopup />
      <Routes>
        <Route path="/"        element={<Home   />} />
        <Route path="/films"   element={<Films  />} />
        <Route path="/series"  element={<Series />} />
        <Route path="/my-flix" element={<MyFlix />} />
        <Route path="/admin"   element={<Admin  />} />
      </Routes>
    </BrowserRouter>
  )
}
