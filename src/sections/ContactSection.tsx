import { useState } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useContactForm } from '../hooks/useContactForm'

const CONTACT_EMAIL = 'paulosvtatibana@gmail.com'
const LINKEDIN_URL = 'https://www.linkedin.com/in/paulosvtatibana/'
const GITHUB_URL = 'https://github.com/Shizu0n'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'circOut' } },
}

export default function ContactSection() {
  const {
    formRef,
    formData,
    sendStatus,
    errorMessage,
    handleInputChange,
    handleSubmit,
  } = useContactForm()

  const [showForm, setShowForm] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  const handleEmailClick = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 1500)
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="contact-inner">
        <motion.p
          className="contact-label"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          04 — CONTACT
        </motion.p>

        <motion.h2
          className="contact-headline"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          <motion.span variants={itemVariants}>Let&apos;s build</motion.span>
          <motion.span variants={itemVariants}>
            something&nbsp;<em>great.</em>
          </motion.span>
        </motion.h2>

        <motion.hr
          className="contact-rule"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Contact links */}
        <motion.div
          className="contact-links"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <motion.button
            className="contact-email-link"
            onClick={handleEmailClick}
            variants={itemVariants}
          >
            {emailCopied ? 'Copied!' : CONTACT_EMAIL}
          </motion.button>

          <motion.a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-external-link"
            variants={itemVariants}
          >
            LinkedIn <span className="contact-arrow">↗</span>
          </motion.a>

          <motion.a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-external-link"
            variants={itemVariants}
          >
            GitHub <span className="contact-arrow">↗</span>
          </motion.a>
        </motion.div>

        {/* Horizontal rule */}
        <motion.hr
          className="contact-rule-thin"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        />

        {/* CTA button */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          <button
            className="contact-cta-btn"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Close' : 'Send a message'}
          </button>
        </motion.div>

        {/* Expandable form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="contact-form-wrap"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'circOut' }}
            >
              {sendStatus === 'success' ? (
                <motion.p
                  className="contact-success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Message sent.
                </motion.p>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="contact-input"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    className="contact-input"
                  />
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Your message..."
                    className="contact-input contact-textarea"
                    rows={4}
                  />
                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={sendStatus === 'sending'}
                  >
                    {sendStatus === 'sending' ? 'Sending...' : 'Send →'}
                  </button>
                  {errorMessage && (
                    <p className="contact-error">{errorMessage}</p>
                  )}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
