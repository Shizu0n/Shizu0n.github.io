import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from '../contexts/TranslationContext'

const projects = [
  {
    id: 'referral-system',
    title: 'ReferralSystem',
    tags: ['TypeScript', 'NestJS', 'React', 'SQLite'],
    year: '2024',
    category: 'Full Stack',
    url: 'https://github.com/Shizu0n/ReferralSystem',
    wide: true,
  },
  {
    id: 'delivery-system',
    title: 'DeliverySystem',
    tags: ['JavaScript', 'React', 'Node.js', 'MySQL'],
    year: '2024',
    category: 'Full Stack',
    url: 'https://github.com/Shizu0n/DeliverySystem',
  },
  {
    id: 'api-ecommerce',
    title: 'E-commerce API',
    tags: ['Ruby on Rails', 'PostgreSQL', 'Docker'],
    year: '2025',
    category: 'Backend',
    url: 'https://github.com/Shizu0n',
  },
  {
    id: 'academic-system',
    title: 'AcademicSystem',
    tags: ['Java', 'MySQL', 'JDBC'],
    year: '2024',
    category: 'Backend',
    url: 'https://github.com/Shizu0n/AcademicSystem',
    wide: true,
  },
  {
    id: 'gym-app',
    title: 'GymApp Mobile',
    tags: ['Kotlin', 'Firebase', 'Android'],
    year: '2025',
    category: 'Mobile',
    url: 'https://github.com/Shizu0n',
  },
  {
    id: 'portfolio',
    title: 'This Portfolio',
    tags: ['React', 'TypeScript', 'Framer Motion'],
    year: '2025',
    category: 'Frontend',
    url: 'https://github.com/Shizu0n/Shizu0n.github.io',
  },
]

export default function ProjectsSection() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section id="projects" ref={ref} className="projects-section">
      <div className="projects-inner">
        {/* Decorative number */}
        <span className="projects-deco-number" aria-hidden="true">
          03
        </span>

        {/* Header */}
        <motion.p
          className="projects-label"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {t('projects.title').toUpperCase()}
        </motion.p>

        <motion.h2
          className="projects-headline"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Selected{'\n'}
          work&nbsp;<em>that</em>{'\n'}
          I&#39;m&nbsp;<em>proud&nbsp;of.</em>
        </motion.h2>

        <motion.hr
          className="projects-rule"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Projects grid */}
        <div className="projects-grid">
          {projects.map((p, i) => (
            <motion.a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`projects-card ${p.wide ? 'projects-card--wide' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="projects-card-top">
                <span className="projects-card-category">{p.category}</span>
                <span className="projects-card-year">{p.year}</span>
              </div>

              <div className="projects-card-bottom">
                <h3 className="projects-card-title">{p.title}</h3>
                <div className="projects-card-tags">
                  {p.tags.map((tag) => (
                    <span key={tag} className="projects-card-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <span
                className={`projects-card-arrow ${
                  hovered === p.id ? 'projects-card-arrow--hover' : ''
                }`}
              >
                →
              </span>
            </motion.a>
          ))}
        </div>

        {/* GitHub link */}
        <motion.div
          className="projects-github"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <a
            href="https://github.com/Shizu0n"
            target="_blank"
            rel="noopener noreferrer"
          >
            View all on GitHub →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
