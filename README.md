```markdown
# Entra ID React + Vite + TypeScript

Projeto de demonstração para testar login com Microsoft Entra ID (Azure AD) usando React, Vite e TypeScript. Inclui exemplos para login via popup e redirect, suporte a login apenas com nome de usuário (loginHint) e um exemplo do Microsoft Graph `User.Read`.

**Início rápido**

1. `.env` e preencha os valores:

```dotenv
VITE_CLIENT_ID=seu-client-id
VITE_TENANT_ID=seu-tenant-id
VITE_REDIRECT_URI=http://localhost:5173/
VITE_AUTHORITY=https://login.microsoftonline.com/seu-tenant-id
# Opcional: se quiser que usuários possam digitar apenas o nome (ex.: `user1`),
# defina o domínio do tenant para ser anexado automaticamente: VITE_TENANT_DOMAIN=seutenant.onmicrosoft.com
```

2. Instale as dependências:

```powershell
npm install
```

3. Rode o servidor de desenvolvimento:

```powershell
npm run dev
```

4. Abra `http://localhost:5173` e teste o login.

**Onde olhar no projeto**
- `src/authConfig.ts`: configuração do MSAL (`clientId`, `authority`, `redirectUri`, configurações de cache).
- `src/main.tsx`: inicializa o MSAL e trata respostas de redirecionamento antes de renderizar.
- `src/App.tsx`: UI para login via popup/redirect, `loginHint` com apenas nome de usuário, logout e chamada ao Graph.
- `src/graph.ts`: helper para chamar `GET https://graph.microsoft.com/v1.0/me`.

**Recursos incluídos**
- Fluxos popup e redirect (botões para ambos na UI).
- Suporte a login apenas com nome: adicione `VITE_TENANT_DOMAIN` em `.env` e o app irá anexar o domínio quando o usuário digitar apenas o nome.
- Cache do MSAL usa `sessionStorage` e `storeAuthStateInCookie: true` para melhorar a confiabilidade de redirecionamentos.
- Após redirect/login a URL é limpa (query/hash removidos) automaticamente.
- Exemplo Microsoft Graph `User.Read` com `acquireTokenSilent` + fallback para `acquireTokenPopup`.

**Registrar uma aplicação no Entra ID**

- No Portal Azure → **Entra ID / Azure Active Directory** → **App registrations** → **New registration**.
- Defina o Redirect URI como `http://localhost:5173/` e registre a aplicação.
- Em seguida, em **Authentication** adicione a **Platform**: Single‑page application (SPA) e verifique se `http://localhost:5173/` está listado em Redirect URIs.
- Em **API permissions** adicione a permissão delegada `User.Read` (Microsoft Graph) e conceda consentimento de administrador se você controlar o tenant.

**Como testar os fluxos de login**
- Fluxo popup: clique em **Login (popup)** na UI.
- Fluxo redirect: clique em **Login (redirect)** — o app irá navegar até a Microsoft e deve retornar na mesma aba.
- Login apenas com nome: digite `user1` no campo de login (se `VITE_TENANT_DOMAIN` estiver definido o app enviará `user1@seutenant.onmicrosoft.com` como `loginHint`).
- Buscar perfil: após o login clique em **Buscar perfil (Graph)** para chamar o Microsoft Graph e exibir o JSON do perfil.

**Evitar salvar usuários localmente**
- O app usa `sessionStorage` para o cache do MSAL, então tokens/contas são limpos quando a sessão do navegador termina.
- No logout o app limpa o `sessionStorage` e substitui a URL para remover parâmetros de autenticação.
- Para bloquear sessões persistentes a nível de tenant, um administrador pode criar uma Conditional Access policy no Entra ID definindo **Persistent browser session** como **Never persistent**.

**Solução de problemas**
- Se o redirecionamento retornar mas você não estiver autenticado:
	- Confirme que o Redirect URI no portal corresponde exatamente ao `VITE_REDIRECT_URI` (incluindo a barra final).
	- Teste em uma janela InPrivate/Incognito para evitar cookies em cache.
	- Se seu navegador bloquear cookies de terceiros, `storeAuthStateInCookie: true` está habilitado para melhorar a confiabilidade.
	- Abra DevTools → Console e verifique logs: o app registra o estado do MSAL na inicialização e no tratamento de redirecionamento.
- Se aparecerem erros do TypeScript/edição de módulos no editor, reinicie o servidor TypeScript no seu editor (VS Code → "TypeScript: Restart TS Server").

**Comandos**
- Instalar dependências:

```powershell
npm install
```
- Servidor de desenvolvimento:

```powershell
npm run dev
```
- Checagem TypeScript:

```powershell
npx tsc --noEmit
```
- Build / preview:

```powershell
npm run build
npm run preview
```

**Notas de segurança**
- Não exponha segredos (client secrets) em uma SPA. Use Authorization Code Flow com PKCE via MSAL.js e evite ROPC ou outros fluxos que exijam que credenciais sejam manipuladas no cliente.


