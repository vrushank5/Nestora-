import { LayoutDashboard, LogIn, LogOut, Menu, Sparkles, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  ['Locations', '/#locations'],
  ['Residences', '/#residences'],
  ['How it works', '/#how-it-works'],
]

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setOpen(false)
  const roleId = Number(user?.roleId)
  const dashboardPath = roleId === 1 ? '/admin' : roleId === 2 ? '/owner' : '/resident'

  const accountActions = isAuthenticated ? (
    <>
      <Link className="nav-chip" to={dashboardPath} onClick={closeMenu}>
        <LayoutDashboard size={16} />
        Dashboard
      </Link>
      <span className="nav-user">
        <UserRound size={16} />
        {user?.name || 'Member'}
      </span>
      <button className="nav-link-button" type="button" onClick={() => { closeMenu(); logout() }}>
        <LogOut size={16} />
        Logout
      </button>
    </>
  ) : (
    <>
      <Link className="nav-link-button" to="/login" onClick={closeMenu}>
        <LogIn size={16} />
        Login
      </Link>
      <Link className="nav-cta" to="/register" onClick={closeMenu}>
        Create account
      </Link>
    </>
  )

  return (
    <header className={`site-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <Link className="brand-logo" to="/" onClick={closeMenu}>
        <span className="brand-mark"><Sparkles size={20} /></span>
        <span>
          <strong>NESTORA</strong>
          <small>PG & CO-LIVING</small>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map(([label, to]) => (
          <a href={to} key={label}>{label}</a>
        ))}
      </nav>

      <div className="nav-actions">{accountActions}</div>

      <button
        className="mobile-toggle"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
        {navItems.map(([label, to]) => (
          <a href={to} key={label} onClick={closeMenu}>{label}</a>
        ))}
        <div className="mobile-actions">{accountActions}</div>
      </div>
    </header>
  )
}

export default Navbar
