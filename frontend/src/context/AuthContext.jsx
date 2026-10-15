import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './authContext.js'
import {
  clearAuthSession,
  getCurrentUser,
  getToken,
  isTokenExpired,
  saveAuthSession,
} from './authStorage.js'

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // Start in "checking" state — never assume the user is authenticated.
  const [authChecking, setAuthChecking] = useState(true)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  // On mount: read the stored token, verify it has not expired, then resolve.
  useEffect(() => {
    const storedToken = getToken()
    const storedUser = getCurrentUser()

    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      // Valid, non-expired token found → restore session.
      setToken(storedToken)
      setUser(storedUser)
    } else {
      // No token, missing user, or token is expired → clear any stale data.
      if (storedToken || storedUser) {
        clearAuthSession()
      }
      setToken(null)
      setUser(null)
    }

    setAuthChecking(false)
  }, [])

  const login = useCallback(({ token: nextToken, user: nextUser }) => {
    saveAuthSession({ token: nextToken, user: nextUser })
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const updateUser = useCallback((updates) => {
    if (!user) return
    const nextUser = { ...user, ...updates }
    if (token) saveAuthSession({ token, user: nextUser })
    setUser(nextUser)
  }, [token, user])

  const logout = useCallback(() => {
    clearAuthSession()
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // Listen for 401 responses dispatched by api.js
  useEffect(() => {
    window.addEventListener('nestora:auth-expired', logout)
    return () => window.removeEventListener('nestora:auth-expired', logout)
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      token,
      authChecking,
      isAuthenticated: Boolean(token && user),
      login,
      updateUser,
      logout,
      getCurrentUser,
    }),
    [authChecking, login, logout, token, updateUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
