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

function AppHeader({ user, lang, onMenuClick }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="hamburger-inline" onClick={onMenuClick} aria-label="Menu">☰</button>
        <div className="app-header-brand">
          <span className="app-header-logo">🌱</span>
          <div>
            <div className="app-header-title">Jeeva <span className="app-header-kannada">ಜೀವ</span></div>
            <div className="app-header-sub">Karnataka Govt · AI Livestock Management</div>
          </div>
        </div>
      </div>
      <div className="app-header-right">
        <div className="app-header-badge">
          <span>🏛️</span>
          <span className="app-header-badge-text">
            {lang === 'kn' ? 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ' : lang === 'hi' ? 'कर्नाटक सरकार' : 'Govt of Karnataka'}
          </span>
        </div>
        {user && (
          <div className="app-header-user">
            <div className="app-header-avatar">{user.name?.[0]?.toUpperCase()}</div>
            <span className="app-header-username">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}

function AppFooter({ lang }) {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-name">🌱 Jeeva — ಜೀವ</div>
          <div className="footer-brand-desc">
            {lang === 'kn'
              ? 'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ AI ಪಶು ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್'
              : lang === 'hi'
              ? 'कर्नाटक सरकार का AI पशु प्रबंधन पोर्टल'
              : 'Karnataka Govt AI Livestock Management Portal'}
          </div>
          <div className="footer-brand-ref">Project Ref: 49S_BE_4806 · AMC Engineering College</div>
        </div>

        {/* Helpline */}
        <div className="footer-helpline">
          <div className="footer-section-title">
            📞 {lang === 'kn' ? 'ಸಹಾಯವಾಣಿ' : lang === 'hi' ? 'हेल्पलाइन' : 'Helpline'}
          </div>
          <a href="tel:18004258585" className="footer-helpline-number">
            🆓 1800-425-8585
          </a>
          <div className="footer-helpline-note">
            {lang === 'kn' ? 'ಉಚಿತ · ಸೋಮ–ಶನಿ · ಬೆಳಿಗ್ಗೆ 9 – ಸಂಜೆ 6'
              : lang === 'hi' ? 'निःशुल्क · सोम–शनि · सुबह 9 – शाम 6'
              : 'Toll Free · Mon–Sat · 9 AM – 6 PM'}
          </div>
          <a href="tel:08022213761" className="footer-helpline-alt">
            📱 080-2221-3761
          </a>
          <div className="footer-helpline-note">
            {lang === 'kn' ? 'ಪಶು ಸಂಗೋಪನಾ ಇಲಾಖೆ, ಬೆಂಗಳೂರು'
              : lang === 'hi' ? 'पशुपालन विभाग, बेंगलुरु'
              : 'Dept of Animal Husbandry, Bengaluru'}
          </div>
        </div>

        {/* Quick links */}
        <div className="footer-links">
          <div className="footer-section-title">
            🔗 {lang === 'kn' ? 'ಸಂಪರ್ಕ' : lang === 'hi' ? 'संपर्क' : 'Contact'}
          </div>
          <div className="footer-link-item">
            <span>📧</span>
            <a href="mailto:ahvs@karnataka.gov.in">ahvs@karnataka.gov.in</a>
          </div>
          <div className="footer-link-item">
            <span>🌐</span>
            <a href="https://ahvs.karnataka.gov.in" target="_blank" rel="noreferrer">
              ahvs.karnataka.gov.in
            </a>
          </div>
          <div className="footer-link-item">
            <span>📍</span>
            <span>
              {lang === 'kn' ? 'ಪಶು ಸಂಗೋಪನಾ ಭವನ, ಬೆಂಗಳೂರು'
                : lang === 'hi' ? 'पशुपालन भवन, बेंगलुरु'
                : 'Pashu Sampada Bhavan, Bengaluru'}
            </span>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Government of Karnataka · Jeeva Portal</span>
        <span className="footer-bottom-sep">·</span>
        <span>
          {lang === 'kn' ? 'ಎಲ್ಲ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ'
            : lang === 'hi' ? 'सर्वाधिकार सुरक्षित'
            : 'All rights reserved'}
        </span>
        <span className="footer-bottom-sep">·</span>
        <span>v1.0 · AMC Engineering College, ISE Dept</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

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
      {/* Top header */}
      <AppHeader user={user} lang={lang} onMenuClick={() => setSidebarOpen(o => !o)} />

      {/* Sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

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

      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
        <AppFooter lang={lang} />
      </div>
    </div>
  );
}
