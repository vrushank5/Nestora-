const TOKEN_KEY = 'nestora_token'
const USER_KEY = 'nestora_user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const getCurrentUser = () => {
  const storedUser = localStorage.getItem(USER_KEY)

  if (!storedUser) return null

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const saveAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const isAuthenticated = () => Boolean(getToken() && getCurrentUser())

// Decode JWT payload and check whether it is expired.
// Returns true if the token is missing, malformed, or past its exp claim.
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    // JWT is three base64url-encoded segments separated by dots.
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return true

    // base64url → base64 → JSON
    const json = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)

    if (!payload.exp) return false // no expiry claim → treat as valid

    // exp is in seconds; Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}
