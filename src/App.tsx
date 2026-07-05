import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { GitHubProvider } from './contexts/GitHubContext'
import { TranslationProvider } from './contexts/TranslationContext'
import HeroSection from './sections/HeroSection'
import AboutSection from './sections/AboutSection'
import SkillsSection from './sections/SkillsSection'
import ProjectsSection from './sections/ProjectsSection'
import ContactSection from './sections/ContactSection'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import FloatingChat from './components/FloatingChat'

// Lazy-loaded so three.js ships in its own chunk and never blocks first paint.
const CosmicDustBackground = lazy(() => import('./components/CosmicDustBackground'))

// React.lazy still starts fetching on first render; the scene chunk must wait until
// the page has fully loaded and the main thread is idle before it even downloads.
const useDeferredBackground = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleId: number | undefined
    let cancelled = false

    const schedule = () => {
      if (cancelled) return
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => setReady(true), { timeout: 3000 })
      } else {
        idleId = window.setTimeout(() => setReady(true), 300)
      }
    }

    if (document.readyState === 'complete') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', schedule)
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId)
        } else {
          clearTimeout(idleId)
        }
      }
    }
  }, [])

  return ready
}

export default function App() {
  const lenisRef = useRef<Lenis | null>(null)
  const backgroundReady = useDeferredBackground()

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])

  // Inject JSON-LD structured data for SEO
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Paulo Shizuo',
      url: 'https://shizu0n.vercel.app/',
      jobTitle: 'Computer Science Student',
      knowsAbout: [
        'AI Engineering',
        'Machine Learning',
        'Large Language Models',
        'Retrieval-Augmented Generation',
        'LLM Agents',
        'Full-Stack Development',
      ],
      sameAs: [
        'https://github.com/Shizu0n',
        'https://www.linkedin.com/in/paulo-shizuo/',
      ],
    })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  return (
    <TranslationProvider>
      <GitHubProvider>
        {backgroundReady && (
          <Suspense fallback={null}>
            <CosmicDustBackground />
          </Suspense>
        )}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ScrollProgress />
        <Nav />
        <main id="main-content" className="app-shell">
          <HeroSection />
          <AboutSection />
          <SkillsSection />
          <ProjectsSection />
          <ContactSection />
        </main>
        <Footer />
        <FloatingChat />
      </GitHubProvider>
    </TranslationProvider>
  )
}
