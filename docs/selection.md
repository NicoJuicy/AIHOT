# Selection and calibration

## How an item becomes a selection

1. **Collected**: one copy per URL and per content. When an ordinary article has only a headline or summary, the body is fetched according to the source's rules; for video player pages the text material already provided is used, and the player page isn't treated as the body. Material without a trustworthy publication time stays private until the original's date is read, and is then judged as new or old (see "Old articles don't flood the site" in [Sources](sources.md#rule-old-articles-dont-flood-the-site)).
2. **Pre-screen** (`prefilter.md`): is this about this field? Broad intake that only blocks the clearly irrelevant: `BLOCK` material doesn't appear on any public page; `PASS` and uncertain `UNKNOWN` move on. Ordinary articles that have only a headline, with no body, feed summary or post text, wait for material first: they aren't scored, no copy is written from the headline alone, and they don't enter the public pool; they are judged once the material is complete and produces a new revision. Original posts with empty text or only a link that can be shown follow the existing scoring and as-is display rules.
3. **Scoring** (`selection-score.md`): the same rubric scores the item twice, independently (0–100). It scores high enough when **the sum of the two is ≥ 2 × the threshold**. The threshold depends on the source tier, and a source category can raise the threshold for certain official sources; items that score high enough still have to pass the dedup in step 6 to enter the selection. The score shown on pages is the average of the two (rounded down).
4. **Structuring** (`structure.md`): runs at the same time as scoring. It gives the category and tags (the ones shown on pages), the subject company, and decides whether the piece is one specific piece of news, a roundup covering several, or too thin to tell. For specific news, it extracts the facts (who did what to what, and when) along with the source passage and preconditions in the original. Topic pages, event grouping and the daily report all depend on it.
5. **Headline and summary**: written after structuring finishes. Selected and nearly selected items (average score above `understandFloor`) get an English headline, an answer-first summary and a reason to read according to `content-understanding.md`; the rest get a short headline and summary according to `summarize-*.md` and go into "All AI news". Browsing "All AI news" (the web list, the API, the latest list for agents and the MCP all mode, and the "All AI news" RSS) only shows material with an average score of at least `browseFloor`; material without a score is shown as usual, and search still covers everything. X posts with no body or only links keep their original links, images and quotes, without calling the writing or translation model and without generating "please add the body" copy; X long-form posts with an actual body are processed as usual. If the written text uses words listed in `industry/wording.ts`, the model is asked once more to change only those words (`mend-wording.md`).
6. **Grouping and dedup** (`group-*.md`): reports of the same story from different sources are grouped into one event, the event page has an overview (`story-digest.md`), and "Trending" ranks events. Before changing the overview prompt, you can compare the current prompt and a candidate side by side on the same events with [Overview evaluation](story-digest-evaluation.md). Material with a high enough score enters the selection only after grouping finishes: the model also decides whether it is the same news as reports already selected, and whether it has specific information the selection hasn't given yet.
   - Several reports of the same news can all be selected: on the website they fold into one reading group; the API, RSS and the sync API carry one entry per piece of news, the representative report. Official first-hand comes first; next, verified official accounts (`T1_5` accounts with `publisherRole` and `owner_entity_id` filled in, where the subject of the news is that very company, organizations before individuals); after that, reports with full text, higher scores and earlier publication.
   - Reports that aren't the same news but bring no new information (reintroducing an already disclosed capability in different words, merely listing on another platform, roundups that only repeat points already selected) don't enter the selection and stay in "All AI news". A roundup covering several things doesn't become an event of its own; it is only attached to the events it mentions, and is selected only if it has important content the selection doesn't cover. Material that is too thin to tell which news it is doesn't enter the selection.
   - An explicitly retracted report keeps its historical assignment but no longer takes part in later grouping recall, representative candidates, event starting points or automatic event comparison; the same URL and X replies or quotes can't use it as evidence of identity either. If the same fact still has a valid report, the valid one is used; if all are retracted, it is not recalled for now, and it can take part again once it is public again. Records shown only as summaries or not yet published are not retractions and keep their eligibility. Existing relations and judgments are not deleted, and nothing is regrouped in bulk.
   - Until confirmed, the material is only in "All AI news", and it is never let through automatically however long it waits. If the model call fails or the answer doesn't match the format, the item stays there: after waiting more than 10 minutes an alert is raised, the admin "Runs" page lists these items, and you can open the item in admin "Content diagnostics" and click "Regroup". So the grouping model must answer reliably in the required format.
