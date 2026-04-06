import { useState, useEffect } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

const SECTIONS = ['hero', 'about', 'skills', 'projects', 'contact']

const NAV_KEYS = ['#about', '#skills', '#projects', '#contact'] as const
type NavKey = (typeof NAV_KEYS)[number]

export default function Nav() {
  const { language, toggleLanguage, t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  // Scroll → blurred background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // IntersectionObserver for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.35 }
    )

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLabels: Record<NavKey, string> = {
    '#about': t('nav.about'),
    '#skills': t('nav.skills'),
    '#projects': t('nav.projects'),
    '#contact': t('nav.contact'),
  }

  const navIds: Record<NavKey, string> = {
    '#about': 'about',
    '#skills': 'skills',
    '#projects': 'projects',
    '#contact': 'contact',
  }

  const handleNavClick = (href: NavKey) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#hero" className="nav-logo">PS</a>

          <div className="nav-desktop">
            {NAV_KEYS.map((key) => (
              <a
                key={key}
                href={key}
                className={`nav-link ${activeSection === navIds[key] ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(key)
                }}
              >
                {navLabels[key]}
              </a>
            ))}
            <button className="nav-lang" onClick={toggleLanguage}>
              {language === 'pt' ? 'EN' : 'PT'}
            </button>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className={mobileOpen ? 'open' : ''} />
            <span className={mobileOpen ? 'open' : ''} />
            <span className={mobileOpen ? 'open' : ''} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-inner">
          {NAV_KEYS.map((key) => (
            <a
              key={key}
              href={key}
              className={`mobile-link ${activeSection === navIds[key] ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(key)
              }}
            >
              {navLabels[key]}
            </a>
          ))}
          <button className="mobile-lang" onClick={toggleLanguage}>
            {language === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>
      </div>
    </>
  )
}
