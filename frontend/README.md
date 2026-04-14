# AI Cloud Security Guardian — Frontend

A production-grade, SOC-terminal-themed security dashboard built with React, TypeScript, and Tailwind CSS.

---

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_BASE_URL to your backend
npm run dev                # http://localhost:5173
```

**Default credentials:** `admin / guardian2024` or `analyst / analyst2024`

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx          Top status bar
│   ├── Sidebar.tsx         Navigation sidebar
│   ├── AssetCard.tsx       Asset + stat cards
│   ├── RiskChart.tsx       Recharts visualizations
│   ├── AlertTable.tsx      Alert table with actions
│   └── Loader.tsx          Spinners + skeleton states
│
├── pages/
│   ├── Login.tsx           Secure login form
│   ├── Dashboard.tsx       Operations overview
│   ├── Assets.tsx          Cloud asset inventory
│   ├── Vulnerabilities.tsx Misconfiguration matrix
│   ├── Alerts.tsx          Alert management
│   └── Logs.tsx            Log anomaly detection
│
├── services/
│   └── api.ts              Axios client + all API calls
│
├── hooks/
│   └── useAuth.ts          Auth state + auto-logout
│
├── context/
│   └── AuthContext.tsx     React context provider
│
├── utils/
│   └── security.ts         XSS, validation, CSRF utilities
│
└── types/
    └── index.ts            TypeScript interfaces
```

---

## Security Architecture

### Authentication
- **In-memory token storage** — JWT lives in a module-level variable. Never touches `localStorage` or `sessionStorage`. Lost on page refresh, forcing re-authentication.
- **Auto-logout** — A timer is set from the JWT `exp` claim with a 30-second buffer. When it fires, the token is cleared and the user is redirected to login.
- **Global 401 handler** — Axios response interceptor catches 401/403 and triggers logout automatically.
- **Input validation** — Username and password are validated client-side before any API call.

### API Security
- **Axios interceptor** — Attaches `Authorization: Bearer <token>` to every request and a `X-CSRF-Token` header to all mutating requests (POST/PATCH/DELETE).
- **Throttled actions** — Scan and log-analyze buttons are throttled (10s and 2s respectively) to prevent rapid repeated requests.
- **Request timeout** — All API calls have a 30-second timeout.

### XSS Prevention
- All user-provided HTML is sanitized via **DOMPurify** before rendering.
- React's default JSX escaping handles the vast majority of cases — `dangerouslySetInnerHTML` is not used anywhere except through `sanitizeHtml()`.

### Input Validation
- `validateUsername()` — alphanumeric + underscore only, 3–32 chars.
- `validatePassword()` — 6–128 chars, no null bytes.
- `safeJsonParse()` — blocks `__proto__`, `constructor`, and `prototype` keys before parsing user-submitted JSON (prevents prototype pollution).

### Error Handling
- Backend error messages are sanitized — stack traces and file paths are stripped.
- Generic messages are shown in the UI. Raw backend `detail` is never forwarded.

### CSP
- Content Security Policy is declared in `index.html`. Adjust `connect-src` for your backend domain in production.

---

## API Integration

All API calls go through `src/services/api.ts`. The Axios instance is pre-configured with:
- Base URL from `VITE_API_BASE_URL`
- Auth interceptor
- 30s timeout
- Global 401 handler

| Function | Endpoint | Description |
|---|---|---|
| `login()` | `POST /auth/token` | OAuth2 password login |
| `runAwsScan()` | `GET /scan/aws` | Trigger full AWS scan |
| `getVulnerabilities()` | `GET /scan/vulnerabilities` | List findings |
| `getAlerts()` | `GET /alerts` | List alerts with filters |
| `acknowledgeAlert()` | `PATCH /alerts/:id/acknowledge` | Mark as acknowledged |
| `resolveAlert()` | `PATCH /alerts/:id/resolve` | Mark as resolved |
| `analyzeLogs()` | `POST /analyze-logs` | Run anomaly detection |
| `getAdvisorRecommendation()` | `POST /advisor` | AI remediation advice |
| `scoreResource()` | `POST /risk-score/` | ML risk scoring |

---

## Testing

```bash
npm test          # Run all tests (watch mode)
npm run test:ui   # Open Vitest UI
```

Test files:
- `tests/security.test.ts` — XSS, validation, CSRF, token expiry (30+ assertions)
- `tests/auth.test.ts` — Login flow, auto-logout, validation rejection
- `tests/components.test.tsx` — Loader, StatCard, AssetCard rendering

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite with Vitest |
| `npm run lint` | ESLint check |
| `npm run audit:fix` | Run `npm audit fix` to patch known vulnerabilities |

---

## Security Audit Report

### ✅ Implemented Controls

| Control | Implementation |
|---|---|
| JWT storage | In-memory only (module variable) — not in localStorage |
| XSS prevention | DOMPurify sanitization + React default escaping |
| Input validation | Username regex + password length/null byte checks |
| CSRF protection | `X-CSRF-Token` header generated via `crypto.getRandomValues()` |
| Auto-logout | Timer from JWT `exp`, 30s buffer |
| Global auth error | Axios interceptor for 401/403 |
| Error sanitization | Stack traces stripped from API error messages |
| Throttling | 10s scan throttle, 2s login throttle |
| Prototype pollution | `safeJsonParse()` blocks `__proto__`/`constructor` keys |
| Secure logging | `safeLog()` redacts tokens/passwords; disabled in production |
| CSP header | Declared in `index.html` meta tag |
| No secrets in env | Only `VITE_API_BASE_URL` exposed — no tokens or keys |

### ⚠️ Residual Risks & Recommendations

1. **Meta CSP vs HTTP CSP** — The `<meta>` CSP in `index.html` is weaker than a server-sent `Content-Security-Policy` header. Configure your web server (nginx/Cloudfront) to send the header for stronger enforcement.

2. **Token in memory = lost on refresh** — This is intentional and a security trade-off. Users must re-login after page refresh. If persistence is needed, consider short-lived HttpOnly cookies issued by the backend (requires backend changes).

3. **CSRF token not verified by backend** — The frontend generates and sends an `X-CSRF-Token` header, but the FastAPI backend does not validate it. Add CSRF middleware to the backend for full protection (relevant if you switch to cookie-based auth).

4. **Demo credentials in UI** — The login page renders demo credentials visibly. Remove this block before any public or production deployment.

5. **Dependency auditing** — Run `npm audit fix` after install. Pin exact versions in `package.json` (`"react": "18.3.1"` not `"^18.3.1"`) for reproducible builds in production.

6. **No Content-Security-Policy nonce** — Inline styles used by Tailwind and Recharts require `'unsafe-inline'` in the CSP. To remove this, switch to a CSS-in-JS approach with nonce support, or use a strict hash-based CSP.
