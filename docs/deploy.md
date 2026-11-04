# Deployment

## With Docker (recommended)

You need a machine with Docker (including Compose). A cloud server should have at least 2 cores and 4 GB of memory, which building the images needs.

```bash
git clone https://github.com/KKKKhazix/AIHOT.git myhot
cd myhot
node scripts/init-env.ts --llm-key <your model API key>
```

`init-env.ts` generates `.env`, fills in random secrets and an admin password, and prints the password once. If the machine has no Node, copy `.env.example` to `.env` and fill in `ADMIN_PASSWORD` (at least 12 characters), `SESSION_SECRET`, `IMG_PROXY_SIGN_SECRET`, `POSTGRES_PASSWORD` (generate each with `openssl rand -hex 32`) and `LLM_API_KEY` yourself.

Before starting, check `SITE_URL` in `.env`: keep `http://localhost:3000` to try it locally; when deploying to a server, change it to the address readers actually use. For example, when accessing it by the server's IP (replace the example IP with yours):

```dotenv
SITE_URL=http://192.0.2.10:3000
```

Absolute links in RSS, share links, the sitemap and Agent Markdown all use this value; they don't follow the address the browser happens to use. For a domain with HTTPS, set it up as described in [Domain and HTTPS](#domain-and-https) below.

Once configured, start it:

```bash
docker compose up -d --build
```

Then open `http://<server address>:3000`. The admin is at `/admin`; log in with the admin password. The first start imports the demo sources, and content starts to appear after a minute or two; the hundred-odd items of the first import take about half an hour to process (each one is pre-screened, scored, structured, given a headline and summary, and then grouped).

`docker compose` starts five containers: `db` (PostgreSQL 17), `setup` (runs database migrations and seed data on every start, then exits), `api`, `worker` (fetching, model processing, scheduled jobs) and `web` (the website). `web` only receives web configuration such as the site address and API address, and reads the API over HTTP; the database, models, admin secrets and the data volumes are only given to the backend containers.

### On servers in mainland China

- Use a domestic npm mirror when building: `docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com`, then `docker compose up -d`.
- If pulling Docker images is slow, configure a registry mirror for Docker first.
- If overseas sources can't be reached, set `EGRESS_PROXY_URL` in `.env`: fetching sources and images goes through this proxy; model API calls don't.
- Serving a public website requires ICP filing first; put the filing number in `icp` in `site/site.ts`.

### Domain and HTTPS

Point the domain at the server first, then set in `.env`:

```bash
SITE_URL=https://example.com
SITE_DOMAIN=example.com
PORT=127.0.0.1:3000        # port 3000 is only for the local Caddy, not exposed directly
TRUST_PROXY=true           # read the visitor address from the headers Caddy forwards
```

Then start with HTTPS; Caddy requests and renews the certificate automatically:

```bash
docker compose --profile https up -d --build
```

