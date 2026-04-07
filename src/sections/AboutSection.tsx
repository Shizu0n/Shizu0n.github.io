import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { useGitHub } from '../contexts/GitHubContext'

const range = (
  progress: ReturnType<typeof useSpring>,
  inputRange: number[],
  outputRange: [number, ...number[]],
) => useTransform(progress, inputRange, outputRange)

export default function AboutSection() {
  const { stats, user } = useGitHub()
  const sectionRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 220 : 100,
    damping: prefersReducedMotion ? 36 : 24,
    restDelta: 0.001,
  })

  const headlineY = range(progress, [0, 0.5, 1], [prefersReducedMotion ? 0 : 28, 0, prefersReducedMotion ? 0 : -32])
  const panelY = range(progress, [0, 0.5, 1], [prefersReducedMotion ? 0 : 54, 0, prefersReducedMotion ? 0 : -20])
  const watermarkY = range(progress, [0, 1], [prefersReducedMotion ? 0 : 60, prefersReducedMotion ? 0 : -60])
  const noteY = range(progress, [0, 1], [prefersReducedMotion ? 0 : 8, prefersReducedMotion ? 0 : -8])
  const watermarkOpacity = range(progress, [0, 0.35, 0.75, 1], [0.08, 0.16, 0.12, 0.05])

  const startedYear = user?.created_at
    ? new Date(user.created_at).getFullYear().toString()
    : '2024'

  const topLanguages = useMemo(() => {
    if (!stats?.topLanguages.length) {
      return 'TypeScript / React / Java'
    }

    return stats.topLanguages
      .slice(0, 3)
      .map(language => language.name)
      .join(' / ')
  }, [stats?.topLanguages])

  return (
    <section id="about" className="about-section">
      <div ref={sectionRef} className="about-stage">
        <div className="about-sticky">
          <motion.span
            className="about-watermark"
            aria-hidden="true"
            style={{ y: watermarkY, opacity: watermarkOpacity }}
          >
            PROOF
          </motion.span>

          <div className="about-grid">
            <motion.div className="about-intro" style={{ y: headlineY }}>
              <p className="section-kicker">Act 02 / Credentials</p>
              <h2 className="section-title">
                A developer focused on clean systems, measured motion, and product-ready delivery.
              </h2>
              <p className="section-body">
                Computer Science student with hands-on experience building interfaces, APIs, and polished front-end work that balances clarity with atmosphere.
              </p>
            </motion.div>

            <motion.div className="about-proof-panel" style={{ y: panelY }}>
              <div className="about-stat-grid">
                <div className="about-stat-block">
                  <span className="about-stat-value">{stats?.totalRepos ?? 0}</span>
                  <span className="about-stat-label">Public repos</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{stats?.totalStars ?? 0}</span>
                  <span className="about-stat-label">Stars earned</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{startedYear}</span>
                  <span className="about-stat-label">Started coding</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{stats?.followers ?? 0}</span>
                  <span className="about-stat-label">GitHub followers</span>
                </div>
              </div>

              <div className="about-proof-list">
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">Current base</span>
                  <strong>Fortaleza, Brazil</strong>
                </div>
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">Most used stack</span>
                  <strong>{topLanguages}</strong>
                </div>
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">Working style</span>
                  <strong>Minimal interfaces, strong hierarchy, dependable implementation.</strong>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div className="about-floating-note about-floating-note--one" style={{ y: noteY }}>
            Building across front-end surfaces and backend rules.
          </motion.div>

          <motion.div className="about-floating-note about-floating-note--two" style={{ y: useTransform(noteY, value => value * -1) }}>
            Editorial restraint with enough motion to feel alive.
          </motion.div>
        </div>
      </div>
    </section>
  )
}
