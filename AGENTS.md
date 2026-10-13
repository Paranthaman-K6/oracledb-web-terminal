# AGENTS.md

Next.js 14 App Router + TypeScript + Tailwind. Serverless Oracle SQLPlus terminal for Vercel. API routes in `app/api/*/route.ts`, terminal UI in `components/terminal/`, Oracle/session logic in `lib/`. Path alias `@/*` maps to repo root.

## Commands

- `npm install` / `npm run dev` / `npm run build` / `npm start` / `npm run lint`
- `npm run build` runs Next compile + ESLint + typecheck; fix all three, not just tsc.
- No tests, no CI, no test runner configured. Verify with `npm run build` and manual `npm run dev` smoke test (`/` + `POST /api/auth/connect`, `GET /api/session/keepalive`).
- Copy `.env.example` to `.env.local` for local Oracle credentials.

## Oracle Thin mode — do not break

- `lib/oracle.ts` must stay in **Thin mode** (pure JS, Vercel-compatible). Never re-enable `oracledb.initOracleClient()` — it fails the build with `NJS-045` and breaks Vercel.
- Query behavior lives in `OracleConnection.execute()`: `OUT_FORMAT_OBJECT`, `autoCommit = true`, query-vs-DML regex, `maxRows: 1000`. Keep limits; Vercel functions cap at 30s (`vercel.json` `maxDuration`).
- Validate all API input with the Zod schemas in `lib/validation.ts` (`sessionId` must be UUID).

## TypeScript gotchas (all have broken `npm run build` before)

- `oracledb` ships no types. Use the hand-written `types/oracledb.d.ts`; do not add `@types/oracledb`. In it, `version`/`versionSuffix` are `const`, not `function`.
- `tsconfig.json` has no `target`/`downlevelIteration`: never `for...of` a `Map.entries()` iterator. Use `Array.from(map.entries()).forEach(...)` (see `lib/session.ts`).
- `components/terminal/Terminal.tsx` is a plain function component. Do not convert back to `forwardRef<HTMLDivElement>` with a custom imperative handle — types conflict.
- In JSX, `SQL>` must be written `SQL&gt;` (`TerminalInput.tsx`).
- `@phosphor-icons/react` has no `Wifi`, `WifiOff`, `Settings`. Use `WifiHigh`, `WifiNone`, `Gear` (plus `Cpu`, `Database`, `X`).

## Architecture notes

- Sessions are **in-memory `Map`s** (`lib/session.ts` `sessionStore`, plus a pool map in `lib/oracle.ts`). They do not survive serverless cold starts or scale across instances; expiry is 1h via `cleanupExpiredSessions`. Don't assume persistence; Redis is the intended upgrade.
- Auth state lives in cookies: `oracle_session` is `httpOnly` (set on connect, cleared on disconnect, 1h `Max-Age`), managed only in `lib/auth-cookie.ts` (server-only, uses `next/headers` — never import it or `lib/session`/`lib/oracle` from components). API routes accept `sessionId` in the body with cookie fallback; the client restores via `GET /api/auth/session` (returns user/connectString/settings, never secrets). Connection-form prefs (host/user/mode/protocol, never passwords) live in a readable `oracle_conn_prefs_v1` cookie via `lib/connection-defaults.ts`.
- Client components need `'use client'`; `next.config.js` client webpack fallback disables `fs`/`net`/`tls`/`crypto` — keep it so `oracledb` never bundles client-side.
- Tailwind theme tokens are `terminal.*` colors in `tailwind.config.ts`; global terminal styles in `app/globals.css`.
