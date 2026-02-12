import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Instagram, Twitter, Youtube } from 'lucide-react';

// Views
import HomeView from './views/HomeView';
import AboutView from './views/AboutView';
import JudgesView from './views/JudgesView';
import SponsorsView from './views/SponsorsView';
import GalleryView from './views/GalleryView';
import FAQView from './views/FAQView';
import ContactView from './views/ContactView';
import ResultsView from './views/ResultsView';
import RegisterView from './views/RegisterView';
import EventsView from './views/EventsView';
import EventDetailView from './views/EventDetailView';
import AdminView from './views/AdminView';

const DESKTOP_NAV_ITEMS = [
  { label: 'Home', page: 'home' },
  {
    label: 'Events',
    page: 'events',
    subItems: [
      { label: 'All Events', page: 'events' },
      { label: 'Judges', page: 'judges' },
      { label: 'Results', page: 'results' },
      { label: 'Sponsors', page: 'sponsors' },
    ],
  },
  { label: 'About', page: 'about' },
  { label: 'Gallery', page: 'gallery' },
  { label: 'FAQ', page: 'faq' },
  { label: 'Contact', page: 'contact' },
];

const TABLET_NAV_ITEMS = [
  { label: 'Home', page: 'home' },
  {
    label: 'Events',
    page: 'events',
    subItems: [
      { label: 'All Events', page: 'events' },
      { label: 'Judges', page: 'judges' },
      { label: 'Results', page: 'results' },
      { label: 'Sponsors', page: 'sponsors' },
    ],
  },
  { label: 'About', page: 'about' },
  { label: 'Contact', page: 'contact' },
];

const MOBILE_NAV_ITEMS = [
  { label: 'HOME', page: 'home' },
  { label: 'EVENTS', page: 'events' },
  { label: 'ABOUT', page: 'about' },
  { label: 'GALLERY', page: 'gallery' },
  { label: 'FAQ', page: 'faq' },
  { label: 'CONTACT', page: 'contact' },
  { label: 'REGISTER', page: 'register' },
];

const ADMIN_SESSION_KEY = 'mix_masters_admin_auth';
const ADMIN_TOKEN_KEY = 'mix_masters_admin_token';
const EMPTY_CONTENT = {
  settings: {
    heroVideoUrl: '',
    heroPosterUrl: '',
    visionImageUrl: '',
    aboutMediaType: 'video',
    aboutMediaUrl: '',
    aboutPosterUrl: '',
    visionTitle: '',
    visionSubtitle: '',
    visionQuote: '',
    visionBody: '',
  },
  events: [],
  judges: [],
  sponsors: [],
  gallery: [],
  faq: [],
  results: { heading: '', subtitle: '', items: [] },
};

function normalizeContent(payload = {}) {
  return {
    settings: payload.settings && typeof payload.settings === 'object'
      ? {
          heroVideoUrl: payload.settings.heroVideoUrl || '',
          heroPosterUrl: payload.settings.heroPosterUrl || '',
          visionImageUrl: payload.settings.visionImageUrl || '',
          aboutMediaType: payload.settings.aboutMediaType === 'image' ? 'image' : 'video',
          aboutMediaUrl: payload.settings.aboutMediaUrl || '',
          aboutPosterUrl: payload.settings.aboutPosterUrl || '',
          visionTitle: payload.settings.visionTitle || '',
          visionSubtitle: payload.settings.visionSubtitle || '',
          visionQuote: payload.settings.visionQuote || '',
          visionBody: payload.settings.visionBody || '',
        }
      : { ...EMPTY_CONTENT.settings },
    events: Array.isArray(payload.events) ? payload.events : [],
    judges: Array.isArray(payload.judges) ? payload.judges : [],
    sponsors: Array.isArray(payload.sponsors) ? payload.sponsors : [],
    gallery: Array.isArray(payload.gallery) ? payload.gallery : [],
    faq: Array.isArray(payload.faq) ? payload.faq : [],
    results: payload.results && typeof payload.results === 'object'
      ? {
          heading: payload.results.heading || '',
          subtitle: payload.results.subtitle || '',
          items: Array.isArray(payload.results.items) ? payload.results.items : [],
        }
      : { ...EMPTY_CONTENT.results },
  };
}

