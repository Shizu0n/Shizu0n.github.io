import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  onPreview: (projectId: string | null) => void
}

function ProjectShowcaseTile({ project, presentation, index, labelPrefix, language, onPreview }: ProjectShowcaseTileProps) {
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
      onMouseEnter={() => onPreview(project.id)}
      onMouseLeave={() => onPreview(null)}
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

  // Hover preview only makes sense on devices with a real pointer; on touch the
  // dim background capture stays as the visual evidence.
  const canHoverPreview = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    [],
  )
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Brief delay before opening so casual mouse passes over the grid don't flash
  // the preview; closing is immediate.
  const previewTimerRef = useRef<number | null>(null)
  const handlePreview = (projectId: string | null) => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    if (projectId === null) {
      setPreviewId(null)
      return
    }
    previewTimerRef.current = window.setTimeout(() => setPreviewId(projectId), 1000)
  }
  useEffect(() => () => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current)
    }
  }, [])

  const previewProject = canHoverPreview && previewId
    ? projects.find(project => project.id === previewId && PROJECT_PRESENTATION[project.id]?.screenshot)
    : undefined
  const previewScreenshot = previewProject ? PROJECT_PRESENTATION[previewProject.id].screenshot : undefined

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
              onPreview={handlePreview}
            />
          ))}
        </div>

        <AnimatePresence>
          {previewProject && previewScreenshot && (
            <motion.div
              className="project-preview-overlay"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                className="project-preview-frame"
                initial={{ opacity: 0, scale: 0.88, y: 26, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.94, y: 12, filter: 'blur(6px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="project-preview-title">
                  {previewProject.name} — {language === 'pt' ? 'demo ao vivo' : 'live demo'}
                </span>
                <img src={previewScreenshot} alt="" decoding="async" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
