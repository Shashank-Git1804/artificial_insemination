import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import {
  MdDashboard, MdThermostat, MdBiotech, MdCalendarMonth,
  MdWaterDrop, MdVaccines, MdHistory, MdBarChart, MdLogout,
  MdMenu, MdWarning, MdAssignment, MdAnalytics,
  MdVerified, MdChevronLeft, MdChevronRight, MdClose,
  MdPhone, MdEmail, MdLanguage, MdLocationOn,
} from 'react-icons/md';
import { GiCow } from 'react-icons/gi';
import { FaCow } from 'react-icons/fa6';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हि' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const farmerNav = [
    { to: '/farmer/dashboard',           label: t('dashboard'),     icon: <MdDashboard /> },
    { to: '/farmer/animals',             label: t('myAnimals'),     icon: <FaCow /> },
    { to: '/farmer/heat-detection',      label: t('heatDetection'), icon: <MdThermostat /> },
    { to: '/farmer/infection-detection', label: t('healthCheck'),   icon: <MdBiotech /> },
    { to: '/farmer/appointments',        label: t('appointments'),  icon: <MdCalendarMonth /> },
    { to: '/farmer/milk-tracker',        label: t('milkTracker'),   icon: <MdWaterDrop /> },
    { to: '/farmer/vaccination',         label: t('vaccination'),   icon: <MdVaccines /> },
    { to: '/farmer/history',             label: t('history'),       icon: <MdHistory /> },
    { to: '/farmer/analytics',           label: lang==='kn'?'ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'विश्लेषण':'Analytics', icon: <MdBarChart /> },
  ];

  const centreNav = [
    { to: '/centre/dashboard',    label: t('dashboard'),    icon: <MdDashboard /> },
    { to: '/centre/appointments', label: t('appointments'), icon: <MdCalendarMonth /> },
    { to: '/centre/alerts',       label: lang==='kn'?'ಎಚ್ಚರಿಕೆ':lang==='hi'?'चेतावनी':'Alerts',     icon: <MdWarning /> },
    { to: '/centre/reports',      label: lang==='kn'?'ವರದಿ':lang==='hi'?'रिपोर्ट':'Reports',         icon: <MdAssignment /> },
    { to: '/centre/analytics',    label: lang==='kn'?'ವಿಶ್ಲೇಷಣೆ':lang==='hi'?'विश्लेषण':'Analytics', icon: <MdAnalytics /> },
  ];

  const nav = user?.role === 'farmer' ? farmerNav : centreNav;
  const currentPage = nav.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard';
  const sidebarCollapsed = !isMobile && collapsed;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className={`layout${sidebarCollapsed ? ' layout--collapsed' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon"><GiCow /></div>
          {!sidebarCollapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">Jeeva <span className="sidebar__brand-kn">ಜೀವ</span></span>
              <span className="sidebar__brand-sub">Karnataka Govt · AI Livestock</span>
            </div>
          )}
          {!isMobile && (
            <button className="sidebar__toggle" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
              {sidebarCollapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
            </button>
          )}
          {isMobile && (
            <button className="sidebar__toggle" onClick={() => setMobileOpen(false)} title="Close">
              <MdClose size={18} />
            </button>
          )}
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar">{user?.name?.[0]?.toUpperCase()}</div>
          {!sidebarCollapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-role">
                {user?.role === 'farmer' ? (lang==='kn'?'ರೈತ':lang==='hi'?'किसान':'Farmer') : 'AI Centre'}
              </span>
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          {nav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`}
              title={sidebarCollapsed ? label : undefined}>
              <span className="sidebar__nav-icon">{icon}</span>
              {!sidebarCollapsed && <span className="sidebar__nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar__logout" onClick={handleLogout} title={sidebarCollapsed ? t('logout') : undefined}>
          <MdLogout size={18} />
          {!sidebarCollapsed && <span>{t('logout')}</span>}
        </button>
      </aside>

      {mobileOpen && <div className="sidebar__overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Right column: header + content + footer ── */}
      <div className={`main-wrapper${sidebarCollapsed ? ' main-wrapper--collapsed' : ''}`}>

        <header className="topbar">
          <div className="topbar__left">
            <button className="topbar__hamburger" onClick={() => setMobileOpen(o => !o)}>
              <MdMenu size={22} />
            </button>
            <div className="topbar__breadcrumb">
              <GiCow className="topbar__cow" />
              <span className="topbar__site">Jeeva</span>
              <MdChevronRight size={15} className="topbar__sep" />
              <span className="topbar__page">{currentPage}</span>
            </div>
          </div>
          <div className="topbar__right">
            <div className="topbar__lang">
              {LANGS.map(l => (
                <button key={l.code}
                  className={`topbar__lang-btn${lang === l.code ? ' topbar__lang-btn--active' : ''}`}
                  onClick={() => changeLang(l.code)}>{l.label}
                </button>
              ))}
            </div>
            <div className="topbar__badge">
              <MdVerified size={14} />
              <span className="topbar__badge-text">{lang==='kn'?'ಕರ್ನಾಟಕ ಸರ್ಕಾರ':lang==='hi'?'कर्नाटक सरकार':'Govt of Karnataka'}</span>
            </div>
            <div className="topbar__user">
              <div className="topbar__avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="topbar__username">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="app-footer__inner">
            <div className="app-footer__brand">
              <div className="app-footer__logo"><GiCow /> Jeeva — ಜೀವ</div>
              <p className="app-footer__desc">
                {lang==='kn'?'ಕರ್ನಾಟಕ ಸರ್ಕಾರದ AI ಪಶು ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್'
                  :lang==='hi'?'कर्नाटक सरकार का AI पशु प्रबंधन पोर्टल'
                  :'Karnataka Govt AI Livestock Management Portal'}
              </p>
              <p className="app-footer__ref">Project Ref: 49S_BE_4806 · AMC Engineering College</p>
            </div>
            <div className="app-footer__helpline">
              <div className="app-footer__section-title"><MdPhone size={13} />{lang==='kn'?'ಸಹಾಯವಾಣಿ':lang==='hi'?'हेल्पलाइन':'Helpline'}</div>
              <a href="tel:18004258585" className="app-footer__toll-free">🆓 1800-425-8585</a>
              <p className="app-footer__note">{lang==='kn'?'ಉಚಿತ · ಸೋಮ–ಶನಿ · 9AM–6PM':lang==='hi'?'निःशुल्क · सोम–शनि · 9AM–6PM':'Toll Free · Mon–Sat · 9AM–6PM'}</p>
              <a href="tel:08022213761" className="app-footer__alt-phone">📱 080-2221-3761</a>
            </div>
            <div className="app-footer__contact">
              <div className="app-footer__section-title"><MdEmail size={13} />{lang==='kn'?'ಸಂಪರ್ಕ':lang==='hi'?'संपर्क':'Contact'}</div>
              <div className="app-footer__link-row"><MdEmail size={12} /><a href="mailto:ahvs@karnataka.gov.in">ahvs@karnataka.gov.in</a></div>
              <div className="app-footer__link-row"><MdLanguage size={12} /><a href="https://ahvs.karnataka.gov.in" target="_blank" rel="noreferrer">ahvs.karnataka.gov.in</a></div>
              <div className="app-footer__link-row"><MdLocationOn size={12} /><span>{lang==='kn'?'ಪಶು ಸಂಪದ ಭವನ, ಬೆಂಗಳೂರು':lang==='hi'?'पशु संपदा भवन, बेंगलुरु':'Pashu Sampada Bhavan, Bengaluru'}</span></div>
            </div>
          </div>
          <div className="app-footer__bottom">
            <span>© {new Date().getFullYear()} Government of Karnataka · Jeeva Portal</span>
            <span className="app-footer__sep">·</span>
            <span>v1.0 · AMC Engineering College, ISE Dept</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
