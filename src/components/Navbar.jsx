import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/projects', label: 'Projects' },
  { to: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-name">AgentHub</span>
      </div>

      {/* Burger button — visible on mobile */}
      <button
        className="burger-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Nav links */}
      <ul className={`navbar-links ${open ? 'open' : ''}`}>
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
