import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import './App.css'

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: '2rem', color: 'var(--text-dim)' }}>
      <h2>{title}</h2>
      <p>Coming soon...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <BottomNav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Placeholder title="Projects" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
