import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिंदी' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const farmerNav = [
    { to: '/farmer/dashboard',           label: t('dashboard'),     icon: '🏠' },
    { to: '/farmer/animals',             label: t('myAnimals'),     icon: '🐄' },
    { to: '/farmer/heat-detection',      label: t('heatDetection'), icon: '🌡️' },
    { to: '/farmer/infection-detection', label: t('healthCheck'),   icon: '🔬' },
    { to: '/farmer/appointments',        label: t('appointments'),  icon: '📅' },
    { to: '/farmer/milk-tracker',        label: t('milkTracker'),   icon: '🥛' },
    { to: '/farmer/vaccination',         label: t('vaccination'),   icon: '💉' },
    { to: '/farmer/history',             label: t('history'),       icon: '📋' },
    { to: '/farmer/analytics',           label: lang==='kn'?'ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'विश्लेषण':'Analytics', icon: '📊' },
  ];

  const centreNav = [
    { to: '/centre/dashboard',    label: t('dashboard'),    icon: '🏠' },
    { to: '/centre/appointments', label: t('appointments'), icon: '📅' },
    { to: '/centre/alerts',       label: lang==='kn'?'ಎಚ್ಚರಿಕೆ':lang==='hi'?'चेतावनी':'Alerts', icon: '🚨' },
    { to: '/centre/reports',      label: lang==='kn'?'ವರದಿ':lang==='hi'?'रिपोर्ट':'Reports', icon: '📋' },
    { to: '/centre/analytics',    label: lang==='kn'?'ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'विश्लेषण':'Analytics', icon: '📊' },
  ];

  const nav = user?.role === 'farmer' ? farmerNav : centreNav;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Hamburger — mobile only */}
      <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay — mobile only */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">🌱 Jeeva</div>
          <div className="logo-sub">ಜೀವ</div>
          <div className="govt-tag">Karnataka Govt</div>
        </div>

        <div className="lang-switcher">
          {LANGS.map(l => (
            <button key={l.code}
              className={`lang-btn ${lang === l.code ? 'active' : ''}`}
              onClick={() => changeLang(l.code)}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="user-info">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role === 'farmer' ? '👨🌾' : '🏥'} {user?.role === 'farmer' ? (lang==='kn'?'ರೈತ':lang==='hi'?'किसान':'Farmer') : 'AI Centre'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 {t('logout')}
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
