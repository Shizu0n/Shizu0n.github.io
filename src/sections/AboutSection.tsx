import { useRef } from 'react'
import { motion, useInView, Variants } from 'framer-motion'
import { useTranslation } from '../contexts/TranslationContext'
import { useGitHub } from '../contexts/GitHubContext'

export default function AboutSection() {
  const { t } = useTranslation()
  const { stats, user } = useGitHub()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, staggerDirection: 1 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'circOut' },
    },
  }

  const startedYear = user?.created_at
    ? new Date(user.created_at).getFullYear().toString()
    : '2024'

  return (
    <section id="about" ref={ref} className="about-section">
      <div className="about-inner">
        <motion.div
          className="about-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Decorative number */}
          <span className="about-deco-number" aria-hidden="true">
            01
          </span>

          {/* Left column */}
          <div className="about-left">
            <motion.p className="about-label" variants={item}>
              ABOUT
            </motion.p>

            <motion.h2 className="about-headline" variants={item}>
              CS Student &amp;{'\n'}
              AI Engineer{'\n'}
              in the <em>making.</em>
            </motion.h2>

            <motion.hr className="about-rule" variants={item} />
          </div>

          {/* Right column */}
          <div className="about-right">
            <motion.p className="about-bio" variants={item}>
              {t('hero.description')}
            </motion.p>

            <motion.div className="about-stats" variants={item}>
              <div className="about-stat">
                <span className="about-stat-number">
                  {stats?.totalRepos ?? 0}
                </span>
                <span className="about-stat-label">REPOS</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">{startedYear}</span>
                <span className="about-stat-label">STARTED CODING</span>
              </div>
            </motion.div>

            <motion.p className="about-location" variants={item}>
              Fortaleza, CE — Brazil
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
