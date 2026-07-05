import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { useGitHub } from '../contexts/GitHubContext'
import { useTranslation } from '../contexts/TranslationContext'

const range = (
  progress: ReturnType<typeof useSpring>,
  inputRange: number[],
  outputRange: [number, ...number[]],
) => useTransform(progress, inputRange, outputRange)

export default function AboutSection() {
  const { t } = useTranslation()
  const { stats } = useGitHub()
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

  // Degree (and hands-on coding) started Jan 2024 — the GitHub account year reads later
  // and used to surface a wrong "started coding" year here.
  const startedYear = '2024'

  // Public, verifiable deployments: ReAct Agent (Vercel), Advanced RAG (Streamlit),
  // Phi-3 demo (HF Spaces), and this portfolio.
  const liveDemos = 4

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
              <p className="section-kicker">{t('about.kicker')}</p>
              <h2 className="section-title">
                {t('about.title')}
              </h2>
              <p className="section-body">
                {t('about.body')}
              </p>
            </motion.div>

            <motion.div className="about-proof-panel" style={{ y: panelY }}>
              <div className="about-stat-grid">
                <div className="about-stat-block">
                  <span className="about-stat-value">{stats?.totalRepos ?? 0}</span>
                  <span className="about-stat-label">{t('about.stats.repos')}</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{liveDemos}</span>
                  <span className="about-stat-label">{t('about.stats.demos')}</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{startedYear}</span>
                  <span className="about-stat-label">{t('about.stats.started')}</span>
                </div>
                <div className="about-stat-block">
                  <span className="about-stat-value">{stats?.followers ?? 0}</span>
                  <span className="about-stat-label">{t('about.stats.followers')}</span>
                </div>
              </div>

              <div className="about-proof-list">
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">{t('about.proof.focus')}</span>
                  <strong>{t('about.proof.focus.val')}</strong>
                </div>
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">{t('about.proof.stack')}</span>
                  <strong>{topLanguages}</strong>
                </div>
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">{t('about.proof.style')}</span>
                  <strong>{t('about.proof.style.val')}</strong>
                </div>
                <div className="about-proof-item">
                  <span className="about-proof-eyebrow">{t('about.proof.open')}</span>
                  <strong>{t('about.proof.open.val')}</strong>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div className="about-floating-note about-floating-note--one" style={{ y: noteY }}>
            {t('about.note.one')}
          </motion.div>

          <motion.div className="about-floating-note about-floating-note--two" style={{ y: useTransform(noteY, value => value * -1) }}>
            {t('about.note.two')}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
