import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AuthProvider } from './features/auth/context/AuthContext'
import { formatUserFacingError } from './lib/userFacingError'
import './features/documents/styles/bcvb-premium.css'
import './features/documents/styles/bcvbEditorialDocument.css'
import './features/documents/styles/documentFamilies.css'
import './features/ai-document/styles/aiDocumentStudio.css'
import './styles/premium-ui-system.css'
import './styles/mobile-premium.css'
import './styles/overflow-safety.css'
import './styles/responsive-density.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erreur React :', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
          <p style={{ color: '#c8102e', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            BCVB Référentiel
          </p>
          <h1>Une page n’a pas pu s’afficher correctement</h1>
          <p>{formatUserFacingError(this.state.error, 'Recharge la page. Si le problème persiste, contacte un administrateur BCVB avec l’heure de l’incident.')}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
