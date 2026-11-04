# Industry pack

All of this industry's knowledge lives here: categories, topics, sources, selection criteria and thresholds. Switching to another industry mostly means changing this folder and [`site/`](../site/) (site name, copy, brand and pages); the steps are in [Make it your industry](../docs/customize.md).

| File | Contents |
|---|---|
| `taxonomy.ts` | Categories, tags, companies and organizations, the lexicon that keeps the model from mixing up companies, and the kind of release this industry watches most (`RELEASE`) |
| `topics.json` | The topic directory (`/topics`), read when the site starts |
| `sources.json` | Demo sources imported on first start |
| `prompts/` | The prompt for each step: prefilter, scoring, writing, structuring, grouping, event overviews, weekly and monthly reports, translation |
| `selection.ts` | Selection thresholds |
| `gold.example.jsonl` | Format example for selection evaluation samples |
| `relation-gold.example.jsonl` | Format example for event relation evaluation samples |
| `story-digest-eval.example.jsonl` | Format example for event overview evaluation cases |
