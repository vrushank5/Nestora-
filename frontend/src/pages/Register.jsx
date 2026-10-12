import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../services/api.js'
import { homeImages } from '../data/homeData.js'
import NestoraLogo from '../components/NestoraLogo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobilePattern = /^(\+91[\s-]?)?[6-9]\d{9}$/

const initialValues = {
  accountType: 'resident',
  name: '',
  email: '',
  mobile: '',
  gender: '',
  address: '',
  occupation: '',
  businessName: '',
  propertyAddress: '',
  password: '',
  confirmPassword: '',
}

function Register() {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }))

  const validate = () => {
    const nextErrors = {}

    if (values.name.trim().length < 2) nextErrors.name = 'Full name must be at least 2 characters.'
    if (!values.email.trim()) nextErrors.email = 'Email address is required.'
    else if (!emailPattern.test(values.email)) nextErrors.email = 'Enter a valid email address.'
    if (!mobilePattern.test(values.mobile.trim())) nextErrors.mobile = 'Enter a valid 10-digit Indian mobile number.'

    if (values.accountType === 'resident') {
      if (!values.gender) nextErrors.gender = 'Gender selection is required.'
      if (values.address.trim().length < 8) nextErrors.address = 'Provide a complete address.'
      if (values.occupation.trim().length < 2) nextErrors.occupation = 'Enter your occupation or college.'
    } else {
      if (values.businessName.trim().length < 2) nextErrors.businessName = 'Enter property or business name.'
      if (values.propertyAddress.trim().length < 8) nextErrors.propertyAddress = 'Enter the full property address.'
    }

    if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    } else if (!/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      nextErrors.password = 'Include 1 uppercase letter and 1 number.'
    }

    if (values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match.'
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
      const data = await authApi.register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        mobile: values.mobile.trim(),
        gender: values.accountType === 'resident' ? values.gender : 'not-specified',
        address: values.accountType === 'resident' ? values.address.trim() : values.propertyAddress.trim(),
        occupation: values.accountType === 'resident' ? values.occupation.trim() : values.businessName.trim(),
        roleId: values.accountType === 'resident' ? 3 : 2,
      })

      setStatus({ type: 'success', message: data.message || 'Registration completed. Opening login...' })
      setValues(initialValues)
      window.setTimeout(() => navigate('/login'), 900)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message === 'Server error' ? 'Network or database error. Please try again.' : error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const isResident = values.accountType === 'resident'

  return (
    <main className="auth-page">
      <ThemeToggle className="auth-theme-toggle" />
      <section className="auth-shell register-shell">
        <motion.aside
          className="auth-visual register-visual"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
        >
          <img src={homeImages.coliving} alt="Nestora shared living space" />
          <Link className="brand-logo auth-brand" to="/" style={{ textDecoration: 'none' }}>
            <NestoraLogo variant="sidebar" subtitle="JOIN NESTORA" />
          </Link>
          <div className="auth-visual-copy">
            <span><ShieldCheck size={16} /> Public registration</span>
            <h1>Create a secure account for your role.</h1>
            <p>Residents and owners can register here. Admin registration remains unavailable through the public form.</p>
          </div>
        </motion.aside>

        <motion.form
          className="auth-panel register-panel"
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <div className="auth-panel-brand">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }} aria-label="Nestora Home">
              <NestoraLogo variant="auth-icon" width="52px" />
            </Link>
          </div>
          <div className="panel-heading">
            <span className="section-kicker"><CheckCircle2 size={14} /> Account setup</span>
            <h2>Create your Nestora account</h2>
            <p>Complete the required details. The submitted payload follows the current backend registration contract.</p>
          </div>

          <div className="role-tabs" aria-label="Registration type">
            <button className={isResident ? 'active' : ''} type="button" onClick={() => { setErrors({}); update('accountType', 'resident') }}>
              Resident
            </button>
            <button className={!isResident ? 'active' : ''} type="button" onClick={() => { setErrors({}); update('accountType', 'owner') }}>
              Owner
            </button>
          </div>

          <div className="form-grid">
            <TextInput icon={User} label="Full Name" value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
            <TextInput icon={Mail} label="Email Address" type="email" value={values.email} error={errors.email} onChange={(event) => update('email', event.target.value)} />
            <TextInput icon={Phone} label="Mobile Number" type="tel" value={values.mobile} error={errors.mobile} onChange={(event) => update('mobile', event.target.value)} />

            {isResident ? (
              <>
                <SelectInput
                  label="Gender"
                  value={values.gender}
                  error={errors.gender}
                  onChange={(event) => update('gender', event.target.value)}
                  options={[
                    ['', 'Select gender'],
                    ['female', 'Female'],
                    ['male', 'Male'],
                    ['other', 'Other'],
                    ['prefer-not-to-say', 'Prefer not to say'],
                  ]}
                />
                <TextInput className="form-grid-full" icon={MapPin} label="Current Address" value={values.address} error={errors.address} onChange={(event) => update('address', event.target.value)} />
                <TextInput icon={BriefcaseBusiness} label="Occupation / College" value={values.occupation} error={errors.occupation} onChange={(event) => update('occupation', event.target.value)} />
              </>
            ) : (
              <>
                <TextInput icon={Building2} label="Business / Property Name" value={values.businessName} error={errors.businessName} onChange={(event) => update('businessName', event.target.value)} />
                <TextInput className="form-grid-full" icon={MapPin} label="Property Address" value={values.propertyAddress} error={errors.propertyAddress} onChange={(event) => update('propertyAddress', event.target.value)} />
              </>
            )}

            <div className="form-field">
              <label htmlFor="register-password">Password<span>*</span></label>
              <div className="icon-field password-field">
                <Lock size={18} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) => update('password', event.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? <p className="field-error">{errors.password}</p> : null}
            </div>

            <div className="form-field">
              <label htmlFor="register-confirm-password">Confirm password<span>*</span></label>
              <div className="icon-field password-field">
                <Lock size={18} />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={values.confirmPassword}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword ? <p className="field-error">{errors.confirmPassword}</p> : null}
            </div>
          </div>

          {status.message ? (
            <p className={`form-status ${status.type === 'error' ? 'form-status-error' : 'form-status-success'}`}>
              {status.message}
            </p>
          ) : null}

          <button className="primary-button auth-submit" disabled={loading} type="submit">
            {loading ? 'Creating account...' : <>Create account <ArrowRight size={18} /></>}
          </button>

          <p className="switch-auth">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.form>
      </section>
    </main>
  )
}

function TextInput({ label, icon: Icon, error, className = '', ...props }) {
  const id = `register-${label.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}<span>*</span></label>
      <div className="icon-field">
        {Icon ? <Icon size={18} /> : null}
        <input id={id} placeholder={`Enter ${label.toLowerCase()}`} aria-invalid={Boolean(error)} {...props} />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

function SelectInput({ label, options, error, ...props }) {
  const id = `register-${label.toLowerCase().replaceAll(' ', '-')}`

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}<span>*</span></label>
      <select id={id} aria-invalid={Boolean(error)} {...props}>
        {options.map(([value, text]) => <option key={value || text} value={value}>{text}</option>)}
      </select>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

export default Register
