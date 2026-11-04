# Sources

Sources are managed on the admin "Sources" page: create them, run a trial fetch to see what comes back, change the frequency, enable or disable them, and see failure reasons and recent items. On first start, the demo sources in `industry/sources.json` are imported.

## Five kinds of sources

| Kind | Suited to | Needs |
|---|---|---|
| `rss` | Blogs, media and Substacks with RSS / Atom | Nothing |
| `web_list` | Web listing pages without RSS (news pages, blog lists, changelogs) | Selectors; optionally Jina Reader rendering (billed per request) |
| `json_list` | APIs that return JSON (GitHub Releases and so on) | Field paths |
| `x_search` | X (Twitter) accounts | A SocialData key, billed per request |
| `external` | Content your own scripts push in | `INGEST_TOKEN`; see below |

A `json_list` address or configuration may carry credentials, so it only follows same-origin redirects (same scheme, host and port). If the API moves to another origin, update the source address directly; don't rely on cross-origin redirects to pass authentication.

By default, fetching doesn't connect to private network addresses. When a feed or list address points to a service you host on your internal network (for example RSSHub in the same Docker network, at `http://rsshub:1200/...`), set `PRIVATE_FEED_HOSTS=rsshub` in `.env` (comma-separated full host names, case-insensitive) and restart the API and worker. The exemption only applies to the `feedUrl` of `rss` and the `url` of `web_list` and `json_list` themselves; these hosts are reached directly, not through `EGRESS_PROXY_URL`. Redirects to other hosts, article bodies, detail pages, images and icons still refuse private addresses as before, and link-local and cloud metadata addresses (`169.254.0.0/16`, `100.100.100.200` and so on) are always refused.

The configuration keys each kind of source accepts are listed in [`config-keys.ts`](../packages/backend/src/sources/config-keys.ts). An unknown key is rejected on save, and fetching fails outright with the reason shown in the admin, instead of silently falling back to generic parsing.

## Preview first, then create