7. **Daily, weekly and monthly reports**:
   - The **daily report** is published every day at 08:00 (publishing times of all three are in `EDITION_TIMES` in `site/site.ts`; the defaults are used below). It covers 08:00 the previous day to 08:00 that day, is compiled by rule, and calls no models. One entry per story: the most authoritative report of the piece of news with the most reports; the same event's other developments that day are listed below it, and a roundup covering several things is attached under the most important thing it mentions. Anything covered in the last 7 editions doesn't appear again; a covered event with new developments enters the main section only if the party involved took a new action itself (tutorials, opinions and other `commentary` categories don't count) or the development is reported by 4 or more sources; otherwise it goes into the briefs. Events with no selected report but with an official original post and already 3 or more independent participants are added too (only to the daily report, not the selection, and not pushed). Entries are ranked by importance (the highest score of the selected reports, independent participants discussing it that day, whether there is an official original post, with a penalty for follow-ups); the top 12 enter the main section, at most 2 from the same source, followed by at most 10 one-line briefs. The first entry is the lead story, and its own headline and summary are the lead; entries 2–4 are the day's highlights.
   - The **weekly report** (every Monday at 10:00) and the **monthly report** (on the 1st at 10:30) are compiled from that week's or month's daily reports: one event across several days counts once, ranked by its place in the dailies (lead story, highlight, how many days it ran), the breadth of coverage and its score. The weekly report takes the top 20 and the monthly the top 30, split into sections following the dailies' sections. The model (`report-period.md`, `report-period-sections.md`) only writes the overview and a one-sentence introduction for sections with three or more entries, without adding or removing entries. If it writes names or numbers that aren't in the entries (Latin-letter names, numbers with three or more digits, decimals or percent signs, companies in the vocabulary), that text isn't used: the overview is replaced by a sentence generated from a template, and the section gets no introduction. Generic industry terms (`PLAIN_TERMS` in `taxonomy.ts`) and the site name are exempt.
   - Each selected item goes into only one edition: by its own time, or by its confirmation time if it was confirmed later; items confirmed after the cutoff go into the next edition.
   - A check runs every half hour: each edition that is due is published once, and published editions are not rewritten; editions missed during downtime or that failed are filled in by later checks. When material was judged during the daily report window but there were no new events, an empty edition is published as usual; if no material was judged at all, it still counts as a failure, and a missing edition triggers an alert as described in the [deployment guide](deploy.md#updating). When every daily report expected in a weekly or monthly period exists and all their original body entries are empty, that edition is skipped automatically: no empty weekly or monthly report is written, no model is called, and it isn't recorded as generated or failed. The first period checked starts from the site's earliest daily report. When there is nothing to compile and a daily report is missing or the original entries can no longer be published, the original error is kept. Skipping doesn't write a permanent mark; after a daily report is corrected within the existing fill-in range, the edition can be generated again.

Every step's prompt is in `industry/prompts/`, and changing prompts doesn't require changing code. A prompt's version is the hash of its content: after a prompt changes, new material is judged by the new version, and material already judged is not recomputed.

## Thresholds: `industry/selection.ts`

```ts
export const SELECTION = {
  thresholds: { T1: 60, T1_5: 65, T2: 76 },   // the average of the two scores must reach at least this
  classes: {                                  // source categories: sources in a category have a threshold no lower than this
    ecosystem: { label: "Ecosystem and infrastructure", threshold: 70 },
    leaderboard: { label: "Leaderboards", threshold: 76 },
  },
  understandFloor: 50,                        // unselected material averaging above this is also written the way selected items are
  browseFloor: 40,                            // browsing "All AI news" only shows material averaging at least this; search isn't limited
};
```

Official first-hand sources (T1) have a lower threshold, and media and individuals (T2) a higher one: for the same story, the official original is more worth reading first. A tier without a threshold (`EXCLUDE_MP`) doesn't take part in the selection.

The tier only says whether a source is official and first-hand. Some official sources mostly write for developers or insiders day to day (chips and cloud services, development frameworks and toolchains, leaderboards…), and readers only want the big news among them: give such a source a category on the admin "Sources" page, and its threshold rises to at least the category's value. It only raises, never lowers, so tiers whose threshold is already higher are unaffected; without a category, only the tier applies. The category key is stored on the source, so don't rename it once live, or the renamed category silently stops applying; evaluation samples carry no category and use the tier threshold.

Setting `browseFloor` to `0` restores the old behavior: "All AI news" lists all public material.

These are the thresholds AIHOT has always used for AI, and they lean strict: better to select a few fewer items than let noise into the selection. After switching fields or changing the scoring rubric, be sure to recalibrate as described below.

## Calibration

### 1. Prepare a sample set

Pick 100–200 items from your own sources, label each one "select / don't select", and save them as `.data/gold.jsonl` (`.data/` isn't committed to Git). One item per line:

```json
{"caseId":"law-001","material":{"title":"Original headline","originalTitle":null,"publishedAt":"2026-10-01T09:00:00+08:00","sourceName":"Source name","bodyZh":null,"bodyOriginal":"Body text…"},"sourceFacts":{"sourceKind":"rss","sourceTier":"T1","firstParty":true,"language":"en"},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"regulation"},"gold":{"decision":"select"}}
```

| Field | Description |
|---|---|
| `caseId` | Unique ID |
| `material` | Headline, original headline, publication time, source name, body (the body in the site's language goes in `bodyZh`, the original-language body in `bodyOriginal`; one of them is enough) |
| `sourceFacts` | Source kind, tier, whether first-hand (in production only `T1` counts as first-hand; keep labels consistent with that), language. The tier decides which threshold applies |
| `samplingContext` | Optional. `benchmarkSplit` separates the development set from the holdout set; `samplingStratum` is your own grouping (for example "new rules", "rulings", "marketing") to see which kind goes wrong |
| `gold.decision` | `select` should be selected, `reject` should not, `either` could go either way (not counted in accuracy) |

`industry/gold.example.jsonl` has two examples.

A few suggestions:

- Include plenty of **hard cases**: items that almost should be selected and items that almost shouldn't. Too many obvious ones inflate accuracy.
- Set some aside as a **holdout set** (`benchmarkSplit: "holdout"`). Tune prompts looking only at the development set, then check once more with the holdout set at the end, so the prompt doesn't end up only good at these particular questions.
- The labeller should ideally be someone who will read the site later, or someone with the same taste.
- Evaluation only runs the pre-screen and the two scores, not the dedup in step 6: label by whether the item itself should be selected, and don't label it "don't select" because another report of the same story was already selected.

### 2. Run the evaluation

```bash
node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --split development --label "First rubric"
```

It runs the pre-screen and both scores on each sample and outputs:

- **Valid-output accuracy, precision, recall and F1**: only non-`either` samples that successfully got a selection decision are counted, to judge how accurate the model is once it answers;
- **Coverage**: the share of all non-`either` gold samples that successfully got a selection decision; **complete accuracy** uses all non-`either` gold samples as the denominator, counting model failures and malformed answers as not done correctly;
- `either` never enters the denominator of the quality metrics above; the report separately records failures among decision samples and among `either` samples. `goldSelectRate` is computed over all non-`either` gold samples, so it should be the same across models for the same batch;
- the results at each threshold from 40 to 90 in steps of 2 (the range can be changed in `DEPLOYMENT.selectionGold`, described below); the threshold sweep also reports valid-output accuracy, coverage and complete accuracy;
- the misjudged items. The full report is written to `.data/eval/` and imported into the admin SelectBench (add `--no-import` to skip the import).

Without `--models`, the evaluation uses the model the "Selection scoring" step currently uses in production: one switched on the admin "Models and evaluation" page first, then the `SCORE_MODEL` environment variable, then `DEFAULTS.score` in `site/models.ts`, and failing all of those the default model (`LLM_*` in `.env`). `--models default,deepseek-flash` compares several models on the same samples. Other common options: `--n 200` for the maximum number of samples, `--split holdout` to run only the holdout set, `--no-import` to skip importing into SelectBench. Put the sample file, sample count, which split to use and the threshold sweep range in `DEPLOYMENT.selectionGold` in `site/site.ts`, and running without options uses that setup.

Within one evaluation run, when different samples render exactly the same scoring input, only the model's scoring result is shared; each sample is still scored independently by its own pre-screen result, tier threshold and label. Failures are shared within the run too, so the first run and a rerun with existing results cover the same samples. Repeated runs reuse existing receipts. Token usage and average latency in the report are summed over all request attempts of the related receipts, including retries after parse failures; when rerunning with existing results, the cumulative usage of those receipts is shown, which doesn't represent new spending for this run.

### 3. Look at the errors, change the standard, run again

Go through the misjudged items and the model's reasons one by one in the admin SelectBench.

When uploading a multi-model report, the same `caseId` must have the same `gold` label under every model; the models' `decision` may differ. Reports with conflicting labels are rejected before being written, so the same item never shows different human answers in a side-by-side comparison; reports without per-case `cases` can still be imported.

- Should have been selected but wasn't: usually the rubric doesn't explain why it matters. Write this kind of value into the "must be assessed fairly" part of `selection-score.md`, with examples.
- Shouldn't have been selected but was: usually the noise wasn't suppressed. Write it into the "must be suppressed" part.
- Too loose or too strict overall, with the misjudged items all scoring close to the threshold: then adjust the thresholds in `industry/selection.ts`.

Change the standard before the thresholds: thresholds only move everything together and can't fix "which kind is misjudged". Run once after each change; SelectBench shows the comparison between versions. When comparing models, don't look only at valid-output F1: if coverage differs noticeably, look at complete accuracy too. A model with high scores that often fails to complete the structured judgment shouldn't have its failed samples "hidden" from the denominator.

## Changing models

The admin "Models and evaluation" page shows which model each step currently uses, its recent success rate, latency and token usage, and lets you switch directly (affecting only new jobs from then on). Before changing the scoring model, compare on the same samples with `--models` first.
