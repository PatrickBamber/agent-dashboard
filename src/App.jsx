import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import './App.css'

function Placeholder({ title }) {
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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Placeholder title="Tasks" />} />
        <Route path="/projects" element={<Placeholder title="Projects" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
