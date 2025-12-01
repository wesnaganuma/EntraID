declare module './authConfig' {
  import { Configuration, PopupRequest, RedirectRequest } from '@azure/msal-browser'
  export const msalConfig: Configuration
  export const loginRequest: PopupRequest | RedirectRequest | { scopes: string[] }
}
