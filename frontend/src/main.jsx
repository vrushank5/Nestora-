import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '256310634339-0606u1kl806cgnqtu96og4u243jssvo9.apps.googleusercontent.com'
const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''

const paypalOptions = {
  clientId: paypalClientId,
  currency: 'USD',
  intent: 'capture',
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <PayPalScriptProvider options={paypalOptions}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </PayPalScriptProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
