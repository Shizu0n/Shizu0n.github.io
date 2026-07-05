import { motion, type Variants } from 'framer-motion'
import { useGitHub } from '../contexts/GitHubContext'
import { useTranslation } from '../contexts/TranslationContext'
import { getShowcaseProjects, type ChatProjectAction } from '../components/chatProjectCatalog'
import { usePointerTilt } from '../hooks/usePointerTilt'
import { PROJECT_PRESENTATION, type ProjectPresentation } from './projectsPresentation'

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

interface ProjectShowcaseTileProps {
  project: ChatProjectAction
  presentation: ProjectPresentation
  index: number
  labelPrefix: string
  language: 'en' | 'pt'
}

function ProjectShowcaseTile({ project, presentation, index, labelPrefix, language }: ProjectShowcaseTileProps) {
  const tiltRef = usePointerTilt<HTMLAnchorElement>()
  const label = `${labelPrefix} ${String(index + 1).padStart(2, '0')}`
  // AI projects lead with their live demo (the deployed showcase); app projects link to the repo.
  const href = presentation.group === 'ai' ? project.live ?? project.github : project.github

  return (
    <motion.a
      ref={tiltRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`project-showcase project-showcase--${presentation.variant} project-showcase--${presentation.visual}`}
      initial={{ opacity: 0, y: index === 0 ? 18 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.58, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`project-showcase-visual project-showcase-visual--${presentation.visual}`} aria-hidden="true">
        {presentation.screenshot && (
          <img
            className="project-showcase-shot"
            src={presentation.screenshot}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="project-showcase-word">{presentation.accent}</span>
        <span className="project-showcase-gridline project-showcase-gridline--top" />
        <span className="project-showcase-gridline project-showcase-gridline--bottom" />
        <span className="project-showcase-frame" />
        <span className="project-showcase-frame-break" />
        <span className="project-showcase-panel project-showcase-panel--primary" />
        <span className="project-showcase-panel project-showcase-panel--secondary" />
        <span className="project-showcase-vector project-showcase-vector--one" />
        <span className="project-showcase-vector project-showcase-vector--two" />
        <span className="project-showcase-vector project-showcase-vector--three" />
        <span className="project-showcase-dot project-showcase-dot--one" />
        <span className="project-showcase-dot project-showcase-dot--two" />
        <span className="project-showcase-marker project-showcase-marker--one" />
        <span className="project-showcase-marker project-showcase-marker--two" />
        <span className="project-showcase-marker project-showcase-marker--three" />
        <span className="project-showcase-code">{label}</span>
        {/* matte matcap sphere — lifts on a nearer plane on hover/focus (set-piece C) */}
        <span className="project-showcase-sphere" />
      </div>

      <div className="project-showcase-copy">
        <div className="project-showcase-meta">
          <span>{presentation.category[language]}</span>
        </div>
        <h3 className="project-showcase-title">{project.name}</h3>
        <p className="project-showcase-summary">{project.summary[language]}</p>
        <p className="project-showcase-metric">{presentation.metric[language]}</p>
        <div className="project-showcase-stack">
          {project.stacks.slice(0, 4).map(technology => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        {presentation.group === 'ai' && project.live && (
          <span className="project-showcase-live">{language === 'pt' ? 'Demo ao vivo' : 'Live demo'} ↗</span>
        )}
      </div>
    </motion.a>
  )
}

export default function ProjectsSection() {
  const { t, language } = useTranslation()
  const { user } = useGitHub()
  const githubProfileUrl = user?.html_url ?? 'https://github.com/Shizu0n'

  const projects = getShowcaseProjects()

  return (
    <section id="projects" className="projects-section">
      <div className="projects-shell">
        <motion.div
          className="projects-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={headerVariants}
        >
          <p className="section-kicker">{t('projects.kicker')}</p>
          <h2 className="section-title">
            {t('projects.title')}
          </h2>
          <p className="section-body">
            {t('projects.body')}
          </p>
        </motion.div>

        <div className="projects-showcase-grid">
          {projects.map((project, index) => (
            <ProjectShowcaseTile
              key={project.id}
              project={project}
              presentation={PROJECT_PRESENTATION[project.id]}
              index={index}
              labelPrefix="Case study"
              language={language}
            />
          ))}
        </div>

        <motion.div
          className="projects-archive-link"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={headerVariants}
        >
          <p>{t('projects.archive.msg')}</p>
          <a href={githubProfileUrl} target="_blank" rel="noopener noreferrer">
            {t('projects.archive.link')}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