Go to `/admin/sources/new`, fill in an ID and a name, choose the kind, then put the JSON for that kind from the [next section](#how-to-configure-each-kind-of-source) into "Collection config (JSON)". This is the configuration object itself; don't wrap it in `kind` or `config`. Switching the kind resets the configuration, so choose the kind before pasting.

A note in full-width parentheses in the name (such as "Some Outlet（Trending RSS）") is only for the admin; readers see the name without the note on the website, RSS, Agent Markdown, MCP and search. For X accounts written as `X：Display Name (@handle)`, readers only see the display name. The public API's JSON still has the full name.

`rss`, `web_list`, `json_list` and `x_search` sources can use "Preview fetch": it shows the total number of items and the headline, original link, publication time and summary of the first 20, without storing the items in the article store. Check that what was fetched are articles rather than navigation, and that the dates match the originals, then click "Create". Preview and real collection apply the same filters (URL prefixes, categories, noise words, URL rewrites, `publishedAfter`), so what you see is what real collection would take; but a preview isn't production collection, and doesn't go through the later detail completion, selection and publishing steps. `external` sources can't be previewed or trial-fetched; connect them through the [push API](#external-push-api) below.

A preview still sends fetch requests; X and Jina previews may also cost money, and go through paid receipts and budgets. `COLLECT_ENABLED=false` only turns off automatic collection in the background; it can't guarantee that a manual preview won't reach external services. The local HTML/JSON examples below need no API key.

## How to configure each kind of source

### rss

```json
{ "feedUrl": "https://example.com/feed.xml" }
```

Optional: `summaryIsBody` (when the summary in a text feed is confirmed to be the full text, RSS `description` and Atom `summary` are used as the body, and the original page isn't fetched), `allowCategories` / `denyCategories` (filter by the feed's categories).

For every source, YouTube and Vimeo player pages are never extracted as article bodies. Video descriptions in Media RSS are kept as summaries, and even with `summaryIsBody` the description isn't treated as video captions; real text the feed supplies in `content` / `content:encoded` can still be used. Video embedded in other articles doesn't affect reading the article's own body.

Native video in article bodies keeps safe media addresses and candidate formats, and plays manually with the browser's controls. Video files are loaded by the browser directly from the origin, and posters go through the image proxy; nothing autoplays or loops, and the preload hint is `none`, though browsers don't guarantee no requests before interaction. Players without a media address and a usable poster keep only their fallback text. Markdown and full-text RSS that allows redistribution keep the video structure, and whether it plays depends on the reader app; dynamic platform players and iframes are out of scope.

Inline SVG figures in article illustrations don't keep the graphic itself (its colors and fonts depend on the original site's stylesheets). They are replaced by the accessible text description the original site wrote for the figure (the text referenced by `aria-label` or `aria-labelledby`, or the figure's `<title>` and `<desc>`), placed as plain text where the figure was; when the same figure has wide and narrow versions, only one is kept, and text already shown in the illustration (captions, subheadings) isn't repeated. Figures without a text description, and SVG icons outside illustrations, are removed as before.

For podcast episodes without a web page (no `<link>`, and a `guid` that isn't a URL), the original link is the episode's audio or video file, which the browser can play directly; such episodes don't fetch a web page and are processed from the text in the feed.

### web_list

Ordinary CSS selectors are supported, and `div` lists can be collected too. The key is that `itemSelector` must match **each news item**, not the container wrapping all of them. For example:

```html
<div class="news-list">
  <div class="news-item">
    <h2><a href="/posts/first">First example story</a></h2>
    <time datetime="2026-10-01T09:00:00+08:00">Oct 1</time>
  </div>
  <div class="news-item">
    <h2><a href="/posts/second">Second example story</a></h2>
    <time datetime="2026-10-01T10:00:00+08:00">Oct 1</time>
  </div>
</div>
```

The matching configuration (`example.com` is a placeholder; replace it with the target page; for a runnable version see the [local example](#running-the-htmljson-examples-locally)):

```json
{
  "url": "https://example.com/news",
  "parseMode": "html",
  "itemSelector": ".news-list > .news-item",
  "linkSelector": "h2 a",
  "titleSelector": "h2 a",
  "publishedAtSelector": "time",
  "allowUrlPrefixes": ["https://example.com/posts/"]
}
```

- `itemSelector` finds items across the whole page; `linkSelector` and `titleSelector` take the first matching node within each item, and may also match the item itself. Selecting `.news-list` only gets one container and usually only the first story; selecting just `div` pulls in nested containers. Select the news node that repeats.
- Links come from `href`; relative links such as `/posts/first` are resolved against the list's final address after redirects, or against `baseUrl` if given. The headline is the node's text. Duplicate links are merged; when a Markdown list has a button such as "Read more" before the real headline, the real headline is used. Links pointing back to the list itself are usually skipped.
- The date is found within the item via `publishedAtSelector`, trying the `datetime`, `content` and `title` attributes and then the text; hint text that can't be parsed doesn't hide a valid date on the same node. Date-times without a timezone are read in the source's `publishedAtUtcOffset`; times with their own timezone keep it, and a bare `YYYY-MM-DD` is read as midnight UTC. Incomplete months, product version numbers and dates that don't exist on the calendar are not taken as publication dates.
- `parseMode`: `html` by default for ordinary pages; `markdown` reads Markdown links; `docusaurus_changelog` reads changelog headings; `intercom_changelog` reads headlines and bodies from the date sections of an Intercom help center, each section keeping its own URL anchor, read as UTC calendar days by default, or with `publishedAtUtcOffset` if set. To use Jina, write `url` explicitly as `https://r.jina.ai/https://target-site/path` and configure `JINA_API_KEY`; it doesn't switch automatically when a fetch fails. Jina returns Markdown by default; to keep using CSS selectors, set `parseMode: "html"` explicitly.
- `detail`: fetches the detail page to fill in a missing date, headline or summary from the list (`publishedAtSelector`, `titleSelector`, `summarySelector` and so on). `maxFetches` is the maximum number of detail pages read per round; unset it is 0, meaning none are read: each detail page is one more request, so the source has to opt in. Items whose detail read failed or that ran past this round's `maxFetches` are completed by later fetches; filling in metadata keeps the confirmed body. An existing real headline isn't replaced with button text because the list still says "Read the Blog", and a long headline alone doesn't trigger another detail read. To force the detail page's headline, set `titleAuthoritative: true`. When detail pages and body extraction read a time without a timezone, `detail.publishedAtUtcOffset` is used first, and otherwise the source's `publishedAtUtcOffset`. RSS and JSON lists can use `detail` too.
- For Jina lists, `detail.titleRegex` and `publishedAtRegex` match Jina's text and can share the same detail response; CSS selectors read the original site's HTML. Choose rules according to the page that can actually be read.
- `allowUrlPrefixes` / `denyUrlPrefixes`: only collect articles under certain paths.

### json_list

Suppose the API returns the structure below. `itemsPath` points to the array, and the other field paths are relative to **each array element**. Paths are dot-separated, not JSONPath; don't write `$` or `[*]`.

```json
{
  "data": {
    "items": [
      {
        "id": "first",
        "title": "First example story",
        "url": "https://example.com/posts/first",
        "summary": "Summary of the first story.",
        "published_at": "2026-10-01T09:00:00+08:00"
      }
    ]
  }
}
```

The matching configuration:

```json
{
  "url": "https://example.com/api/news",
  "mode": "json_api",
  "itemsPath": "data.items",
  "titlePaths": ["title"],
  "urlTemplate": "{raw:url}",
  "summaryPaths": ["summary"],
  "publishedAtPath": "published_at",
  "externalIdPath": "id"
}
```

- When the API returns an array itself, omit `itemsPath`. `titlePaths`, `summaryPaths` and `authorPaths` are arrays of candidate paths; the first non-empty value in order is used, for example `["title", "name"]`.
- When there is already a full URL, use `{raw:url}`; with only a slug, use something like `https://example.com/posts/{slug}`. `{field path}` encodes the field value and `{raw:field path}` inserts it as is. JSON lists don't turn relative URLs into absolute ones, so the template must produce a full HTTP(S) address.
- `summaryIsBody`: set to `true` when the summary in the API is confirmed to be the full text; the text from `summaryPaths` is used as the body, and the original page isn't fetched.
- Dates are best returned as ISO strings with a timezone. Times without a timezone such as `2026-09-30 17:43:58` are read in `publishedAtUtcOffset`, as for web lists. For numeric timestamps set `publishedAtUnit: "epoch_s"` (seconds) or `"epoch_ms"` (milliseconds), and for dates like `20261001` set `"yyyymmdd"`.
- Items without a headline or whose link can't be built are skipped. When every element of a non-empty array fails to map, the error is `no items mapped (check title/url paths)`; when the path isn't an array, it is `items path did not resolve to an array`.

### Running the HTML/JSON examples locally

The repository provides two fictional examples, [news.html](examples/sources/news.html) and [news.json](examples/sources/news.json), each with two stories. They are for checking selectors and field mappings, not real sources; the example article links serve no body.

Run the following command from the repository root with Node.js 24.11 or later. The server listens only on localhost and serves only these two files; stop it with `Ctrl+C`.

```bash
node --input-type=module -e '
import http from "node:http";
import { readFileSync } from "node:fs";
const files = {
  "/news.html": ["text/html; charset=utf-8", readFileSync("docs/examples/sources/news.html")],
  "/news.json": ["application/json", readFileSync("docs/examples/sources/news.json")]
};
http.createServer((req, res) => {
  const file = files[req.url];
  res.writeHead(file ? 200 : 404, { "content-type": file ? file[0] : "text/plain" });
  res.end(file ? file[1] : "Not found");
}).listen(8787, "127.0.0.1");'
```

On the same machine, set up the database as in the [non-Docker deployment](deploy.md#without-docker), and run the development API and website with `npm run dev:api` and `npm run dev:web`, keeping the collection, model, Feishu and IndexNow switches off and without starting the worker. For this local example only, set `ALLOW_PRIVATE_NETWORK_FETCH=true` for the development API process and restart it; fetching private addresses is forbidden by default, production refuses to enable this, and you should remove it after checking. If the API runs in a container or on another server, `127.0.0.1` points to that machine itself, and the addresses in this command won't work for that deployment as they are.

Choose `web_list` and then `json_list`, paste each configuration and click "Preview fetch"; there's no need to create the source:

```json
{
  "url": "http://127.0.0.1:8787/news.html",
  "parseMode": "html",
  "itemSelector": ".news-list > .news-item",
  "linkSelector": "h2 a",
  "titleSelector": "h2 a",
  "publishedAtSelector": "time",
  "allowUrlPrefixes": ["http://127.0.0.1:8787/posts/"]
}
```

```json
{
  "url": "http://127.0.0.1:8787/news.json",
  "mode": "json_api",
  "itemsPath": "data.items",
  "titlePaths": ["title"],
  "urlTemplate": "http://127.0.0.1:8787/posts/{id}",
  "summaryPaths": ["summary"],
  "publishedAtPath": "published_at",
  "externalIdPath": "id"
}
```

Both should show **2 items**, as in the table below. The JSON example also shows the summaries; the HTML example doesn't configure summary extraction. The preview API's dates are in UTC; the admin interface shows them in UTC+8 as 09:00 and 10:00.

| Headline | Original link | publishedAt in the preview API |
|---|---|---|
| First example story | `http://127.0.0.1:8787/posts/first` | `2026-10-01T01:00:00.000Z` |
| Second example story | `http://127.0.0.1:8787/posts/second` | `2026-10-01T02:00:00.000Z` |

For comparison, temporarily change the HTML `itemSelector` to `.news-list`: only the first story comes back. Change it back to `.news-list > .news-item` and both return. That is the difference between "the list container" and "each news item".

When fetching a real page, first check whether the raw HTTP response contains the news nodes. Plain HTML mode doesn't run JavaScript; content you see in the browser but not in the response can't be produced by switching CSS selectors. Prefer RSS or a JSON API, or configure Jina or your own external collector as needed. `no items matched (html)` can also mean the selector doesn't match, there's no `href` or headline, or the links were filtered out by prefix rules; check the response and configuration first before switching collectors.

### x_search

This kind of source uses SocialData search; it is not about putting an X profile URL into a web list. For `https://x.com/SomeAccount`, take the user name `SomeAccount`, without `@` or the whole URL:

```json
{ "query": "from:SomeAccount -filter:replies", "searchType": "Latest" }
```

`SomeAccount` is a placeholder user name; replace it with the real account you want to follow. `-filter:replies` excludes replies; `Latest` searches the newest content.

Configure `SOCIALDATA_API_KEY` in the backend's `.env`, and restart the API (previews) and worker (scheduled collection) for it to take effect; don't put the key in the source JSON or commit it to the repository. Check the SocialData limits in admin "Settings → Paid request limits" first, then preview as needed. Without the key, the error is `SOCIALDATA_API_KEY is not configured`; when the service refuses requests or the budget breaker trips, see the error reason in the admin. A preview may make paid requests; this document doesn't require verifying against the real service, and the results depend on the account and what the service returns at the time.

In automatic production collection, ordinary accounts are merged into one search (up to twenty-odd accounts per search) to save requests; a manual preview of a single source isn't a merged collection.

## Tiers, participation and full text

- **Tier** `tier`: `T1` official first-hand (official sites, official blogs, institutions), `T1_5` official accounts and semi-official creators, `T2` media and individuals, `EXCLUDE_MP` not part of the selection. Selection thresholds differ by tier (`industry/selection.ts`).
- **Source category** (optional): official sources whose day-to-day content is mostly written for developers or insiders can be given a category on the admin "Sources" page (`classes` in `industry/selection.ts`), which raises the selection threshold to at least the category's value; see [Selection and calibration](selection.md#thresholds-industryselectionts). `industry/sources.json` doesn't carry this; set it in the admin after import.
- **Participation** `participation_mode`: `editorial` enters the selection and all items; `hot_signal` isn't shown on its own and only serves as heat evidence of "what people are discussing"; `isolated` doesn't appear on any public page.
- **First-hand**: only `T1` counts as first-hand; there's no separate setting. When the same news has several reports, first-hand ones are preferred as the representative report, and event pages show first-hand reports first.
- **Publisher** (optional, in `config`):
  - `publisherUrlPrefixes`: the URL prefixes of a `T1` source's own articles, for example `["https://example.com/blog/"]`. Articles at these URLs brought in by other sources (aggregators, reposts) are credited to it, as long as they can be attributed to exactly one official source. For web list sources without this setting, the path of the source's own list is used (and the article must also have appeared in its list).
  - `publisherRole`: the identity of a `T1_5` account, `organization` (an organization's official account) or `person` (an official's account). Also fill in the source's `owner_entity_id` (an `ENTITIES` id from `industry/taxonomy.ts`); then news this account posts whose subject is that very company can be the representative report (ranked after `T1`).
- **Full text**: `site_fulltext` decides whether the site may show the full text, and `syndicate_fulltext` whether the full-text RSS may include the body. Both are **off by default**, showing only the summary and a link to the original; turn them on only when the source explicitly allows it. Paywalled content doesn't get full-text display just because it can technically be fetched.

## Fetch frequency

Each source has its own fetch interval. Every day at 04:20 it is adjusted automatically from the last 7 days of output: sources that publish more are fetched more often, down to 15 minutes (60 minutes for web lists read through Jina); at most 60 minutes for ordinary sources, 120 minutes for X accounts and web lists read through Jina, and 180 minutes for sources that only serve as heat evidence. X accounts in a merged search follow the merged schedule: every half hour for those entering the selection, every hour for those that only serve as heat evidence.

A failed fetch doesn't advance the position, and the next fetch continues from the same place. Sources that keep failing are marked red in the admin, and every Monday a weekly source report is sent to the operations group (when Feishu alerts are configured).

"No new content for 7 days" is judged by **each source's own rhythm**, not a fixed window, and daily and weekly reports split it into two groups. Sources **past their own update rhythm** come first, to be checked against the original site. The rhythm: take the **output days** of the last 90 days, deduplicated to the day, and use the median gap between consecutive days; at least 4 such days are needed to have a rhythm, and the silence must exceed 4 times the median gap to count as overdue. An output day is the item's publication time, or the day we discovered it if the page gives no time; **one first import counts as one day**. It is a single delivery, however far back its publication times reach, and doesn't count as several outputs (otherwise a source that never produced anything would look punctual, and a first import spanning months would stretch the median gap and hide a source that has already gone quiet). The window only counts output days within those 90 days, since older history says nothing about how often it publishes now; discovery time and publication time have no fixed order, so an item is read if either falls in the window, and its output day is then clamped to the window. **Sources whose rhythm can't be judged are still listed**, but not as failures, in two kinds: no comparable output in the window (it has produced, just all outside the window), and never received any content (that is a collection problem). Sources within their own rhythm are not listed. The fetch interval `interval_minutes` plays no part in this judgment: it says how often we look, not how often the source publishes.

## Rule: old articles don't flood the site

Material that was already more than 48 hours old when first discovered, the backlog items from a new source's first import, and pushes marked as backfill are all archived by their original time: they don't enter "Today" and aren't pushed. Material without a trustworthy publication time stays private at first (it doesn't enter public lists, the selection, reports, trending or pushes) until a date is read from the original source or the article page, and is then judged as new or old. This rule is shared by every entry point, so a one-off import of historical content can't flood the site.

On a new source's first import, only the first `_aihot.initialBackfillLimit` items of the list (default 30) within `_aihot.initialBackfillMonths` months (default 12) are taken. Later fetches only collect items published no earlier than 48 hours before the source's first import; older backlog in the list no longer comes in, so you don't pay for the whole feed archive. Items published after the first import are collected however far down a long list they are. Items without a publication time in the list are still collected and, per the rule above, wait until a date is read. X accounts read forward from the fetch position and aren't subject to this limit.

To start monitoring only after a fixed time, set `publishedAfter` in an RSS, web list or JSON configuration, for example `"2026-10-01T00:00:00.000Z"`. It must be a complete UTC time (milliseconds may be omitted). Preview, the first import and later collection all only accept items published **strictly after** it with a trustworthy publication date; unknown dates are excluded too. If a single-page changelog section on the start day keeps using the same publication date, content appended to it later won't be collected either; keep this limit in mind when choosing the start.

## External push API

Content your own scripts collect can be pushed into the site, going through the same dedup, selection and grouping as ordinary collection.

```
POST /api/ingest/items
Authorization: Bearer <INGEST_TOKEN>
Content-Type: application/json

{
  "sourceId": "my-crawler",
  "sourceName": "My crawler script",
  "items": [
    { "title": "required", "url": "required", "publishedAt": "2026-10-01T08:00:00+08:00", "author": "optional" }
  ]
}
```

- Set `INGEST_TOKEN` in `.env`, at least 16 characters; without it, the API always returns 401.
- At most 50 items per request; more returns 413. How many pushes each client may send per minute is set by `INGEST_RATE_LIMIT`: `docker compose` defaults to 10, and going over returns 429 (with `Retry-After: 60`). Without Docker there is no limit by default; if no reverse proxy in front limits it, set it in `.env`. 0 means no limit.
- The response is `{"ok": true, "created": <number of items created>}`. Items that aren't JSON objects, or that lack a headline or URL, are skipped; duplicate URLs within one request keep only the first.
- If `sourceId` doesn't exist, an `external` source is created automatically, kept off public pages by default: change its participation to `editorial` in the admin for it to appear on the site.
- After the source is paused in the admin, the push API returns 409 and accepts no new articles; pushing works again once the source is resumed.
- Items with `raw._aihot.backfill` set to `true` are treated as historical backfill (they don't enter "Today" and aren't pushed).
