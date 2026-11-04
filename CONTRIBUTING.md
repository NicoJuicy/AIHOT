# Contributing

Reproducible bug reports, documentation fixes, and improvements that are useful to other fields too are all welcome.

## Where to talk

- [Issues](https://github.com/KKKKhazix/AIHOT/issues/new/choose): reproducible bugs and feature requests with a clear use case.
- [Deployment and usage Q&A](https://github.com/KKKKhazix/AIHOT/discussions/categories/q-a): installing, configuring, deploying and using the site; mark the answer once your question is solved.
- [Ideas](https://github.com/KKKKhazix/AIHOT/discussions/categories/ideas): discuss direction and use cases first.
- [Show and tell](https://github.com/KKKKhazix/AIHOT/discussions/categories/show-and-tell): share the news site you built for your field and what you learned.
- Report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## What to contribute

Improvements to the deployment experience, general-purpose collection, the processing pipeline, public interfaces, accessibility, documentation, and fixes for reproducible failures are the most welcome. Before a large change to the architecture or product behavior, describe the use case and the plan in an issue or a discussion, so you don't find out the direction is wrong after doing the work.

Sources and selection standards that only fit your field belong in `industry/` in your own repository; the site name, brand and pages belong in `site/`; features only your site needs become modules in `modules/` (see [Architecture](docs/architecture.md#modules)). Follow [Customization](docs/customize.md) for the steps. For compliance and risk reasons, the full production source list is not shared. This repository also does not maintain dedicated collectors for platforms such as Weibo or Xiaohongshu; you can push in results from a collector you maintain yourself, as described in [Sources](docs/sources.md).

## Submitting changes

1. Fork this repository and create your own branch from the latest `main`. If you only want to run an independent site, you can use [Use this template](https://github.com/KKKKhazix/AIHOT/generate); a project generated from the template shares no commit history, so a fork is better for contributing code or merging upstream updates later.
2. Read [AGENTS.md](AGENTS.md) and the documentation for the area you are changing. Keep each PR to one clear problem, with no unrelated refactoring and no `package-lock.json` changes from reinstalling dependencies. Dependency upgrades, agent rule files (`AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`) and binary files are not accepted from external PRs; if they need to change, open an issue first and a maintainer will make the change.
3. Set up a local environment as described in [Deployment](docs/deploy.md). Use a separate test database, and keep collection, model calls and outbound pushes off while developing; never test against a production database or real paid services.
4. Verify the behavior your change affects and write the results in the PR. CI from forks only runs after a maintainer approves it, so it does not replace local checks. For code changes, run `npm run typecheck`, `npm test`, the web build and the web tests. The backend test database name must end in `_test` or `_ci` (it is created and migrated automatically if missing); each test file runs in parallel on its own copy, so the test database account needs the `CREATEDB` privilege. Check a running site with `node scripts/smoke.ts --base http://localhost:3000`. For documentation-only or template-only changes, checking links, syntax and how it actually renders is enough; don't add tests just to have more.
   When changing the database, never edit a migration that has already been released; put the fix in a new file. Each new file holds a single statement that is safe to run online. PRs check this automatically, and you can run `node scripts/check-migrations.ts --base main` locally first. See the [migration conventions](docs/architecture.md#database-migrations).
   The backup and restore tests also need `tar` and a `pg_dump`/`pg_restore` compatible with the server version; they create and clean up their own temporary restore database and file directory, and never touch real object storage.
5. Open a PR against `main` of this repository, link the related issue, and tick "Allow edits by maintainers": for small problems a maintainer can fix them on your branch and merge, without another round trip for you. Open a draft while you are still working and mark it ready when done. Attach screenshots for page changes. If configuration or upgrade steps change, update the documentation in the same PR, and write what deployed sites must do when upgrading in the "Updating" section of [Deployment](docs/deploy.md).

`main` is merged through PRs. When the PR is ready to merge, squash its branch into one commit with the correct author; update a branch you have already pushed with `git push --force-with-lease`. The branch must include the latest `main`. Once GitHub's `check` and `docker` pass on that commit, a maintainer merges it with rebase, keeping your authorship.

Do not commit `.env`, keys, admin passwords, cookies, production data or material you are not authorized to use; remove sensitive information from logs and screenshots too. The code is under the [MIT License](LICENSE); see [NOTICE](NOTICE) for the brand and third-party material.
