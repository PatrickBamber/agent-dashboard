import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/projects', label: 'Projects' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-name">AgentHub</span>
      </div>
      <ul className="navbar-links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
