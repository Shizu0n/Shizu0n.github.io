import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from '../contexts/TranslationContext'

const ROW_1 = [
  'TypeScript', 'React', 'Node.js', 'NestJS', 'Ruby on Rails',
  'PostgreSQL', 'Docker', 'REST APIs', 'JWT', 'Spring Boot',
]

const ROW_2 = [
  'Java', 'Kotlin', 'Python', 'Git', 'Vite',
  'Tailwind', 'Framer Motion', 'Firebase', 'SQLite', 'Android',
]

export default function SkillsSection() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [paused, setPaused] = useState(false)

  const pauseClass = paused ? 'skills-marquee-paused' : ''

  return (
    <section id="skills" ref={ref} className="skills-section">
      <div className="skills-inner">
        {/* Decorative number */}
        <span className="skills-deco-number" aria-hidden="true">
          02
        </span>

        {/* Header */}
        <motion.p
          className="skills-label"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {t('skills.title').toUpperCase()}
        </motion.p>

        <motion.h2
          className="skills-headline"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Tools I work{'\n'}
          with daily&nbsp;<em>today.</em>
        </motion.h2>

        <motion.hr
          className="skills-rule"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Marquee rows */}
        <div
          className="skills-marquee-wrap"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Row 1 — left */}
          <div className={`skills-marquee skills-marquee--left ${pauseClass}`}>
            <div className="skills-marquee-track">
              {[...ROW_1, ...ROW_1].map((s, i) => (
                <span key={`r1-${i}`} className="skills-tag">{s}</span>
              ))}
            </div>
          </div>

          {/* Row 2 — right */}
          <div className={`skills-marquee skills-marquee--right ${pauseClass}`}>
            <div className="skills-marquee-track">
              {[...ROW_2, ...ROW_2].map((s, i) => (
                <span key={`r2-${i}`} className="skills-tag">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
