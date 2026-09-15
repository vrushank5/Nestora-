import { getToken } from '../context/authStorage.js'

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_URL = `${BACKEND_BASE_URL}/api`

export const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${BACKEND_BASE_URL}${cleanPath}`
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : {}

  if (!response.ok) {
    if (response.status === 401 && data.message !== 'Invalid email or password') {
      window.dispatchEvent(new Event('nestora:auth-expired'))
    }

    throw new Error(data.message || 'Something went wrong. Please try again.')
  }

  return data
}

export const apiRequest = async (endpoint, options = {}) => {
  const token = options.token === null ? null : options.token || getToken()
  const headers = { ...options.headers }

  // Only set application/json if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return parseResponse(response)
}

export const authApi = {
  login: (payload) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      token: null,
    }),
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      token: null,
    }),
  googleLogin: (token, roleId) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token, roleId }),
      token: null,
    }),
}

export const roleApi = {
  getPublicRoles: async () => {
    const data = await apiRequest('/roles', { token: null })
    const roles = data.data || data.roles || []
    return roles.filter((role) => Number(role.roleId) !== 1 && role.isActive !== false)
  },
}
