import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/useAuth.js'
import { authApi } from '../services/api.js'
import { homeImages } from '../data/homeData.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const loginRoles = {
  resident: ['Resident', 'Bookings, saved homes, messages, and profile tools.'],
  owner: ['Owner', 'Listings, booking requests, resident roster, and settings.'],
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [role, setRole] = useState('resident')
  const [values, setValues] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const dashboardPath = (roleId) => {
    const normalizedRoleId = Number(roleId)
    return normalizedRoleId === 1 ? '/admin/dashboard' : normalizedRoleId === 2 ? '/owner/dashboard' : '/'
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.email.trim()) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (!values.password) nextErrors.password = 'Password is required.'
    return nextErrors
  }

  const submit = async (event) => {
    event.preventDefault()
    if (loading) return

    const nextErrors = validate()
    setErrors(nextErrors)
    setStatus({ type: '', message: '' })
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const data = await authApi.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      login({ token: data.token, user: data.user })
      setStatus({ type: 'success', message: 'Signed in. Opening your workspace...' })

      window.setTimeout(() => navigate(dashboardPath(data.user.roleId), { replace: true }), 550)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message === 'Server error' ? 'Network error. Please try again later.' : error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const selectedRoleId = role === 'owner' ? 2 : 3
      const data = await authApi.googleLogin(credentialResponse.credential, selectedRoleId)

      login({ token: data.token, user: data.user })
      setStatus({ type: 'success', message: 'Signed in with Google. Opening your workspace...' })

      window.setTimeout(() => navigate(dashboardPath(data.user.roleId), { replace: true }), 550)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message === 'Server error' ? 'Network error. Please try again later.' : error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setStatus({
      type: 'error',
      message: 'Google Login Failed',
    })
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <motion.aside
          className="auth-visual"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
        >
          <img src={homeImages.room} alt="Nestora furnished room" />
          <Link className="brand-logo auth-brand" to="/">
            <span className="brand-mark"><Sparkles size={20} /></span>
            <span>
              <strong>NESTORA</strong>
              <small>SECURE ACCESS</small>
            </span>
          </Link>
          <div className="auth-visual-copy">
            <span><BadgeCheck size={16} /> Verified stay network</span>
            <h1>Welcome back to your living workspace.</h1>
            <p>Sign in with your existing Nestora credentials. The form connects directly to the current authentication API.</p>
          </div>
        </motion.aside>

        <motion.form
          className="auth-panel"
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <div className="panel-heading">
            <span className="section-kicker"><ShieldCheck size={14} /> Protected login</span>
            <h2>{loginRoles[role][0]} access</h2>
            <p>{loginRoles[role][1]}</p>
          </div>

          <div className="role-tabs" aria-label="Login context">
            {Object.entries(loginRoles).map(([key, [label]]) => (
              <button className={role === key ? 'active' : ''} key={key} type="button" onClick={() => setRole(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="login-email">Email address<span>*</span></label>
            <div className="icon-field">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                value={values.email}
                placeholder="name@domain.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
              />
            </div>
            {errors.email ? <p className="field-error">{errors.email}</p> : null}
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password<span>*</span></label>
            <div className="icon-field password-field">
              <Lock size={18} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => setValues({ ...values, password: event.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? <p className="field-error">{errors.password}</p> : null}
          </div>

          <div className="auth-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={values.remember}
                onChange={(event) => setValues({ ...values, remember: event.target.checked })}
              />
              Keep me signed in
            </label>
            <a href="#support" onClick={(event) => event.preventDefault()}>Need help?</a>
          </div>

          {status.message ? (
            <p className={`form-status ${status.type === 'error' ? 'form-status-error' : 'form-status-success'}`}>
              {status.message}
            </p>
          ) : null}

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? 'Checking credentials...' : <>Sign in <ArrowRight size={18} /></>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ margin: '0 1rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          <div className="auth-assurance">
            <span><CheckCircle2 size={14} /> JWT session</span>
            <span><Building2 size={14} /> Existing REST API</span>
          </div>

          <p className="switch-auth">
            New to Nestora? <Link to="/register">Create an account</Link>
          </p>
        </motion.form>
      </section>
    </main>
  )
}

export default Login
