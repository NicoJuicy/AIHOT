# Make it your field

By default this repository is an example site for the AI industry: the demo sources are a set of public AI news sources, and the selection taste is the one AIHOT spent a long time tuning for AI. To turn it into a news site for law, HR or gold, nearly everything to change is in two folders, [`site/`](../site/) (this site's own name, copy, brand and pages) and [`industry/`](../industry/) (the industry's categories, sources, prompts and thresholds); the code itself mostly stays as it is.

If you use an agent such as Claude Code or Codex, you can send it the text below and then answer its questions:

```text
Please read AGENTS.md and docs/customize.md, and turn this site into a news site for the "XX" field.
What I care about: … (the sources you want to watch, what news you think matters and what doesn't; the more specific the better).
When you're done, run npm run typecheck, npm test and node scripts/smoke.ts, and tell me which decisions are still mine to make.
```

Below is what it (or you) needs to do, in order.

## 1. Site name and copy: `site/site.ts`

Every export and field in [`site/site.ts`](../site/site.ts) has a comment next to it (where it is used, whether it can be empty, what the default means); work down the file following the comments. After changing it, rebuild (`docker compose up -d --build`) and both frontend and backend pick it up. Only these points involve other files or need care once live:

- **The site address is not in `site.ts`**: set it with the `SITE_URL` environment variable when deploying (`SITE.defaultUrl` is only the local fallback when `SITE_URL` isn't set).
- **Names to change together**: when you change `SITE.name`, also change `SITE.organization.name` (structured data for search engines); set `SITE.crawlerName` to your own crawler identity, and don't borrow someone else's site name. Outbound fetches introduce themselves as `Mozilla/5.0 (compatible; <crawlerName>; +<SITE_URL>/about)`; `CRAWLER_USER_AGENT` in `.env` replaces that whole string, for example on a local trial where some sites refuse a `localhost` contact address.
- **Identifiers not to change once live or once someone integrates**: `SITE.mcpPrefix` (the MCP tool name prefix), `PUBLIC_CATEGORIES` (category merges and renames for the public interfaces and feeds), `ABOUT.termsAnchor` (an anchor others may have hard-coded); `SITE.interfaceVersion` only goes up, and gets a major version bump when existing public fields or their meaning change.
- **Publishing times on the hour or half hour**: `EDITION_TIMES` (`HH:mm`, Beijing time) is checked by a schedule that runs every half hour; the daily report window, missing-edition alerts and all copy that mentions times read it.
- **What navigation hiding covers**: `NAV.hidden` currently only supports `"/hot"` and `"/topics"` (it covers the sidebar, bottom bar, "Me" page, back links and breadcrumbs, and, when hiding `"/hot"`, the trending strip on the home page and the rank on event pages; opening the address directly still works).
- **Rate limit notes match reality**: only fill in `ACCESS.ratePerMinute` if the reverse proxy in front really limits by IP.

## 2. Categories, tags and topics: `industry/taxonomy.ts`, `industry/topics.json`

[`industry/taxonomy.ts`](../industry/taxonomy.ts) defines the categories (`CATEGORIES`), the masthead's count of major releases (`RELEASE`), generic words the overview check skips (`PLAIN_TERMS`), content types (`ITEM_TYPES`), tag vocabularies and synonyms (`CATEGORY_TAGS`, `TOPIC_TAGS`, `ENTITY_TAGS`, `TAG_SYNONYMS`), and the company directory and misattribution dictionaries (`ENTITIES`, `IDENTITY_LEXICON`, `PUBLISHER_DOMAINS`, `IDENTITY_CONTEXT_ALIASES`). See the comments in the file for what each field means; when changing it, watch these connections:

- **The `key` in URLs never changes once live**: the `key` of `CATEGORIES` goes into URLs and feed addresses (`/all?category=`, `/feed/category/<key>.xml`). To publish one category merged into another in the public interfaces, RSS and MCP (while keeping them separate on the website), configure `PUBLIC_CATEGORIES` in `site/site.ts`.
- **Keep the prompts in sync**: if you change `CATEGORIES`, the tag vocabularies or `ITEM_TYPES`, also change `industry/prompts/structure.md` (classification principles and tag rules), `content-understanding.md` (the content type enum) and `selection-score.md` (the five-dimension weight table for each content type).
- **Clear them if you don't need misattribution checks**: `IDENTITY_LEXICON`, `PUBLISHER_DOMAINS` and `IDENTITY_CONTEXT_ALIASES` make sure companies mentioned in headlines and summaries actually appear in the original; if your field doesn't need this check, set them to empty arrays `[]`.
- **`industry/topics.json`** (the topic directory `/topics`): read at site startup; rebuild (`docker compose up -d --build`) after changing it. Topics are in three groups, `company` (companies and organizations), `field` (directions) and `genre` (content formats); never change a `slug` once live:
  - A `company` topic uses `entityId` (an id from `ENTITIES`) to collect reports whose subject is that company; when a report has several subject companies, it only counts if the headline names this one. Optional `aliases`: searching for just this word also finds the company's reports.
  - `field` and `genre` topics use `tags` to collect reports with those tags.

## 3. Sources: `industry/sources.json`

These are the demo sources imported on first start; existing ones are never overwritten. On each later start, only sources that are in the file but not yet in the database are added; sources removed from the file are not removed from the database (pause the ones you don't want in the admin). Once live, the admin "Sources" page is used more: create sources, trial fetch, adjust frequency, pause, and see why fetches failed.

Key fields of each source:

| Field | Meaning |
|---|---|
| `kind` | `rss`, `web_list` (web listing page, with selectors), `json_list` (JSON API), `x_search` (X account, needs SocialData), `external` (external push) |
| `config` | Configuration for each kind of source; see [Sources](sources.md) |
| `tier` | Source tier: `T1` official first-hand, `T1_5` official accounts and semi-official, `T2` media and individuals, `EXCLUDE_MP` not part of the selection. Each tier has its own selection threshold. `T1` means "first-hand"; no separate flag is needed |
| `owner_entity_id` | Optional: which company this source belongs to (an id from `ENTITIES`). Several sources of the same company count as one participant for heat; for a `T1_5` official account to act as the representative report, fill it in too (see [Sources](sources.md)) |
| `participation_mode` | `editorial` enters the selection and all items; `hot_signal` is only evidence for heat; `isolated` doesn't appear on any public page |
| `site_fulltext` | Whether the site may show the full text. **Off by default**: only the summary and a link to the original are shown. Turn it on only when the source explicitly allows it |
| `syndicate_fulltext` | Whether the full-text RSS may include the body. **Off by default**; only effective when the site also shows the full text; turn it on only when the source explicitly allows republishing |

## 4. Selection standard: `industry/prompts/`

This is the step most worth your time: your experience of judging this field goes here.

| File | Purpose |
|---|---|
| `prefilter.md` | Pre-screen: is this item about this field? Broad recall; only blocks the clearly irrelevant |
| `selection-score.md` | **Scoring rubric**: a score from 0 to 100. It contains content types, five dimensions, the weights for each type, value that must be assessed fairly, and noise that must be suppressed |
| `content-understanding.md` | How to write selected and nearly selected content: English headline, answer-first summary, reason to read (it also gives tags, but the categories and tags on the pages come from `structure.md`) |
| `rules-domain.md` | Rules for translating or keeping industry terms (the example covers AI terms) |
| `mend-wording.md` | Wording fixes: when a headline, summary or reason to read uses words listed in `industry/wording.ts`, the model changes only those words |
| `summarize-*.md` | How to write headlines and summaries for other content |
| `structure.md` | Category, tags, subject company; whether it is one specific piece of news or a roundup covering several; extracts the facts of the news (who did what to what, with the source passage and preconditions). Categories and tags on the pages, topic pages, event grouping and the daily report all depend on it |
| `group-*.md` | Event grouping: whether two reports are the same occurrence, a follow-up of the same event, or two different things; also whether the report brings new information compared with what's already selected. Those that don't are not selected |
| `story-digest.md` | The overview on event pages (compare versions side by side with [Overview evaluation](story-digest-evaluation.md) before changing it) |
| `report-period.md`, `report-period-sections.md` | The overview and section introductions of weekly and monthly reports (daily reports are compiled by rule and use no prompt) |
| `translate-*.md` | Full-text translation |

If your site has words it doesn't use in reader-facing text (exaggerations, slang, jargon readers won't understand), put them in `industry/wording.ts`: each entry is a regular expression and a fix. After writing headlines, summaries and reasons to read, each is checked, and if it uses any of these words, the model is asked once to change only those words (the model step "Mend wording"; the `WORDING_MODEL` environment variable picks a separate model). If the numbers change, the headline or summary becomes empty, or the model service refuses the rewrite, the original text is kept. With an empty list nothing is checked and no extra calls are made, and alerts for the model service refusing calls don't list this step.

In prompts, `{{siteName}}` stands for the site name, and `{{> file name}}` includes another prompt. Changing prompts doesn't require changing code.

**Suggested approach**: keep the structure first (five weighted dimensions, noise suppression rules, safety boundaries) and only replace the examples of "what counts as important" and "what counts as noise" with your field's. For law, for example, "a new regulation is officially published, an important ruling, a regulatory penalty" should be assessed fairly, while "law firm marketing pieces, course ads" should be suppressed.

## 5. Thresholds and calibration: `industry/selection.ts`

An item scores high enough when the sum of its two scores is ≥ 2 × the threshold (and it still has to pass dedup during grouping; see [Selection and calibration](selection.md)). The default thresholds (T1 60, T1_5 65, T2 76) are what AIHOT calibrated for AI. `classes` are source categories that raise the threshold (the example uses the AI industry's "Ecosystem and infrastructure" and "Leaderboards"; replace them with your own categories or empty it when switching fields), and `browseFloor` is the minimum score for browsing "All AI news" (default 40). With a new field and new prompts, you need to recalibrate:

1. Pick 100–200 items from your sources, label each "select / don't select" yourself, and save them as `.data/gold.jsonl` (format in [Selection and calibration](selection.md); `industry/gold.example.jsonl` has two examples).
2. Run `node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl` and look at accuracy, precision, recall, and the results at different thresholds.
3. Go through the misjudged items one by one in the admin SelectBench, adjust the scoring prompt or the thresholds, and run again.

This step decides whether your site selects well.

## 6. Brand: `site/brand/`

- `logo.svg`, `icon.png` (512), `icon-192.png`, `apple-icon.png` (180), `favicon.ico`: site icons.
- `Logo.tsx`: the site name mark at the top left of the website, set from the site name text by default; if you have your own logo, replace `Wordmark` with your SVG and keep the props unchanged.
- `wordmark.svg`, `wordmark-dark.svg` (optional): the wordmark on share images and posters; the dark version is used on dark share images. Without them, the site name text is used.
- Share image fonts (optional, in `assets/og-fonts/`): share images use a Noto Sans SC subset (GB2312 plus basic Latin), so Traditional Chinese, Japanese kanji, kana, Korean and accented Latin letters can't be drawn. If your sources contain such text, add `<name>-400.ttf` and `<name>-700.ttf`; missing characters are taken from these fonts in turn (sorted by file name). Restart the services after changing fonts; the share image cache is renewed with them. Without them, nothing changes.
- `nameplates/`: the masthead lettering at the top of the daily, weekly and monthly report pages (for example "AI Daily"). Regenerate them after changing the field terms:
  ```bash
  npm pack @fontsource/noto-sans-sc@5.3.0 && tar xzf fontsource-noto-sans-sc-5.3.0.tgz
  node scripts/nameplates.ts package
  ```
- QR codes on the about page: first write the author block in `ABOUT.maker` in `site.ts`, with a `feishu` card (title and description); then upload the images in admin "Settings → About page QR codes", or put them in `site/brand/contact/` with a file name starting with `qr-feishu`, in png, jpg or webp. If the author block, the card or the image is missing, that QR code isn't shown.

Please don't use AIHOT's name or logo.

On the "Me" page, readers can change the font from "Default font" to "Browser default font". The latter uses the standard font the reader set in the browser, covering regular body text, forms and dynamic chart text; code still uses a monospace font, and the logo, masthead lettering and share images still follow the site brand. The font choice is saved only in the current browser. Version 1 backups from the saved items page gain an optional `font` field; older backups can still be imported, and importing doesn't override a browser font the reader already chose.

## 7. Page copy: `site/pages/`, `site/public/`, `site/changelog.json`

- `pages/terms.md`, `pages/privacy.md`: terms of use and privacy notice. **These are templates**; rewrite them for your actual situation before going live, and have a professional look at them if needed.
- `public/`: the four fixed files at the site root, published after placeholders are replaced: `robots.txt`, `manifest.webmanifest` (the name and icon when installed to a phone's home screen), `openapi-v1.json` (the public API description), and the optional `.well-known/security.txt` (contact for security issues). Only these four files are published; other files you put there don't appear on the site, and a missing file returns 404. The files can use these placeholders: `{{siteName}}`, `{{siteUrl}}`, `{{description}}`, `{{tagline}}`, `{{locale}}`; publishing times `{{dailyTime}}`, `{{weeklyTime}}`, `{{monthlyTime}}`; the public interface version `{{version}}`; and the comma-separated public categories `{{categoryList}}`. In JSON files, `"{{categories}}"` in an `enum` or `examples` list is replaced with the list of public category keys.
- `changelog.json`: the changelog. It comes with one example "site launched" entry; before going live, change its `date`, `time` and `latestVersion` to your launch time. The framework credit in the example text can be kept or removed. New entries go first; set `latestVersion` to their date and time. `kind` is one of the update, improvement, announcement or retirement kinds defined in the file; add `"urgent": true` for entries readers must see (shown in red and marked important).

## 8. Models and deployment

- Models: `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` in `.env`; any OpenAI-compatible API works, and every step uses it by default. `site/models.ts` lists named models (each with its own address and key environment variables) and which one each step uses by default; at deployment you can also choose per step with environment variables (see `.env.example`) or on the admin "Models and evaluation" page. With a reasoning model (one that thinks before answering), leave it room to reason: set `LLM_REASONING_TOKENS` for the default model, and `reasoningTokens` in `site/models.ts` for named models; otherwise the reasoning uses up each step's output budget, the answer is empty, and every call fails. Scoring presets can also set `scoreCall: { temperature, maxTokens, timeoutMs }` for temperature, output budget and timeout in milliseconds; the example scoring preset sets these explicitly. A fallback model's `fallbackFor` names, by capability, the primary model it stands in for; evaluate that combination on your own material first. The example site has no fallback combination by default.
- Deployment: see [Deployment](deploy.md).

## Checking after changes

```bash
npm run typecheck
DATABASE_URL=postgres://…/myhot_test npm test     # the name must end in _test or _ci, and the account must be able to create databases
npm run build -w @aihot/web && npm run test:web
node scripts/smoke.ts --base http://localhost:3000   # once the site is running
```

Rewriting prompts and recalibrating thresholds doesn't make tests fail: tests recognize requests by the prompt each step actually renders, and read thresholds from `industry/selection.ts`. Some tests in `tests/` use the example industry's categories, tags and companies (for example `ai-models`, "Model release", Anthropic). After changing `industry/taxonomy.ts` these tests fail; replace the examples with your field's equivalents, and leave the rules they test unchanged.

Then open the site and look at the home page, all items, the daily report, topic pages and the about page, and check on the admin "Sources" page that every source fetched successfully.
