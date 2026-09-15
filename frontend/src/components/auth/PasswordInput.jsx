import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

function PasswordInput({
  id,
  label,
  value,
  error,
  required = false,
  placeholder,
  autoComplete,
  onChange,
  onBlur,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default PasswordInput