function buildApiRoot(apiBase) {
  const normalized = (apiBase || '').replace(/\/$/, '');
  if (!normalized) return '';
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [preSelectedRole, setPreSelectedRole] = useState('artist');
  const [preSelectedEventId, setPreSelectedEventId] = useState('');
  const [activeEvent, setActiveEvent] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
  );
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [siteContent, setSiteContent] = useState(EMPTY_CONTENT);
  const navDropdownRef = useRef(null);
  const mainEvent = siteContent.events.find((item) => item.isMainEvent) || siteContent.events[0] || null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const apiRoot = buildApiRoot(import.meta.env.VITE_PUBLIC_API_BASE || '');
    if (!apiRoot) return;

    const fetchContent = async () => {
      try {
        const response = await fetch(`${apiRoot}/public/content`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        setSiteContent(normalizeContent(payload));
      } catch {
        // Keep empty defaults when backend is unavailable.
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    const apiRoot = buildApiRoot(import.meta.env.VITE_PUBLIC_API_BASE || '');
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';
    if (!isAdminAuthenticated || adminToken || !apiRoot || !envPassword) return;

    let cancelled = false;
    const recoverAdminToken = async () => {
      try {
        const response = await fetch(`${apiRoot}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: envPassword }),
        });
        if (!response.ok) throw new Error('recover_failed');
        const payload = await response.json();
        if (!payload?.token) throw new Error('missing_token');
        if (cancelled) return;
        console.log('Admin token recovered successfully');
        sessionStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
        setAdminToken(payload.token);
      } catch (err) {
        console.error('Failed to recover admin token:', err);
        if (cancelled) return;
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setIsAdminAuthenticated(false);
      }
    };

    recoverAdminToken();
    return () => {
      cancelled = true;
    };
  }, [isAdminAuthenticated, adminToken]);

  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === '#admin') {
        setActivePage('admin');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    const handleOutside = (event) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('mousedown', handleOutside);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('mousedown', handleOutside);
    };
  }, [isMobileMenuOpen]);

  const navigateTo = (page, role = 'artist', event = null) => {
    setActivePage(page);
    if (page === 'register') {
      setPreSelectedRole(role);
      setPreSelectedEventId(event?.id ? String(event.id) : '');
    }
    if (page === 'event-detail' && event) setActiveEvent(event);
    if (page === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';
    const apiRoot = buildApiRoot(import.meta.env.VITE_PUBLIC_API_BASE || '');

    if (!envPassword) {
      setAdminError('Set VITE_ADMIN_PASSWORD in .env to enable admin login.');
      return;
    }

    if (adminPasswordInput === envPassword) {
      if (apiRoot) {
        try {
          const response = await fetch(`${apiRoot}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPasswordInput }),
          });
          if (!response.ok) {
            setAdminError('Backend login failed. Check backend server and password.');
            return;
          }
          const payload = await response.json();
          if (!payload?.token) {
            setAdminError('Backend login failed. Missing token.');
            return;
          }
          sessionStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
          setAdminToken(payload.token);
        } catch {
          setAdminError('Backend unreachable. Start backend and retry.');
          return;
        }
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      setIsAdminAuthenticated(true);
      setAdminError('');
      setAdminPasswordInput('');
      return;
    }

    setAdminError('Invalid password');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdminAuthenticated(false);
    setAdminToken('');
    setAdminPasswordInput('');
    setAdminError('');
    navigateTo('home');
  };

  const isNavActive = (page) => {
    if (page === 'events') {
      return activePage === 'events' || activePage === 'event-detail';
    }
    return activePage === page;
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#C5A059] selection:text-black">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-[60] transition-all duration-1000 ease-in-out ${scrolled ? 'bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 py-3 md:py-4' : 'bg-transparent py-4 md:py-10'}`}>
        <div className="container mx-auto px-4 sm:px-6 md:px-12 flex justify-between md:justify-center items-center gap-3">
          <div ref={navDropdownRef} className="hidden md:block">
            <div className="hidden lg:flex items-center gap-8 xl:gap-12">
              {DESKTOP_NAV_ITEMS.map((item) => (
                <div key={item.page} className="relative">
                  <button
                    onClick={() => (item.subItems ? setOpenDropdown((prev) => (prev === item.page ? null : item.page)) : navigateTo(item.page))}
                    className={`font-['Montserrat'] text-[10px] uppercase tracking-[0.2em] transition-all duration-500 hover:text-[#C5A059] ${isNavActive(item.page) ? 'text-white border-b border-[#C5A059] pb-1' : 'text-gray-500 border-b border-transparent pb-1'}`}
                  >
                    {item.label}{item.subItems ? ' +' : ''}
                  </button>
                  {item.subItems && (
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 w-44 transition-all duration-200 z-50 ${openDropdown === item.page ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                      <div className="bg-[#0a0a0a] border border-white/10">
                        {item.page === 'events' && mainEvent && (
                          <button
                            onClick={() => navigateTo('event-detail', null, mainEvent)}
                            className="w-full text-left px-4 py-3 font-['Montserrat'] text-[10px] uppercase tracking-[0.18em] transition-colors text-[#C5A059] hover:text-white"
                          >
                            Main Event
                          </button>
                        )}
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.page}
                            onClick={() => navigateTo(subItem.page)}
                            className={`w-full text-left px-4 py-3 font-['Montserrat'] text-[10px] uppercase tracking-[0.18em] transition-colors ${isNavActive(subItem.page) ? 'text-[#C5A059]' : 'text-gray-400 hover:text-white'}`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:flex lg:hidden items-center gap-6">
              {TABLET_NAV_ITEMS.map((item) => (
                <div key={item.page} className="relative">
                  <button
                    onClick={() => (item.subItems ? setOpenDropdown((prev) => (prev === item.page ? null : item.page)) : navigateTo(item.page))}
                    className={`font-['Montserrat'] text-[10px] uppercase tracking-[0.18em] transition-all duration-500 hover:text-[#C5A059] ${isNavActive(item.page) ? 'text-white border-b border-[#C5A059] pb-1' : 'text-gray-500 border-b border-transparent pb-1'}`}
                  >
                    {item.label}{item.subItems ? ' +' : ''}
                  </button>
                  {item.subItems && (
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 w-44 transition-all duration-200 z-50 ${openDropdown === item.page ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                      <div className="bg-[#0a0a0a] border border-white/10">
                        {item.page === 'events' && mainEvent && (
                          <button
                            onClick={() => navigateTo('event-detail', null, mainEvent)}
                            className="w-full text-left px-4 py-3 font-['Montserrat'] text-[10px] uppercase tracking-[0.18em] transition-colors text-[#C5A059] hover:text-white"
                          >
                            Main Event
                          </button>
                        )}
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.page}
                            onClick={() => navigateTo(subItem.page)}
                            className={`w-full text-left px-4 py-3 font-['Montserrat'] text-[10px] uppercase tracking-[0.18em] transition-colors ${isNavActive(subItem.page) ? 'text-[#C5A059]' : 'text-gray-400 hover:text-white'}`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button className="md:hidden text-white hover:text-[#C5A059] transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
              {isMobileMenuOpen ? <X strokeWidth={1} /> : <Menu strokeWidth={1} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-[#050505] flex flex-col items-center justify-center space-y-6 animate-fade-in md:hidden overflow-y-auto py-20 px-4">
          <button
            className="absolute top-5 right-5 text-white hover:text-[#C5A059] transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X strokeWidth={1} />
          </button>
          {MOBILE_NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => navigateTo(item.page)}
              className={`font-['Cinzel'] text-2xl transition-colors tracking-[0.15em] text-center ${isNavActive(item.page) ? 'text-[#C5A059] underline underline-offset-8 decoration-[0.5px]' : 'text-white hover:text-[#C5A059]'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="w-full max-w-xs mt-4 border-t border-white/10 pt-6 space-y-3">
            <p className="font-['Montserrat'] text-[10px] uppercase tracking-[0.2em] text-center text-gray-500">Event Links</p>
            <div className="flex flex-col gap-2">
              {[
                ...(mainEvent ? [{ label: 'MAIN EVENT', page: 'event-detail' }] : []),
                { label: 'ALL EVENTS', page: 'events' },
                { label: 'JUDGES', page: 'judges' },
                { label: 'RESULTS', page: 'results' },
                { label: 'SPONSORS', page: 'sponsors' },
              ].map((subItem) => (
                <button
                  key={`${subItem.page}-${subItem.label}`}
                  onClick={() => subItem.page === 'event-detail' && mainEvent ? navigateTo('event-detail', null, mainEvent) : navigateTo(subItem.page)}
                  className={`font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] py-2 transition-colors ${subItem.page === 'event-detail' ? (activePage === 'event-detail' ? 'text-[#C5A059]' : 'text-gray-300 hover:text-white') : (isNavActive(subItem.page) ? 'text-[#C5A059]' : 'text-gray-300 hover:text-white')}`}
                >
                  {subItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="transition-opacity duration-1000 ease-in-out">
        {activePage === 'home' && (
          <HomeView
            navigateTo={navigateTo}
            mainEvent={mainEvent}
            judges={siteContent.judges}
            sponsors={siteContent.sponsors}
            settings={siteContent.settings}
          />
        )}
        {activePage === 'events' && (
          <EventsView
            events={siteContent.events}
            navigateTo={navigateTo}
            onSelectEvent={(e) => navigateTo('event-detail', null, e)}
          />
        )}
        {activePage === 'event-detail' && <EventDetailView event={activeEvent} navigateTo={navigateTo} onBack={() => navigateTo('events')} />}
        {activePage === 'about' && <AboutView settings={siteContent.settings} />}
        {activePage === 'judges' && <JudgesView judges={siteContent.judges} />}
        {activePage === 'sponsors' && <SponsorsView navigateTo={navigateTo} sponsors={siteContent.sponsors} />}
        {activePage === 'gallery' && <GalleryView gallery={siteContent.gallery} />}
        {activePage === 'faq' && <FAQView faq={siteContent.faq} />}
        {activePage === 'contact' && <ContactView />}
        {activePage === 'results' && <ResultsView navigateTo={navigateTo} results={siteContent.results} />}
        {activePage === 'register' && (
          <RegisterView
            preSelectedRole={preSelectedRole}
            preSelectedEventId={preSelectedEventId}
            events={siteContent.events}
            apiBase={import.meta.env.VITE_PUBLIC_API_BASE || ''}
            navigateTo={navigateTo}
          />
        )}
        {activePage === 'admin' && (
          isAdminAuthenticated ? (
            <AdminView
              onExit={handleAdminLogout}
              apiBase={import.meta.env.VITE_PUBLIC_API_BASE || ''}
              adminToken={adminToken}
              onContentSaved={(nextContent) => setSiteContent(normalizeContent(nextContent))}
            />
          ) : (
            <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505] flex items-center justify-center px-4">
              <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-8 md:p-10">
                <h2 className="font-['Cinzel'] text-3xl text-white mb-2">Admin Access</h2>
                <p className="font-['Montserrat'] text-[10px] uppercase tracking-[0.14em] text-gray-500 mb-8">
                  Simple env-based authentication
                </p>
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-transparent border border-white/15 px-4 py-3 text-white focus:border-[#C5A059] outline-none"
                  />
                  {adminError && (
                    <p className="text-red-400 text-xs uppercase tracking-[0.12em]">{adminError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full border border-[#C5A059] text-[#C5A059] py-3 text-xs uppercase tracking-[0.14em] hover:bg-[#C5A059] hover:text-black transition-colors"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('home')}
                    className="w-full border border-white/20 text-white py-3 text-xs uppercase tracking-[0.14em] hover:border-white transition-colors"
                  >
                    Back to Site
                  </button>
                </form>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] pt-20 md:pt-32 pb-10 md:pb-12 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="text-center md:text-left">
              
             
            </div>
            <div className="flex gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity duration-700">
              <Instagram size={20} strokeWidth={1} className="text-white hover:text-[#C5A059] transition-colors cursor-pointer" />
              <Twitter size={20} strokeWidth={1} className="text-white hover:text-[#C5A059] transition-colors cursor-pointer" />
              <Youtube size={20} strokeWidth={1} className="text-white hover:text-[#C5A059] transition-colors cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20 text-center md:text-left">
            <div>
              <h4 className="font-['Montserrat'] text-[9px] text-white uppercase tracking-[0.2em] mb-6 font-bold">Explore</h4>
              <ul className="space-y-4">
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('about')}>About</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('judges')}>The Council</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('gallery')}>Archive</li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Montserrat'] text-[9px] text-white uppercase tracking-[0.2em] mb-6 font-bold">Details</h4>
              <ul className="space-y-4">
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('faq')}>Intel</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('results')}>Results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Montserrat'] text-[9px] text-white uppercase tracking-[0.2em] mb-6 font-bold">Alliance</h4>
              <ul className="space-y-4">
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('sponsors')}>Partners</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('contact')}>Concierge</li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Montserrat'] text-[9px] text-white uppercase tracking-[0.2em] mb-6 font-bold">Legal</h4>
              <ul className="space-y-4">
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors">Privacy</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors">Terms</li>
                <li className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-[#C5A059] cursor-pointer transition-colors" onClick={() => navigateTo('admin')}>Admin</li>
              </ul>
            </div>
          </div>

          {/* Alliance Footer Strip */}
          <div className="border-t border-white/5 py-12 flex flex-col items-center gap-8">
            <span className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-[0.3em]">Presented By</span>
            <div className="flex flex-wrap justify-center gap-12 opacity-40">
              {siteContent.sponsors.map((p, i) => (
                <span key={i} className="font-['Cinzel'] text-xs text-white uppercase tracking-widest hover:text-[#C5A059] transition-colors cursor-pointer">{p.name}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-12 text-center space-y-4">
            <p className="font-['Montserrat'] text-[9px] text-gray-700 uppercase tracking-widest">© 2026 Mix Masters Club</p>
            <p className="font-['Montserrat'] text-[9px] text-gray-600 uppercase tracking-widest">
              Developed by{' '}
              <a 
                href="https://www.t4gverse.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#C5A059] hover:text-[#E5C580] transition-colors"
              >
                T4GVerse
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
