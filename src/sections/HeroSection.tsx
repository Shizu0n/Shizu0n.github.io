import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'

const range = (
  progress: ReturnType<typeof useSpring>,
  inputRange: number[],
  outputRange: [number, ...number[]],
) => useTransform(progress, inputRange, outputRange)

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 220 : 120,
    damping: prefersReducedMotion ? 36 : 24,
    restDelta: 0.001,
  })

  const introOpacity = range(progress, [0, 0.035, 0.1], [1, 1, 0])
  const introY = range(progress, [0, 0.1], [0, prefersReducedMotion ? 0 : -18])

  const titleOpacity = range(progress, [0.14, 0.19, 0.4, 0.44], [0, 1, 1, 0])
  const titleY = range(progress, [0.14, 0.2, 0.44], [26, 0, prefersReducedMotion ? 0 : -34])
  const wordOneOpacity = range(progress, [0.14, 0.18, 0.32], [0, 1, 1])
  const wordTwoOpacity = range(progress, [0.18, 0.22, 0.36], [0, 1, 1])
  const wordThreeOpacity = range(progress, [0.22, 0.27, 0.4], [0, 1, 1])
  const wordOneY = range(progress, [0.14, 0.18], [20, 0])
  const wordTwoY = range(progress, [0.18, 0.22], [24, 0])
  const wordThreeY = range(progress, [0.22, 0.27], [28, 0])

  const visualScale = range(progress, [0, 0.26, 0.64, 1], [0.9, 0.98, 1.06, prefersReducedMotion ? 1 : 1.16])
  const visualRotate = range(progress, [0, 0.62, 1], [prefersReducedMotion ? 0 : -4, prefersReducedMotion ? 0 : 1.5, prefersReducedMotion ? 0 : 6])
  const visualOpacity = range(progress, [0.02, 0.12, 0.94], [0.28, 1, 0.7])
  const visualY = range(progress, [0, 0.62, 1], [prefersReducedMotion ? 0 : 16, 0, prefersReducedMotion ? 0 : -28])
  const lineScale = range(progress, [0.06, 0.18, 0.88], [0.45, 1, 1])
  const lineOpacity = range(progress, [0.02, 0.12, 0.88], [0, 1, 0.2])

  const overlayOpacity = range(progress, [0.46, 0.5, 0.6, 0.66], [0, 0.72, 0.72, 0])
  const overlayLeftY = range(progress, [0.46, 0.64], [prefersReducedMotion ? 0 : 14, prefersReducedMotion ? 0 : -12])
  const overlayRightY = range(progress, [0.46, 0.64], [prefersReducedMotion ? 0 : -12, prefersReducedMotion ? 0 : 14])

  const outroOpacity = range(progress, [0.74, 0.8, 0.92], [0, 1, 1])
  const outroY = range(progress, [0.74, 0.8], [18, 0])
  const hintOpacity = range(progress, [0, 0.06, 0.14], [0, 1, 0])

  return (
    <section ref={sectionRef} id="hero" className="hero-scroll-container">
      <div className="hero-sticky">
        <div className="hero-noise" />
        <div className="hero-gradient" />

        <motion.div
          className="hero-axis"
          style={{ opacity: lineOpacity, scaleY: lineScale }}
        />

        <div className="hero-visual-anchor">
          <motion.div
            className="hero-visual-shell"
            style={{
              opacity: visualOpacity,
              scale: visualScale,
              rotate: visualRotate,
              y: visualY,
            }}
          >
            <div className="hero-visual-ring hero-visual-ring--outer" />
            <div className="hero-visual-ring hero-visual-ring--middle" />
            <div className="hero-visual-ring hero-visual-ring--inner" />
            <div className="hero-visual-beam hero-visual-beam--horizontal" />
            <div className="hero-visual-beam hero-visual-beam--vertical" />
            <div className="hero-visual-core">
              <span className="hero-visual-index">01 / sequence</span>
              <span className="hero-visual-word">Build</span>
            </div>
          </motion.div>
        </div>

        <motion.div className="hero-intro" style={{ opacity: introOpacity, y: introY }}>
          <span className="hero-kicker">Paulo Shizuo</span>
          <span className="hero-meta">Full stack developer / Fortaleza, Brazil</span>
        </motion.div>

        <motion.div className="hero-copy" style={{ opacity: titleOpacity, y: titleY }}>
          <p className="hero-caption">Editorial systems for products, code, and motion.</p>
          <h1 className="hero-title">
            <motion.span style={{ opacity: wordOneOpacity, y: wordOneY }}>
              Calm
            </motion.span>
            <motion.span style={{ opacity: wordTwoOpacity, y: wordTwoY }}>
              interfaces.
            </motion.span>
            <motion.span
              className="hero-title-emphasis"
              style={{ opacity: wordThreeOpacity, y: wordThreeY }}
            >
              Precise software.
            </motion.span>
          </h1>
        </motion.div>

        <motion.aside
          className="hero-overlay hero-overlay--left"
          style={{ opacity: overlayOpacity, y: overlayLeftY }}
        >
          <span className="hero-overlay-label">Act 01</span>
          <p>Scroll-linked pacing, restrained contrast, and one visual plane doing the heavy lifting.</p>
        </motion.aside>

        <motion.aside
          className="hero-overlay hero-overlay--right"
          style={{ opacity: overlayOpacity, y: overlayRightY }}
        >
          <span className="hero-overlay-label">Parallax</span>
          <p>Type, motion, and hierarchy moving in lockstep with the page instead of competing for attention.</p>
        </motion.aside>

        <motion.div className="hero-outro" style={{ opacity: outroOpacity, y: outroY }}>
          <span className="hero-outro-label">Entering selected work</span>
          <p>Curated case studies, product thinking, and front-end direction built to feel production ready.</p>
        </motion.div>

        <motion.div className="hero-scroll-hint" style={{ opacity: hintOpacity }}>
          <span>Scroll to enter the story</span>
        </motion.div>
      </div>
    </section>
  )
}
