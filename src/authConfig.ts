import { Configuration } from '@azure/msal-browser'

// Garantir que variáveis de ambiente sejam strings
const clientId = String(import.meta.env.VITE_CLIENT_ID ?? '')
const tenantId = String(import.meta.env.VITE_TENANT_ID ?? '')
const redirectUri = String(import.meta.env.VITE_REDIRECT_URI ?? window.location.origin)
const authority = String(import.meta.env.VITE_AUTHORITY ?? `https://login.microsoftonline.com/${tenantId}`)

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri,
  },
  // Usar sessionStorage para limpar cache ao terminar a sessão do navegador
  cache: {
    cacheLocation: 'sessionStorage', // 'localStorage' or 'sessionStorage'
    // Usar cookie para estado de auth em navegadores que bloqueiam cookies de terceiros
    storeAuthStateInCookie: true,
  },
}

export const loginRequest: { scopes: string[] } = {
  // Escopos necessários para login e Microsoft Graph
  scopes: ['openid', 'profile', 'User.Read'],
}
