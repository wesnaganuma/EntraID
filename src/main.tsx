import React from 'react'
import './styles.css'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './authConfig'

const msalInstance = new PublicClientApplication(msalConfig)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento root não encontrado — verifique se existe um elemento com id "root" em index.html')
}

// Tratar respostas de redirecionamento antes de renderizar para disponibilizar estado de autenticação

async function init() {
  try {
    // Inicializar MSAL se disponível
    if (typeof msalInstance.initialize === 'function') {
      try {
        await (msalInstance as any).initialize()
      } catch (initErr) {
        console.error('msalInstance.initialize() error:', initErr)
      }
    }
    const result = await msalInstance.handleRedirectPromise()
    if (result) console.debug('Redirect result received')
    const accounts = msalInstance.getAllAccounts()
    if (accounts && accounts.length > 0) console.debug('Authenticated accounts present')
  } catch (e) {
    console.error('Error handling redirect promise', e)
  } finally {
    // Limpar parâmetros de autenticação da URL
    try {
      if (window && window.history && typeof window.history.replaceState === 'function') {
        const cleanUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
      }
    } catch (err) {
      // ignorar erros de limpeza de URL
    }

    createRoot(rootElement as HTMLElement).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    )
  }
}

init()
