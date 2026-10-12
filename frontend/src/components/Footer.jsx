import { ArrowUpRight, Building2, Headphones, ShieldCheck, Sparkles } from 'lucide-react'
import NestoraLogo from './NestoraLogo.jsx'

const columns = [
  ['Platform', 'Discover PGs', 'Popular locations', 'Resident dashboard', 'Owner access'],
  ['Living', 'Campus ready', 'Workday calm', 'Community living', 'Managed stays'],
  ['Company', 'About Nestora', 'Help center', 'Privacy', 'Terms'],
]

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid section-shell">
        <div className="footer-brand-block">
          <div className="brand-logo footer-brand">
            <NestoraLogo variant="header" showText={true} />
          </div>
          <p>
            Verified PG and co-living spaces presented with clear pricing, useful filters,
            and secure account access for residents and property owners.
          </p>
          <div className="footer-trust">
            <span><ShieldCheck size={16} /> Verified homes</span>
            <span><Building2 size={16} /> Managed listings</span>
            <span><Headphones size={16} /> Support first</span>
          </div>
        </div>

        {columns.map(([title, ...links]) => (
          <div className="footer-column" key={title}>
            <h3>{title}</h3>
            {links.map((link) => (
              <a href="/" key={link} onClick={(event) => event.preventDefault()}>
                {link}
                <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom section-shell">
        <span>&copy; {new Date().getFullYear()} Nestora. All rights reserved.</span>
        <span>Built around trustworthy urban living.</span>
      </div>
    </footer>
  )
}

export default Footer
