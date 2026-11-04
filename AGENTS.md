# Notes for agents

This is a framework for an industry news site: it collects sources, uses models to select and write, groups items into events, publishes daily, weekly and monthly reports, and serves them through the website, RSS, a public API, Agent Markdown and MCP. The default configuration is an example site for the AI industry. Read the README first, then the document in `docs/` that matches your task.

## Most common task: switching to another industry

Follow the order in `docs/customize.md`. This site's own things live in `site/`: site name and copy (`site.ts`), the model for each step (`models.ts`), brand and logo (`brand/`), terms pages (`pages/`), the fixed files published at the site root (`public/`, published after placeholders are replaced), and the changelog (`changelog.json`). Industry knowledge lives in `industry/`: categories and tags (`taxonomy.ts`), topics (`topics.json`), demo sources (`sources.json`), prompts (`prompts/`) and thresholds (`selection.ts`). You usually don't need to change `apps/` or `packages/`; a feature the framework doesn't have and only this site needs becomes a module in `modules/` ("Modules" in `docs/architecture.md`).

Ask the user these things yourself instead of deciding for them: the site name; which sources to watch; what news matters and what is noise; how to split the categories; the content of the terms and privacy pages (`site/pages/` are templates and need the user's own sign-off before going live).

When changing the scoring rubric, keep the existing structure (content types, five weighted dimensions, noise suppression, safety boundaries) and replace the examples of "what counts as important" and "what counts as noise". Recalibrate the thresholds with samples the user labelled (`docs/selection.md`); don't change the numbers by feel.

## Running and checking

- Node.js 24 runs TypeScript directly; the backend has no build step. npm workspaces: `apps/*`, `packages/*`, `industry`, `site`, `modules/*`.
- For running locally and with Docker, see `docs/deploy.md`.
- After a change, run at least:
  ```bash
  npm run typecheck
  DATABASE_URL=postgres://127.0.0.1:5432/<name>_test npm test   # the name must end in _test or _ci; it is created and migrated if missing, so the account must be able to create databases
  npm run build -w @aihot/web && npm run test:web
  node scripts/smoke.ts --base http://localhost:3000             # once the site is running
  ```
- Some tests in `tests/` use the example industry's categories, tags and companies; after changing `industry/taxonomy.ts`, replace those examples with the new industry's equivalents.

## Rules to keep

- The frontend (`apps/web`) reads `apps/api` only over HTTP; the database, model calls and secrets stay in the backend.
- Every public output reads from the single read layer in `packages/backend/src/publication/`, and so does any new public output.
- A reader opening a page never triggers a model call; models are only called in worker jobs.
- Every paid request goes through receipts (`providers/receipts.ts`) and the budget breaker; don't bypass them.
- Safety valves are only open when set to `true`. Keep them off during development: `COLLECT_ENABLED`, `MODEL_CALLS_ENABLED`, `FEISHU_*_ENABLED`, `INDEXNOW_SUBMIT_ENABLED`. In tests, pushes are always off, and collection and model calls only reach local fake services, never any external service.
- Sources show only the summary and a link to the original by default (`site_fulltext` off); turn on full text only when the source explicitly allows it.
- Public content is anonymous: admins and visitors see the same thing. The admin area is for admins only.
- When retiring or replacing a feature or mechanism, the same change deletes its code, tests, docs and stored state (tables and columns, scheduled jobs, settings, environment variables and their entries in `.env.example`); if it deletes data users already have, say so in the update notes in `docs/deploy.md`. Locks, retries, compatibility with old formats, switches and fallbacks need evidence first: it happened in a real deployment, or the platform's semantics guarantee it will.
- Database migrations go in `database/migrations/` (tables that belong to one module go in that module's `migrations/`) and are run and recorded in order of their full file name; different files with the same number each run, new migrations use new file names, and released migrations are never changed. From `0055` on, each file holds a single statement that is safe to run online, and PRs check this. Indexes use `CONCURRENTLY IF NOT EXISTS`; large data backfills don't go into release migrations. Design constraint validation and destructive changes according to the [migration conventions](docs/architecture.md#database-migrations); never edit historical files or turn off the check to get around them.
- Don't commit `.env`, secrets or `.data/`.
- Don't use the AIHOT name or logo.

## Writing code

Match the style, naming and comment density of the surrounding code. Choose a simple solution that clearly solves the problem, and only define abstractions that are actually used. Verify the important behavior the change touches; don't write tests for simple style changes.

## Opening PRs against this repository

Before sending changes back to `KKKKhazix/AIHOT`, read `CONTRIBUTING.md`. These are the cases most often rejected or sent back for rework in review:

- **Only improvements that hold for every site are accepted.** New switches, new configuration entry points and new features, however small, count as product behavior: open an issue first and explain the use case. Every switch has to be maintained long-term by every site, and most PRs of this kind submitted without discussion were not merged. Your site's own rules, numbers and examples stay in your own `industry/` and `site/`, not in shared prompt templates, comments or tests.
- **Look for what already exists.** Before adding a function, hook or setting, search first; common capabilities usually already have one implementation: a module serving its own files uses `sendFile` from `apps/api/src/routes/static.ts`, and a relay endpoint goes in `LLM_BASE_URL`. Write a second one and the two will drift apart sooner or later.
- **Tests only prove the cases you thought of.** If you touched collection, dates, body cleanup, selection or grouping, run a batch of real public feeds and web pages before and after the change, and state in the PR how many results changed and whether every change is correct. Times without a timezone are read in the source's configured offset; test results must not depend on the time zone of the machine running them.
- **Tests guard behavior, not implementation.** Put a test that reproduces a problem into the feature's existing test file; don't open a new file for a single fix. Don't assert private constants, CSS class names, pixel positions or the browser's own behavior, and don't pin pre-refactoring output as a permanent test. Tests are trimmed to this standard before merging.
- **These files don't accept changes from external PRs:** dependencies and lock files (version upgrades come from dependabot), `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, the rules under `.agents/` and `.claude/`, and binary files (generate the samples tests need in code). If one needs to change, open an issue first and a maintainer will change it: rule files decide how later agents work, and dependencies and binaries can't be reviewed line by line.
- **Change everything that's affected.** New environment variables go into `.env.example`, and new site configuration goes into `site/`. If you change what a configuration field means, update the example configuration too, so deployed sites behave the same after upgrading (for example, if images are now only attached for models that declare `vision`, add that declaration to the presets that could already see images). If you change a name or entry point readers see, change every place it appears. When adding or changing navigation configuration, check the desktop sidebar, the mobile bottom bar, back links and the "Me" entry with both the default and a non-default configuration, and look at the tab layout in a browser when there are fewer entries; an unchanged default only proves the old behavior, not that the configuration works.
