# Site

This site's own things: its name, copy, brand, pages, and which modules are enabled. For the steps, see [Adapt it to your industry](../docs/customize.md).

| File | Contents |
|---|---|
| `site.ts` | Site name, industry word, edition times, home and about page copy, share image text, wording on items and on the daily, weekly and monthly reports, public API categories, ICP numbers |
| `models.ts` | Named models and which one each step uses by default (steps not listed use the one configured in `.env`) |
| `brand/` | Icons, logo (`Logo.tsx`), the wordmark on share images and posters (`wordmark.svg`, `wordmark-dark.svg`, optional), the nameplates of the daily, weekly and monthly reports (`nameplates/`), the about page QR codes (`contact/`, optional) |
| `pages/` | Terms of use and privacy notice (templates; rewrite them for your situation before launch) |
| `public/` | Fixed files published at the site root (published after placeholders such as the site name and URL are filled in): `robots.txt`, `manifest.webmanifest`, `openapi-v1.json`, and optionally `.well-known/security.txt` |
| `changelog.json` | Changelog |
| `modules/` | Which modules are enabled: three lists, `index.ts`, `server.ts` and `web.ts`, naming the modules under `modules/<name>/` at the repository root to use. All empty by default; see "Modules" in [Architecture](../docs/architecture.md#modules) |
