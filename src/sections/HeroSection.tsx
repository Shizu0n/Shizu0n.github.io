import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import '../index.css'

/* --- helpers --- */
const range = (
  progress: ReturnType<typeof useSpring>,
  inputRange: number[],
  outputRange: [number, ...number[]]
) => useTransform(progress, inputRange, outputRange)

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const spring = useSpring(scrollYProgress, { stiffness: 80, damping: 20, restDelta: 0.001 })

  /* ───── LAYER 1 — top-left identity ───── */
  const l1Opacity = range(spring, [0, 0.15, 0.3, 0.45], [0, 1, 1, 0])
  const l1Y = range(spring, [0, 0.15, 0.3, 0.45], [20, 0, 0, -20])

  /* ───── LAYER 2 — centre headline ───── */
  const l2BuildingOpacity = range(spring, [0.05, 0.15, 0.5], [0, 1, 1])
  const l2BuildingY = range(spring, [0.05, 0.15], [60, 0])

  const l2SoftwareOpacity = range(spring, [0.1, 0.2, 0.5], [0, 1, 1])
  const l2SoftwareY = range(spring, [0.1, 0.2], [60, 0])

  const l2MattersOpacity = range(spring, [0.15, 0.25, 0.5], [0, 1, 1])
  const l2MattersY = range(spring, [0.15, 0.25], [60, 0])

  /* ───── LAYER 3 — right-aligned block ───── */
  const l3Opacity = range(spring, [0.5, 0.65, 0.85, 0.95], [0, 1, 1, 0])
  const l3X = range(spring, [0.5, 0.65], [40, 0])

  /* ───── LAYER 4 — scroll arrow ───── */
  const arrowOpacity = range(spring, [0.7, 0.85, 0.95], [0, 1, 0])

  /* ───── Parallax horizontal line ───── */
  const lineY = range(spring, [0, 1], [-100, 100])

  return (
    <div ref={sectionRef} id="hero" className="hero-scroll-container">
      <div className="hero-sticky">
        {/* Grain overlay */}
        <div className="hero-grain" />

        {/* Parallax thin line */}
        <motion.div className="hero-line" style={{ y: lineY }} />

        {/* ── LAYER 1 ── */}
        <motion.div
          className="hero-layer hero-layer-1"
          style={{ opacity: l1Opacity, y: l1Y }}
        >
          <span>PAULO SHIZUO</span>
          <span>COMPUTER SCIENCE</span>
        </motion.div>

        {/* ── LAYER 2 ── */}
        <div className="hero-layer hero-layer-2">
          <motion.span style={{ opacity: l2BuildingOpacity, y: l2BuildingY }}>
            Building
          </motion.span>
          <motion.span style={{ opacity: l2SoftwareOpacity, y: l2SoftwareY }}>
            software that
          </motion.span>
          <motion.span style={{ opacity: l2MattersOpacity, y: l2MattersY }}>
            <span className="hero-matters-muted">matters.</span>
          </motion.span>
        </div>

        {/* ── LAYER 3 ── */}
        <motion.div
          className="hero-layer hero-layer-3"
          style={{ opacity: l3Opacity, x: l3X }}
        >
          <span className="hero-role">Full Stack Developer</span>
          <span className="hero-location">Fortaleza, CE — 2024</span>
        </motion.div>

        {/* ── LAYER 4 ── */}
        <motion.div className="hero-layer hero-layer-4" style={{ opacity: arrowOpacity }}>
          <span className="hero-scroll-arrow">↓</span>
        </motion.div>
      </div>
    </div>
  )
}
