# QRDEMO Frontend Context (Pages)

## Architecture
- Frontend: Cloudflare Pages (Vite + React)
- Backend API: Cloudflare Workers under same origin path `/api/*`
- Auth: Cloudflare Access protects `app.takumienami.com/*`
- Session: `POST /api/token` sets HttpOnly cookie `sbtoken` (JWT for Supabase RLS)
- Data access: Frontend MUST NOT call Supabase directly. Use Workers API only.

## APIs used by frontend
- POST `/api/token` : establishes session cookie (use fetch with `credentials: 'include'`)
- GET `/api/samples?limit=10` : returns JSON array of `sample` rows

## Notes
- SPA routing is enabled on Pages.
- `index.html` cache should not be stale (headers added).
