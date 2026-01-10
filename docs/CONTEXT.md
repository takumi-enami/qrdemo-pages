# QRDEMO Frontend Context (Pages)

## Architecture
- Frontend: Cloudflare Pages (Vite + React)
- Backend API: Cloudflare Workers under same origin path `/api/*`
- Auth: Cloudflare Access protects `app.takumienami.com/*`
- Session: `POST /api/token` sets HttpOnly cookie `sbtoken` (JWT for Supabase RLS)
- Data access: Frontend MUST NOT call Supabase directly. Use Workers API only.

## APIs used by frontend
- POST `/api/token` : establishes session cookie (use fetch with `credentials: 'include'`)
- GET `/api/samples?limit=50` : returns `{ ok: true, data: [...] }`
- Error format: `{ ok: false, error: { code, message, details? } }`
- POST `/api/samples/:id/advance` : expects `{ station_id?, note?, meta?, expected_version }`
- POST `/api/samples/:id/rollback` : expects `{ station_id?, note?, meta?, expected_version }`

## Notes
- SPA routing is enabled on Pages.
- `index.html` cache should not be stale (headers added).
- `/api/*` should be handled by Workers on the same origin; Pages should only serve the frontend.
- Step pages: `/receive`, `/prep`, `/weigh`, `/analyze`, `/report`, `/certify`.

## Deploy (Cloudflare Pages)
```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name qrdemo-pages
```

If the project name differs or is not created yet:
```bash
npx wrangler pages project list
```