If you already run Nginx, skip Caddy: reverse-proxy the site to `http://127.0.0.1:3000` with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` and `proxy_set_header X-Forwarded-Proto $scheme;` (the admin login uses it to tell whether the request is HTTPS; without it the login cookie loses `Secure`), and set `TRUST_PROXY=true` in `.env`. `SITE_URL` must be the address readers actually use: generated links, RSS, share images and MCP all use it.

By default MCP accepts the host of `SITE_URL` plus `localhost`, `127.0.0.1` and `[::1]`. Configure extra hosts in `MCP_ALLOWED_HOSTS`, comma-separated, for example `extra.example:8443,[2001:db8::1]`. Host names are case-insensitive and IPv6 addresses need square brackets; a decimal port from 0 to 65535 is allowed and ignored when matching. Entries with a path, user info or an invalid port don't take effect. Aliases such as `127.1` must be listed explicitly. This setting only affects the Host check; it doesn't widen what browser Origins are allowed.

If a cache such as Nginx or a CDN sits in front, follow the cache lifetimes the application returns (`Cache-Control`): public pages, navigation data, the API, RSS, item Markdown, report share images, the sitemap, and the integration docs `/api/v1/agent` and `/openapi-v1.json` (which must also be revalidated after their five minutes expire) must not get a longer cache lifetime added, must not be served stale offline after expiry, and must not have their age restarted when an old response is forwarded. Don't let a proxy and a CDN both cache dynamic content. The framework doesn't manage CDNs for self-hosted sites and doesn't purge their caches.

### Updating

**The English conversion of November 2026** adds three database migrations (`0124`–`0126`), which setup runs when you update with the commands below. Changes to note:

- **WeChat official-account sources removed.** WeChat sources (`mp_account`) and the Dajiala provider are gone: they are no longer collected, and `DAJIALA_KEY` is no longer read (delete it from `.env`). Existing WeChat sources and their articles stay in the database but are never fetched again; disable or delete them in the admin, or run `UPDATE sources SET enabled = false WHERE kind = 'mp_account'`. Migrations 0124–0126 drop the three WeChat lookup indexes on `articles`. The `dajiala` row in `budgets` and the pg-boss queue `sources.mp` are no longer used; remove them by hand if you like (`DELETE FROM budgets WHERE service = 'dajiala'`). The about page's WeChat QR slot is gone; old `qr-wechat-*` files in `.data/uploads/` can be deleted. WeChat article URLs seen through other sources now use plain URL identity, so a post first stored under its old signed key may be stored again.
- **Site language is English.** Prompts, taxonomy tags, report titles and the UI are English; Chinese date formats in sources are no longer parsed. Articles, tags and reports already stored keep their Chinese text: stored tags no longer match the taxonomy or topics until those articles are re-processed.
- **The crawler's User-Agent is configurable** with the optional `CRAWLER_USER_AGENT`; unset, fetches send the same User-Agent as before. A source refusing a fetch in the admin (such as a preview) now answers 502 with the refused status instead of a 500 internal error.

**The engine sync of October 31, 2026** has three database migrations (`0090`–`0092`), which setup runs when you update with the commands below: sources get an optional category column `selection_class`, and feedback gets two columns, `kind` (type) and `idea` (the suggestion it is filed under). All are nullable, so existing data doesn't need changes. There are no new required environment variables. Changes to note:

- **`industry/selection.ts` gains `classes` and `browseFloor`**; see [Selection and calibration](selection.md#thresholds-industryselectionts). If you changed this file yourself, add both when merging, or the typecheck fails.
  - `classes`: source categories and their minimum thresholds. On the admin "Sources" page you can give an official source a category, which raises its threshold to at least the category's value, never lowering it; sources without a category behave as before.
  - `browseFloor` (default 40): browsing "All AI news" (the web list, `mode=all` of `/api/v1/items` and `/api/v1/agent/latest`, `all` in the MCP latest list, and the "All AI news" RSS) only shows material with an average score of at least this value; material without a score is shown as usual, and search still covers everything. Set it to `0` to list everything as before.
- **Alerts**:
  - New "many sources failing to fetch": with collection on, when at least 50 sources failed their most recent fetch and they make up more than 15% of recently fetched sources, a "readers affected" level alert is raised. Usually the server's outbound connection or proxy is down.
  - Optional `WEBHOOK_HUB_URL` and `WEBHOOK_HUB_KEY` (protocol in `.env.example`): once set (with `FEISHU_INTERNAL_ENABLED=true` as well), "readers affected" and "handle today" alerts go to your own automated handling service first, and reach you only if the problem hasn't recovered 1 hour (readers affected) or 3 hours (handle today) after being handed over, or if the same problem is handed over for the third time in a day. Problems only you can handle (for example the model service refusing calls, or an account or quota to check) are still sent to you immediately. Once the service accepts the 09:00 system daily report, it isn't sent to you. Messages meant for you personally also go to its `/tell` first and fall back to Feishu if not accepted. If delivery fails for more than 30 minutes, an "automated handling can't receive tasks" alert is raised, and alerts go straight to you meanwhile. Without this configured, nothing changes. The previously read but undocumented `AGENT_WEBHOOK_URL` and `AGENT_WEBHOOK_KEY` are no longer read, and the request format changed; if you used them, update according to `.env.example`.
  - The alert group bot (`FEISHU_ALERT_WEBHOOK_URL`) sends one message at a time and waits 600 milliseconds after the previous one is answered or fails, so it stays within Feishu's rate limit for custom bots.
- **Pause after the model service refuses calls**: a request sent before the refusal that later succeeds no longer lifts the pause (it may have used up the last of the quota); only a request sent after the refusal lifts it. A refusal also no longer deletes other models' pause records that expired a day ago: two models refused at the same time would wait for each other's row lock, deadlock, and lose that refusal. Expired pauses no longer take effect anyway; they stay in `settings` and are deleted the next time that model's call succeeds.
- **Images**: images on web pages are offered as AVIF first (`<picture>`; browsers without support use the original format as before). The worker generates AVIF versions on demand in the background and only keeps them if they are at least 10% smaller than the original; until one is ready, the original format is returned. The image cache takes a bit more space. For images the origin refused or deleted (401, 403, 404, 410), the failure is cached for 6 hours instead of going back to the origin every minute.
- **Backups**: each file is uploaded only once, under one prefix (see [Backups](#backups) below); previously a copy went to `daily/` every day, plus one more each on Sundays and on the 1st of the month. If you set expiry rules by prefix, check them. Without attachments only the `.dump` is uploaded; an empty file archive is no longer created.
- **Feedback admin**: feedback can be tagged with a type (bug, suggestion, question, other); suggestions can be filed under a suggestion name, using the same name for the same request, and the "Suggestion pool" is sorted by the number of people who asked.

New optional `PRIVATE_FEED_HOSTS`: when a source's feed or list address is a service you host on your internal network (such as RSSHub), put its host name here instead of turning on `ALLOW_PRIVATE_NETWORK_FETCH` for the whole site; see [Sources](sources.md). Without it, behavior is unchanged; no database migration is needed.

When every daily report expected in a weekly or monthly period exists and all their original body entries are empty, that edition is skipped automatically instead of reporting an error every half hour; no empty weekly or monthly reports are added to the archive. The first period checked starts from the site's earliest daily report. When there is nothing to compile and a daily report is missing, or the original entries can no longer be published or are being corrected manually, the original error is kept. No database migration or configuration change is needed; it takes effect at the next scheduled check after upgrading.

The fix for native video in article bodies adds playback controls to existing usable videos and removes empty players, without writing back to articles or calling models. Media addresses that the old cleanup already discarded can't be recovered from the archive. The upgrade doesn't re-extract in bulk: bodies already extracted successfully are skipped, and re-extraction with the same content hash may keep the old HTML. New bodies keep native video as described in [Sources](sources.md); the files are still loaded by the browser directly from the origin, and signed URLs may expire.

Inline SVG figures in article illustrations now keep the text description the original site wrote (see [Sources](sources.md)). This only affects bodies extracted from now on; stored bodies are unchanged, and the upgrade doesn't re-extract in bulk.

Back up first as described in [Backups](#backups) below. Once the build is done, stop the old services, then run the migrations and the new services:

```bash
git pull
docker compose build
docker compose stop api worker web
docker compose run --rm setup && docker compose up -d
```

Start the services only after the migrations succeed; if a migration fails, read the error first and don't continue starting. Sites using the HTTPS configuration keep `--profile https`. The old API and worker must be stopped before migrating: migrations may drop tables and columns, and old code still running would fail. A normal worker shutdown waits for paid calls in progress to finish (up to a little over three minutes). Non-Docker deployments update in the same order: back up, build, stop API/worker/web, migrate (`scripts/migrate.ts`), seed (`scripts/seed.ts`), start.

When a new migration runs into a long-held lock, it reports the file name and a wait timeout; deal with the transaction holding the lock first, then rerun setup. Don't skip migrations or edit the migration ledger. An interrupted concurrent index build may leave an invalid index: after confirming the object named in the error, clean up the failed index with `DROP INDEX CONCURRENTLY <index name>` and rerun; for a valid index with the same name but a different definition, check the difference first. These protections don't change the Docker update order above, and upgrading across old versions may still run historical destructive migrations.

Below, the things to watch for in each update are listed from newest to oldest.

Alerts for missing daily reports track each specific date in Beijing time (UTC+8) and don't recover automatically at midnight; a recovery notice is only sent once that daily report exists. New missing editions are checked over the last 7 calendar days (including today), no earlier than the earliest daily report or `reports.compose` run record; without any history, only today is checked. A date that has already alerted is tracked for those 7 days, and turning off collection or models or the worker's startup grace period doesn't count as recovery; if there is still no daily report after 7 days, one final "couldn't fill it, no more reminders" message is sent. The old `report.daily` state is migrated automatically using the time of the first alert, keeping the reminder interval. The alert two hours after the edition time, the hourly reminders and the Feishu switches are unchanged; no database migration is needed. A custom responder that matches the old `report.daily` exactly must be changed to recognize the date key `report.daily:YYYY-MM-DD`.

#### Reader wording replacements (October 9, 2026)

No migration and no new required environment variables. The industry pack gains `industry/wording.ts` (words not to use in reader-facing text; empty in the template) and the prompt `mend-wording.md`; both come in with the update when you merge and don't conflict with your own industry pack. With an empty word list nothing is checked and no extra model calls are made; once you add words, headlines, summaries and reasons to read that use them get one more model call (the model step "Mend wording"; the optional `WORDING_MODEL` picks a separate model). See [Make it your field](customize.md).

#### Hiding navigation entries

No migration and no new environment variables. `site/site.ts` gains `NAV.hidden` (currently only the trending list `"/hot"` and topics `"/topics"` are supported; see [Make it your field](customize.md)). The framework reads it from `@aihot/site`, so **sites that maintain their own `site/site.ts` must add `NAV` from the template when merging**, or the typecheck fails. It is empty in the template, so navigation stays the same; hiding an entry doesn't close the page or the public interfaces.

#### Original posts and engine sync (October 6, 2026)

No new required environment variables or database migrations. Sites that maintain their own `site/site.ts` need to add `REPORTS.quiet`, following the example configuration: when material was judged during the daily report window but there was no new major news, the edition is published as usual with these two sentences as headline and lead; `{start}` and `{end}` in the lead are the start and end of the window. If no material was judged at all, it still counts as a collection or judging failure, not disguised as a quiet day.

X posts with an empty body or only a link keep their original links, images and quotes, and don't call the writing or translation model; when the source allows full text, image-only posts can be shown too, and the existing display and redistribution permissions still apply. X long-form posts with actual body text are processed as usual. Old translations no longer appear on the public pages of these posts either. For posts that already got a wrong headline and summary, you can rebuild the public content after updating with `publishArticle(id)` from `packages/backend/src/publication/publish.ts`, without calling the model again.

MCP `subscriptions/listen` now immediately returns HTTP 404 and JSON-RPC `-32601 Method not found`. The server never pushes changes; ordinary tool calls work as before. Clients receiving this answer should not retry establishing a standing subscription.

Tests that don't need a database are now `*.standalone.test.ts`; `npm test` still runs all backend tests and only creates database copies for the files that need one. Run these tests on their own with `npm run test:standalone`.

#### Community fixes, time rules and read optimizations (October 4, 2026)

The public interface version is still 4.0.0. No new required environment variables; there is one new optional `LLM_REASONING_TOKENS`; see the `site/models.ts` item below.

**Switches only accept `true`**: every `*_ENABLED` switch in `.env` (`COLLECT_ENABLED`, `MODEL_CALLS_ENABLED`, `FEISHU_*_ENABLED`, `INDEXNOW_SUBMIT_ENABLED` and so on) is only on when written as lowercase `true`. `1` or `TRUE` used to count as on and now count as off; check `.env` before upgrading and change them to `true`.

**Migrations**: seven new migrations; just let setup run them following the steps above. None of them delete data, rewrite articles or existing embeddings, or call models. Migrations are recorded by full file name, and different files with the same number each run.

- `0055_publication_selected_published_idx.sql`, `0056_analyses_composite_id_idx.sql`, `0056_publications_pool_category_timeline_idx.sql`, `0057_publications_pool_channel_timeline_idx.sql`: build query indexes concurrently, without blocking normal reads and writes.
- `0056_publication_release_selection_stats.sql`, `0057_analyze_publication_release_selection.sql`: create and collect query statistics for public lists.
- `0083_publications_selected_source_idx.sql`: concurrently builds a covering index for counting selections per source, reducing reads for admin statistics.

Together with these indexes, this update reduces the database cost of public reads and event recall; API content, search weights and the event candidate range are unchanged.

**Sites that changed these files themselves should compare against the new files when merging**:

- `site/site.ts` gains several entries:
  - `EDITION_TIMES`, `EDITION_WHEN`: the publishing times of the daily, weekly and monthly reports, previously hard-coded. Scheduling, the daily report's time window, missing-edition alerts and copy that mentions times all read them. Files in `public/` use the placeholders `{{dailyTime}}`, `{{weeklyTime}}` and `{{monthlyTime}}`.
  - `ITEM_COPY`: what the reason to read is called, and whether scores are shown on pages and share images.
  - `REPORTS.descriptions`, `entry`, `metricUnits`, `shareUnit`: descriptions of report pages and the wording on their layout.
  - Copy in `ABOUT` and `CARDS` that mentions publishing times and reasons to read now references the entries above.
  - `DEPLOYMENT.directImageHosts` is renamed `directFetchHosts`; collection and images share this direct-connection list.
  - `SITE.feedbackLead`, `SITE.feedbackEmailHint`: the sentence under the feedback page title and the hint in the email field, previously hard-coded.
  - `SITE.psb`: an optional public security filing number; use `null` if you don't have one or it doesn't apply.
  - `ABOUT.lead` no longer has spaces around `{sources}`; the page adds them.
- `site/models.ts`: the scoring call parameters are now configured by a named preset's `scoreCall`; if you keep `glm-5.3-flash-selection`, copy the temperature, output budget and timeout from the example. Existing custom models without this entry use the engine defaults.
- `ModelPreset` in `site/models.ts` and `Founder` in `site/site.ts` are now both imported from `@aihot/contracts/site-config`; existing site configuration values are kept. If you customized these two files, update the type imports so you don't miss optional fields the engine adds.
- A database migration that meets a running `pg_dump` export waits first, for at most as long as the worker drain time; on timeout it exits before running that migration, and you rerun the update command once the export finishes. Other locks still fail fast.
- The migration drops the retired column `translation_attempts.request_tag`; translated bodies, attempt records and paid receipts are kept. The original precision of the source publication time is now stored separately; for old material where it can't be determined it stays unknown, and midnight is not automatically taken to mean the source only gave a date.
- `site/models.ts`: the budget for reasoning models is now explicit configuration. Set `LLM_REASONING_TOKENS` for the default model and `reasoningTokens` for named models. Previously only named models whose name ended in `-think` got an extra 4000; that is gone, so if you added such models, add `reasoningTokens: 4000` to keep the old budget. When a reasoning model uses up its budget, the error states `finish_reason=length` and which setting to change.
- `industry/prompts/story-digest.md`: the event overview is written differently: the first sentence states the core change and the current conclusion, then the necessary background follows in short paragraphs, without retelling the timeline below by date, without commenting on the reports themselves, and no longer hard-coding the industry. Existing overviews are not rewritten in bulk; they switch to the new style gradually as new reports arrive. To rewrite certain events right away, see the last section of [Overview evaluation](story-digest-evaluation.md) (`rewriteStoryDigest`, one model call per event).
- Compose files you maintain yourself can drop `LOCAL_ROUTER_URL`: share image prewarming now reuses the backend renderer directly instead of requesting a fixed local port, no code reads this entry anymore, and the bundled `docker-compose.yml` has removed it. Share image addresses, formats and caching are unchanged.

**Collection and publication times**:

- **Source archives are no longer collected after the first import**: previously, after a new source's first import, the second fetch took all the remaining old items in the feed as historical content and analyzed each one at a cost (over a thousand at once for the demo sources). Now later fetches only collect items published no earlier than 48 hours before the source's first import; items without a date are still collected, and X accounts are unaffected. See "Old articles don't flood the site" in [Sources](sources.md#rule-old-articles-dont-flood-the-site). Old items collected before the upgrade are archived by their original time, don't enter "Today" or the daily report, and were analyzed long ago, so nothing needs to be done.
- **New material without a trustworthy publication time stays private at first**: it doesn't enter public lists, the selection, reports, trending or pushes until a date is read from the original source or the article page, and is then judged as new or old. While the date is unknown, the article page, structured data and Agent Markdown label it "collected at", RSS omits `pubDate`, and OpenAPI notes that `publishedAt` on event timelines and daily report briefs is then the collection time.
- **Times without a timezone in JSON APIs** (such as `2026-09-30 17:43:58`) are read in the source's `publishedAtUtcOffset`. They used to be read in the server's time zone, which is UTC in Docker, so new items from such existing sources now get the correct time.
- **Article page dates use the same source time zone**: filling in dates from detail pages and body extraction first uses `detail.publishedAtUtcOffset`, and otherwise inherits the source's `publishedAtUtcOffset`. This only affects later collection and date filling; existing publication times are not rewritten in bulk.
- **Detail completion**: dates, headlines and summaries that failed or exceeded this round's fetch limit are filled in by later collection, and confirmed bodies are kept as they are; when a source request succeeds but misses the date, headline or body, it is completed too and recorded in source health. Jina detail rules must match the format actually returned; for a fixed collection start, Intercom date sections and video descriptions, see [Sources](sources.md).
- **Video player pages are not article bodies**: for all sources, YouTube and Vimeo player pages are no longer fetched as article bodies, and YouTube video pages are no longer treated as images. Video descriptions in RSS are used only as summaries; real text supplied directly by the feed is kept. The upgrade doesn't delete or reanalyze existing bodies in bulk. If old video records picked up player navigation, verify them one by one; on the detail page of admin "Content diagnostics" you can set them to summary only to stop showing the wrong body.
- **RSS**: text feeds where the summary is confirmed to be the full text can set `summaryIsBody` (Atom's `summary` counts too). For podcast episodes without a web page, the original link is now the audio or video file, and no web page is fetched.
- **Preview and real collection use the same filters**: admin "Preview fetch" also applies URL prefixes, categories, noise words, URL rewrites and `publishedAfter`, so the items you see in a preview are the ones real collection stores.
- **Source icons aren't fetched with collection off**: when `COLLECT_ENABLED` isn't `true`, the 04:40 daily job that fetches source icons stops too and no longer visits source sites.
- **Verified historical dates can be corrected**: an operations script first calls `previewPublicationDateCorrection` in `admin/content.ts`, then calls `correctPublicationDate` with the version and checksum from the preview, recording the operator and the reason. Only explicit corrections where both the old and new dates are older than the seven-day window are accepted; material revisions, selection and grouping are kept, and models aren't rerun. If the material or date has changed, or the correction would change other public decisions, the operation is refused and must be checked again. There is no bulk backfill and no new public interface.
- **Public scores can be corrected or withdrawn manually**: the admin content details offer "By model", "Withdraw score" and "Manual score". A manual score accepts 0–100; withdrawing makes the public value `null`; clearing the score override restores the saved model score. A correction needs a reason and a version check, keeps the original analysis and an audit record, updates the web pages, API, RSS, Agent Markdown and MCP together, and doesn't rerun models. Existing articles are not rescored or reselected in bulk by the upgrade.

**Public outputs**:

- **Category filtering follows `PUBLIC_CATEGORIES`**: `category` in the API, RSS and MCP covers every category that counts as that category in the public interfaces. For sites that don't merge categories (the default), filtering by `tip` no longer brings in opinion pieces; industries without a `tip` category also pass the typecheck.
- **Past reports still need revalidation**: the date, week or month identifies which edition it is, not that its content never changes. A report keeps the headline and summary written when it was published, while source names and citation times follow the current public material; retracted citations, and the introductions and covers that depend on them, are no longer distributed. Clients that keep copies of reports should request again with `If-None-Match` once `Cache-Control` expires.
- **Sites that configured Nginx or CDN caching themselves must check their rules**: check them against the requirements at the end of [Domain and HTTPS](#domain-and-https), and purge the existing proxy and CDN caches for these paths when updating, including the integration docs `/api/v1/agent` and `/openapi-v1.json`.
- **The sitemap no longer keeps serving an old file forever when rebuilding fails**: the process, the disk copy and the HTTP response share the original five-minute lifetime; once expired and unable to rebuild, it returns `503` with `Retry-After`. MCP still uses `no-store`; API and Agent content is revalidated after expiry.

**Tools and fixes**:

- **Overview evaluation**: `scripts/eval-story-digests.ts` exports real events from the database and runs the current prompt and a candidate prompt side by side on the same events; see [Overview evaluation](story-digest-evaluation.md). The three evaluation scripts share `scripts/eval-tools.ts`; `eval-selection.ts` now fails immediately on a wrong `--n`, `--concurrency` or model name.
- **Migrations don't block reads and writes**: each new migration file holds a single statement that is safe to run online, without backfilling or rewriting whole tables, and indexes use `CREATE INDEX CONCURRENTLY IF NOT EXISTS`; CI checks this with `scripts/check-migrations.ts`. Statistics maintenance only targets specific tables and columns; see [Architecture](architecture.md#database-migrations) for the rules.
- MCP requests have a size limit, and error logs no longer contain credentials.
- The desktop sidebar shows a thin scrollbar when zoomed in.
- Tests recognize requests by the actual prompt of each step and read thresholds from `industry/selection.ts`, so rewriting prompts and thresholds for another industry no longer causes false failures; the architecture test no longer depends on the path separator.

#### Site files moved into `site/` (October 4, 2026)

The public interfaces are unchanged; the version is still 4.0.0.

- **The site's own files moved from `industry/` to `site/`**: `site.ts`, `models.ts`, `brand/`, `pages/`, `public/` and `changelog.json`. `industry/` keeps only industry knowledge: `taxonomy.ts`, `topics.json`, `sources.json`, `prompts/` and `selection.ts`. If you changed these files, move your changes to the files of the same name under `site/` when merging.
- **`site.ts` gains several entries**, all optional: `SITE.github`, `SITE.llmsIntro`, `SITE.rootIcons`, `POLICY.terms.license`, `POLICY.terms.headers`, `ABOUT.termsAnchor` (QR code cards can have an `alias`), and `ACCESS`, `ADMIN`, `DEPLOYMENT`, `FEED_COPY`, `PUBLIC_CATEGORIES`; see [Make it your field](customize.md). `PUBLIC_CATEGORIES` replaces `publicAs` from 4.0.0: if you wrote `publicAs: "tip"` on a category, write it in `PUBLIC_CATEGORIES.merge` instead (the key is that category's key, the value is `"tip"`).
- **`DEPLOYMENT.requiredSecrets`** is a list of extra credentials the production API checks at startup, empty by default; the basic session, image signing and admin login checks still apply. Only fill it in when your deployment requires a certain optional integration to be configured.
- **Features that belong only to your site can be modules**: put them in `modules/<name>/` and enable them in the manifests in `site/modules/`; see [Modules](architecture.md#modules) in the architecture document. The framework itself ships no modules.
- **The agent integration page opens on MCP by default**, and lists three ways to connect: MCP, RSS and the API. The Agent Markdown API is still at `/api/v1/agent`, reachable from "Agent instructions" at the bottom of the page.
- **The image proxy can have traffic limits**: `IMGPROXY_UPSTREAM_MB_PER_MINUTE` and `IMGPROXY_UPSTREAM_GB_PER_DAY` (or `DEPLOYMENT.imageUpstreamBudget` in `site.ts`), unset by default.
- **Fixes**: the same data always produces the same bytes (sorting ties get a unique order, so API and RSS ETags no longer change for no reason); requests the web app forwards to the api no longer carry hop-by-hop headers, so `Connection: close` no longer breaks the next POST; `llms.txt` counts the actual ways to connect instead of saying four.

#### Upgrading to public API 4.0.0 (October 3, 2026)

- **The model leaderboard, the Codex reset monitor and the milestone timelines on topic pages are no longer part of the framework**; they stay only on AIHOT. The pages (`/leaderboard`, `/codex-reset`), the APIs (`/api/v1/codex-resets`, `/api/v1/codex-resets/recent`, `/api/v1/agent/codex-resets`) and the MCP tool `<prefix>_get_codex_resets` are removed, and the versions of MCP and `/openapi-v1.json` go up to 4.0.0. Migration `0053` drops their tables (`lb_*`, `monitor_*`, `fx_rates`) and settings; the scheduled jobs and their queues are removed automatically when the worker starts, and the admin run history is kept. If you want to keep this data, back it up before upgrading. Company topic pages now show the company name's initial as the logo.
- **The industry pack changes in several places**; if you changed `industry/`, compare against the new files when merging and add what's missing:
  - `site.ts` gains `topicsTitle`, `feedbackExample`, `keywords`, `since`, `interfaceVersion`, `POLICY` (names and descriptions of the terms of use and privacy pages, and whether X posts count as full text), `ABOUT.description`, `ABOUT.sourcesFallback`, `AGENT`, `REPORTS`, `ALERTS`, `SOURCE_DEFAULTS`, `COMMUNITY_FEEDS` and `CARDS`; the two QR code cards in the author block get a `kind`, and `ABOUT.copyright` becomes two parts around the feedback page link.
  - New `models.ts`: named models and which one each step uses by default, previously in the code.
  - The logo at the top left of the website moved from `apps/web/app/components/Logo.tsx` to `industry/brand/Logo.tsx` (later moved under `site/`; see above).
  - New `public/`: `robots.txt` and `manifest.webmanifest` used to be generated in code, and the OpenAPI description used to be in `reference/`; now they are all files here. `/.well-known/security.txt`, which used to be generated whenever `contactEmail` was set, now needs its own `public/.well-known/security.txt` (later moved under `site/`; see above).
  - `features.ts`, `chronicle.ts` and `chronicles/` are removed; `orgNames`, `leaderboardProvider` and `chronicleTerms` in `topics.json` are no longer used and can be deleted.
  - Categories in `taxonomy.ts` can have a `feedLabel` (the name in the category RSS title; the example site uses phrasing like "AI models"); `ENTITIES` gains a few companies. Back then a category could also have `publicAs` to merge it into another category in the public interfaces; that field was later removed in favor of `PUBLIC_CATEGORIES.merge` in `site/site.ts` (see above), and `publicAs` now fails the typecheck.
- **The push API's rate limit is configurable**: how many pushes per minute each client may send to `/api/ingest/items` is set by `INGEST_RATE_LIMIT`; `docker compose` defaults to 10, as before. Without Docker there is no limit by default; if no proxy in front limits it, set one in `.env`.
- **Environment variables no longer used**: `ARTIFICIAL_ANALYSIS_API_KEY` and `MONITOR_MODEL` can be removed from `.env`.

#### Upgrading to public API 3.0.0 (October 3, 2026)

- **Safety valves default to off**: `COLLECT_ENABLED` and `MODEL_CALLS_ENABLED` are only on when written as `true`; unset means off. The `.env` generated by `scripts/init-env.ts` already has both lines; if your hand-written `.env` lacks them, add them, or after upgrading nothing is collected and no model is called.
- **The weekly and monthly report APIs changed shape**: lists and editions of `/api/v1/weeklies` and `/api/v1/monthlies` carry `periodStart` and `periodEnd`, the body becomes `sections[]` (each with `label`, `summary`, `items`), `title` and `themes` are gone, and the list `limit` is at most 60. Programs that read these APIs must change accordingly; the versions of MCP and `/openapi-v1.json` go up to 3.0.0.
- **Machine outputs of the selection carry one entry per piece of news**: in the API's `mode=selected`, the sync API and the selection RSS, only the representative report of a piece of news remains; the other reports appear as `remove` in the sync changes (they are still in `mode=all`). Old reports selected before the upgrade are not reorganized; they are merged when a new report on that news is published.
- **Selection waits for dedup confirmation**: material with a high enough score enters the selection only after grouping confirms it is not a repeat of news already selected and brings new information; until then it is only in "All AI news". When the grouping model's answer doesn't match the format, the item stays there; the admin "Runs" page shows it.
- **First-hand is determined only by tier**: `T1` means first-hand, and `first_party` is no longer set separately; `T1_5` and `T2` sources previously marked first-hand on their own no longer count as first-hand; change them to `T1` if they should.
- **The industry pack gains a few entries**: `taxonomy.ts` adds `RELEASE` and `PLAIN_TERMS`, commentary categories are marked `commentary: true`, `ENTITIES` can have `otherNames`, and `CATEGORY_BY_ITEM_TYPE` is no longer used. Sites already switched to another industry should add these when merging, following [Make it your field](customize.md).
- **Topics are read only from `industry/topics.json`**: the migration drops the `topics` table from the database. If you changed topics only in the database and not in the file, write them into the file before upgrading. Company topics only use `entityId`; `related` is no longer used.
- **Daily reports no longer call models**: daily reports are compiled by rule, weekly and monthly reports are compiled from the dailies, and the model only writes the overview and section introductions; editions already published are not rewritten.
- **Prompts changed**: `structure.md`, `group-*.md`, `story-digest.md` and `report-period.md` in `industry/prompts/` were rewritten, `report-daily-lead.md` was removed, and `report-period-sections.md` was added. If you changed these prompts, carry your changes over to the new versions.
- **Removed scripts**: `scripts/delete-sources.ts`, `scripts/regroup-events.ts` and `scripts/enqueue-analysis.ts`. Pause sources you don't want in the admin; re-evaluate or regroup a single article by opening it in admin "Content diagnostics".
- **Admin sessions are bound to the login method** (migration `0041`): after upgrading from a version without session binding, old unbound sessions need to log in again. Databases that already tried the session binding migration can upgrade directly; existing columns and bindings are kept, and the migration records don't need manual changes. For the rules after that, see [Admin sessions and configuration changes](#admin-sessions-and-configuration-changes) below.
- **In 3.x, `/agent` opens on Agent Markdown by default**, and the MCP integration instructions are at `/agent?tab=mcp`; for the current integration page, see "Site files moved into `site/`" above.
- **The Feishu content group only receives selections from `T1` and `T1_5` sources.**

### Backups

Configure `DB_BACKUP_STORE_*` in `.env` (any S3-compatible object storage), and a backup is made there automatically every day at 04:10. `DB_BACKUP_STORE_SECRET_ID`, `DB_BACKUP_STORE_SECRET_KEY`, `DB_BACKUP_STORE_BUCKET` and `DB_BACKUP_STORE_REGION` are all required. Without `DB_BACKUP_STORE_DOMAIN`, the address is built for Tencent Cloud COS (`<bucket>.cos.<region>.myqcloud.com`); for other S3-compatible storage, put the bucket's access domain (including the bucket name, for example `<bucket>.s3.<region>.amazonaws.com` for AWS S3) in `DB_BACKUP_STORE_DOMAIN`.

A complete backup consists of a database `.dump` and a file archive `.tar.gz` with the same timestamp, named after the database: in Docker the database is called `aihot`, so they are `aihot-<time>.dump` and `aihot-files-<time>.tar.gz`. The file archive keeps `uploads/` and any `feedback-screenshots/` still stored locally, but not the image cache or the local backup directory; when these directories hold no files, there is only the `.dump`. Images already forwarded to Feishu are kept only as external references in the database; the file archive doesn't save images stored on Feishu.

Each file is uploaded only once, under one prefix: `monthly/` on the 1st of each month, `weekly/` on Sundays, and `daily/` on other days. You can set different expiry times per prefix in the object storage.

To restore, fetch both files together (if there is only a `.dump`, restore only the database): restore the `.dump` into an empty database with a `pg_restore` compatible with the database version, then extract the file archive into the root of the data directory (`/data` in Docker; without Docker, `AIHOT_DATA_DIR`, default `.data`), keeping the subdirectory structure inside the archive, and make sure the running processes can read the files. Restoring only the database can't bring back feedback screenshots still referenced as `local:`; files not included in an old backup can't be recovered from database references either.

The manual export below covers only the database, not the attachment directories above:

```bash
docker compose exec -T db pg_dump -U aihot aihot | gzip > myhot-$(date +%F).sql.gz
```

All data lives in three Docker volumes: `db` (the database), `data` (uploaded images, the image cache, local backups) and `caddy` (certificates). `docker compose down` doesn't delete them; `docker compose down -v` does.

### Logs

```bash
docker compose logs -f --tail 100 api worker web
```

The admin "Runs" page shows the latest result of each scheduled job, and the "Sources" page shows how each source is fetching.

### Admin sessions and configuration changes

A session is bound to the login method and to the admin credential or Feishu identity used at login. After changing the admin password, the Feishu admin list or the session secret, restart every API process so they all load the same new configuration; editing the configuration file doesn't mean running processes have picked it up, and processes running old code or old configuration can't provide consistent revocation.

Once the effective configuration changes, password sessions no longer accept authorization from the old password, and Feishu sessions are checked against the current list by the union ID or email actually obtained at login (either one still being authorized is enough). Disabling the Feishu login app or changing the app ID invalidates Feishu sessions; rotating only the secret of the same app doesn't log out Feishu sessions that are still authorized. Rotating or removing `SESSION_SECRET` invalidates both kinds of session.

Sessions found to be invalid during authentication are deleted, and restoring the old configuration doesn't bring them back. The system doesn't record a history of global credential changes: if a configuration change was never loaded by a process, or never observed by a session check before being reverted, sessions can't be revoked retroactively on that basis.

## What it costs

- **Models**: each new item is pre-screened once; items that pass are scored twice, structured once, given a headline and summary once, and then grouped (a call is made only when there are similar reports). On top of that come event overviews, the overviews of weekly and monthly reports, and full-text translation of selected items. X posts with an empty body or only a link don't call the writing or translation model. Daily reports are compiled by rule and don't call models. In a local trial run with the demo sources, the 152 items of the first import took about 930 model calls in total. After that, daily usage depends on how many items your sources publish each day. The admin "Models and evaluation" page shows the number of calls and input and output tokens for each step.
- **Paid collection** (X, Jina): billed per request, off by default, and only used once you fill in a key.
- Every paid service has per-minute, per-hour and per-day call limits (admin "Settings → Paid request limits") and pauses once they are exceeded, so the bill can't blow up overnight. Set 0 to stop using that service immediately.

To save money, go in this order:

1. Look at the admin "Models and evaluation" page first: the calls and input and output tokens of each step are there. Find the big items before acting.
2. Make sure thinking mode is off: the thinking process is billed as output tokens, and `LLM_EXTRA_JSON` in `.env.example` shows how to turn it off.
3. Use a cheaper model for high-volume steps: each step can be chosen separately in `.env` (`PREFILTER_MODEL`, `SCORE_MODEL`, `STRUCTURE_MODEL`…) or on the "Models and evaluation" page. Before changing the scoring model, compare on the same samples with `scripts/eval-selection.ts`, so you don't save money but select badly.
4. Let less irrelevant material in: cost is roughly proportional to the number of items coming in each day. For general news sites, subscribe only to the sections relevant to your field, lower the update frequency on the "Sources" page, and pause sources with high volume but few selections.

## Without Docker

You need Node.js 24.11 or later and PostgreSQL 16 or 17, on Linux or macOS; on Windows, run it in WSL2 or use the Docker method above.

```bash
npm ci
node scripts/init-env.ts --llm-key <your model API key>
createdb myhot
```

Add to `.env`:

```bash
DATABASE_URL=postgres://<your user name>@127.0.0.1:5432/myhot
API_BASE_URL=http://127.0.0.1:3001
```

Then:

```bash
node --env-file=.env scripts/migrate.ts
node --env-file=.env scripts/seed.ts
npm run build -w @aihot/web

NODE_ENV=production node --env-file=.env apps/api/src/main.ts          # API, port 3001
NODE_ENV=production node --env-file=.env apps/worker/src/main.ts       # background jobs
cd apps/web && NODE_ENV=production node --env-file=../../.env server.ts   # website, port 3000
```

All three processes need `NODE_ENV=production`. Without it, the api and worker run as a development environment: production secrets and the admin password aren't checked at startup, and `DEV_AUTH_ROLE` login bypass takes effect.

The three processes must keep running; in production, supervise them with systemd or pm2 (and set `NODE_ENV=production` in the supervisor configuration too). Give the worker 515 seconds to stop (systemd `TimeoutStopSec=515`; pm2 `kill_timeout: 515000` and `treekill: false`), which covers the queue's 470-second drain and the database cleanup. With systemd, also set `KillMode=mixed`, so only the main process is told to stop taking jobs first and a `pg_dump` or `tar` that is backing up can finish on its own. Calls killed early have an unknown outcome and are only retried after being released automatically, after at least half an hour.

For development, use the hot-reloading commands: `npm run dev:api`, `npm run dev:worker`, `npm run dev:web`. To enter the admin without logging in during development, set `DEV_AUTH_ROLE=admin` in `.env` (production refuses to start with it).
