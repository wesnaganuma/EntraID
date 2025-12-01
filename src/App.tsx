import React, { useState } from 'react'
import { useEffect } from 'react'
import { useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react'
import type { AccountInfo, PopupRequest, RedirectRequest } from '@azure/msal-browser'
import { loginRequest } from './authConfig'
import fetchProfile from './graph'

export default function App(): React.ReactElement {
    const { instance, accounts } = useMsal()
    const isAuthenticated = useIsAuthenticated()
    // Pass undefined when there is no account to satisfy useAccount's parameter type
    const account = useAccount(accounts[0] ?? undefined)
    const [usernameOnly, setUsernameOnly] = useState('')
    const [theme, setTheme] = useState<'dark'|'light'>(() => {
        try {
            const saved = localStorage.getItem('theme')
            return saved === 'light' ? 'light' : 'dark'
        } catch (e) {
            return 'dark'
        }
    })

    useEffect(() => {
        try {
            document.documentElement.classList.toggle('theme-light', theme === 'light')
            document.documentElement.classList.toggle('theme-dark', theme === 'dark')
            localStorage.setItem('theme', theme)
        } catch (e) {
            // ignorar
        }
    }, [theme])

    React.useEffect(() => {
        // Efeito intencionalmente mínimo
    }, [])

    const handleLogin = async () => {
        try {
            await instance.loginPopup(loginRequest as PopupRequest)
        } catch (e: unknown) {
            console.error(e)
        }
    }

    // Login com apenas nome de usuário. Usa `loginHint` para pré-preencher o identificador.
    const handleLoginWithUsername = async () => {
        try {
            const tenantDomain = String(import.meta.env.VITE_TENANT_DOMAIN ?? '')
            let hint = usernameOnly.trim()
            if (hint && tenantDomain && !hint.includes('@')) {
                hint = `${hint}@${tenantDomain}`
            }

            await instance.loginPopup({ ...(loginRequest as PopupRequest), loginHint: hint || undefined })
        } catch (e: unknown) {
            console.error(e)
        }
    }

    // Redirect-based login (opens Microsoft login in same tab). Useful when popup blocked.
    const handleLoginRedirect = async () => {
        try {
            await instance.loginRedirect(loginRequest as RedirectRequest)
        } catch (e: unknown) {
            console.error(e)
        }
    }

    const handleLoginWithUsernameRedirect = async () => {
        try {
            const tenantDomain = String(import.meta.env.VITE_TENANT_DOMAIN ?? '')
            let hint = usernameOnly.trim()
            if (hint && tenantDomain && !hint.includes('@')) {
                hint = `${hint}@${tenantDomain}`
            }
            await instance.loginRedirect({ ...(loginRequest as RedirectRequest), loginHint: hint || undefined })
        } catch (e: unknown) {
            console.error(e)
        }
    }

    const handleLogout = () => {
        instance
            .logoutPopup()
            .catch((e: unknown) => console.error(e))
            .finally(() => {
                try {
                    // Clear MSAL-related data from sessionStorage to avoid saving users locally
                    sessionStorage.clear()
                } catch (err) {
                    // non-fatal
                }
                try {
                    // Clean URL after logout (remove query/hash)
                    if (window && window.history && typeof window.history.replaceState === 'function') {
                        const cleanUrl = window.location.origin + window.location.pathname
                        window.history.replaceState({}, document.title, cleanUrl)
                    }
                } catch (err) {
                    // ignore
                }
            })
    }

    // Limpar sessionStorage ao descarregar a página (opcional)
    React.useEffect(() => {
        const handleUnload = () => {
            try { sessionStorage.clear() } catch (e) {}
        }

        window.addEventListener('beforeunload', handleUnload)
        return () => window.removeEventListener('beforeunload', handleUnload)
    }, [])

    const [profile, setProfile] = useState<any | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(false)
    const [profileError, setProfileError] = useState<string | null>(null)

    const getProfile = async () => {
        setProfileError(null)
        setLoadingProfile(true)
        try {
            if (!account) throw new Error('No signed-in account')
            const silentRequest = {
                account,
                scopes: ['User.Read'],
            }
            let resp
            try {
                const tokenResponse = await instance.acquireTokenSilent(silentRequest as any)
                resp = await fetchProfile(tokenResponse.accessToken)
            } catch (silentErr) {
                // fallback para interação (popup)
                try {
                    const tokenResponse = await instance.acquireTokenPopup({ ...(loginRequest as PopupRequest) })
                    resp = await fetchProfile(tokenResponse.accessToken)
                } catch (popupErr) {
                    setProfileError(String(popupErr))
                    setProfile(null)
                    return
                }
            }

            setProfile(resp)
        } catch (e: unknown) {
            setProfileError(String(e))
            setProfile(null)
        } finally {
            setLoadingProfile(false)
        }
    }

    return (
        <div className="app-container">
            <div className="card">
                <div className="header">
                    <div>
                        <h1 className="title">Entra ID Login Demo</h1>
                        <div className="subtitle">Autentique com Microsoft Entra ID e teste chamadas ao Microsoft Graph</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="small">Sessão: <span className={`status ${isAuthenticated ? 'connected' : 'disconnected'}`}>{isAuthenticated ? 'Conectado' : 'Não conectado'}</span></div>
                        <div className="theme-toggle">
                            <button aria-label="Alternar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
                        </div>
                    </div>
                </div>

                {!isAuthenticated && (
                    <div>
                        <p className="small">Você não está autenticado.</p>

                        <div style={{ marginTop: 8 }}>
                            <label className="small" style={{ display: 'block', marginBottom: 8 }}>Login (apenas nome ou e-mail):</label>
                            <input
                                className="input"
                                value={usernameOnly}
                                onChange={(e) => setUsernameOnly(e.target.value)}
                                placeholder="ex: joao or joao@contoso.com"
                            />

                            <div className="controls login-controls" style={{ marginTop: 12 }}>
                                <button className="btn btn-primary" onClick={handleLoginWithUsername}>Login (pré-preencher)</button>
                                <button className="btn btn-ghost" onClick={handleLogin}>Popup</button>
                                <button className="btn btn-ghost" onClick={handleLoginWithUsernameRedirect}>Redirect (com hint)</button>
                                <button className="btn btn-ghost" onClick={handleLoginRedirect}>Redirect</button>
                            </div>
                        </div>
                    </div>
                )}

                {isAuthenticated && account && (
                    <div>
                        <div className="info-box">
                            Autenticado como: <strong>{account.username}</strong>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <div className="code-block">
                                <pre style={{margin:0}}>{JSON.stringify({ name: account.name, homeAccountId: account.homeAccountId }, null, 2)}</pre>
                            </div>

                            <div style={{ marginTop: 12 }} className="controls login-controls">
                                <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                                <button className="btn btn-ghost" onClick={getProfile} disabled={loadingProfile}>{loadingProfile ? 'Carregando...' : 'Buscar perfil'}</button>
                                <button className="btn btn-ghost" onClick={() => { setProfile(null); setProfileError(null) }}>Limpar</button>
                            </div>

                            {profileError && <div className="small" style={{ color: 'crimson', marginTop: 10 }}>Erro ao buscar perfil: {profileError}</div>}

                            {profile && (
                                <div style={{ marginTop: 12 }}>
                                    <h3 className="small">Perfil</h3>
                                    <div className="code-block">
                                        <pre style={{margin:0}}>{JSON.stringify(profile, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="footer">
                    <div className="small">Demonstração: em produção NÃO exponha segredos no cliente. Utilize backend seguro (confidential client) para aquisição/rotação de credenciais, realize o token exchange no servidor e proteja APIs com controles de acesso apropriados.</div>
                </div>
            </div>
        </div>
    )
}
