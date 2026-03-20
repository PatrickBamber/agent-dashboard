import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/tasks', label: 'Tasks', icon: '◎' },
  { to: '/projects', label: 'Projects', icon: '◉' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, label, icon }) => (
        <Link
          key={to}
          to={to}
          className={`bottom-tab ${location.pathname === to ? 'active' : ''}`}
        >
          <span className="tab-icon">{icon}</span>
          <span className="tab-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
