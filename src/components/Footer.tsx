export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">
          &copy; {year} Paulo Shizuo
        </span>
        <span className="footer-tag">
          Built with React &amp; Framer Motion
        </span>
      </div>
    </footer>
  )
}
