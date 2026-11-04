# Event grouping and relation evaluation

The site first recalls candidate facts from the last two weeks using the headline and summary (comparing embeddings when an embedding service is configured, text overlap otherwise), then asks a model to judge the relation between reports, and at the same time whether the report brings new information compared with what's already selected (reports that score high enough need this to enter the selection; see [Selection and calibration](selection.md)). The relation definitions and the prompts the site actually uses are in `industry/prompts/group-*.md`; the code entry points are `packages/backend/src/events/relate.ts` and `group.ts`.

The four relations are:

- `SAME_OCCURRENCE`: the same real-world occurrence, for example the official original and media reports of the same release.
- `SAME_STORY`: not the same occurrence, but a direct development of the same specific event, for example a listing, review or response after a release.
- `UNRELATED`: different things, even with the same subject, product or topic.
- `ROUNDUP`: one side is a roundup covering several topics.

## Evaluating pairwise relation judgments with your own labelled samples

`scripts/eval-relations.ts` only evaluates the model's judgment of the relation between two reports. It reuses the `PAIR_SYSTEM`, `pairUser()`, `PairSchema` and prompt version the site uses when grouping, so the evaluation follows any prompt change. It doesn't rerun candidate recall and doesn't write results back to event grouping.

Put your own labelled data under `.data/` (this directory isn't committed to Git). `industry/relation-gold.example.jsonl` has four fictional examples. One case per line:

```json
{"caseId":"release-001","a":{"title":"...","source":"...","firstParty":true,"publishedAt":"2026-09-01T09:00:00+08:00","summary":"..."},"b":{"title":"...","source":"...","firstParty":false,"publishedAt":"2026-09-01T09:20:00+08:00","summary":"..."},"samplingContext":{"benchmarkSplit":"development","samplingStratum":"same-release"},"gold":{"relation":"SAME_OCCURRENCE"}}
```

`a` and `b` can also carry an optional `frame` matching the site's internal `ReportView`:

```json
{"subject":"Acme","action":"releases","object":"Acme-2","occurredAt":"2026-09-01"}
```

Put easily confused borderline cases in the development set, and keep some as `benchmarkSplit: "holdout"` for a final check. `samplingStratum` is an optional grouping label for seeing which kind goes wrong; it doesn't affect the model input.

### Running

Configure the database and models as for a normal deployment, then run:

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --split development
```

By default it uses the current model of the "Group review" step: one switched on the admin "Models and evaluation" page first, then the `GROUP_REVIEW_MODEL` environment variable, then `DEFAULTS.groupReview` in `site/models.ts`, and failing all of those the default model. You can also compare several configured models explicitly:

```bash
node --env-file=.env scripts/eval-relations.ts \
  --gold .data/relation-gold.jsonl \
  --models default,deepseek-flash \
  --split development \
  --n 200 \
  --seed 7 \
  --thresholds 0.75,0.8
```

Options:

| Option | Default | Description |
|---|---:|---|
| `--gold` | `.data/relation-gold.jsonl` | Labelled sample file (JSONL) |
| `--models` | The current "Group review" model | Comma-separated model names |
| `--split` | `all` | `development`, `holdout` or your own split |
| `--n` | `200` | Maximum number of cases to evaluate |
| `--seed` | `7` | Random seed for sampling; the same seed draws the same samples every time |
| `--concurrency` | `6` | Number of model requests in flight at once |
| `--thresholds` | Production `STORY_REVIEW_MIN_CONFIDENCE,TIE_MIN_CONFIDENCE` | Confidence thresholds for judging that two reports "join the same event"; passing them explicitly overrides the defaults |

The full report is written to `.data/eval/relations-*.json`. For each model you get:

- a 4 × 4 confusion table: which relation the model gave for each labelled relation;
- precision, recall, F1 and sample count for each relation (counting only samples that got a structured judgment);
- `coverage`: the share of all gold samples that got a structured judgment;
- `accuracy` and four-class macro-F1, which only measure judgment quality once a structured judgment was obtained; `completeAccuracy` uses all gold samples as the denominator, counting failed calls and malformed answers as not done correctly;
- precision, recall and F1 at each confidence threshold when both `SAME_OCCURRENCE` and `SAME_STORY` count as "joining the same event", together with `coverage` and `completeAccuracy` for the same samples;
- the number of failed calls, token usage, average latency per request and total time of the run;
- each sample's judgment, confidence, the model's explanation of the difference (`difference`) and the receipt ID.

Model calls go through receipts and the budget breaker as usual. Repeated evaluations with the same model, prompt and input reuse existing receipts; within one run, samples with the same input share one request result and are each scored by their own label, and failures are shared too, so nothing is requested twice in the run. `reused` in the report covers shared successes or failures as well as reused existing successful receipts. Evaluation receipts use their own purpose, `eval_relation_pair`, and aren't counted in the admin statistics for the site's grouping steps.

Token usage and average latency are summed over all request attempts of the receipts the report references, including earlier responses that failed to parse; the same receipt isn't counted twice for multiple samples. When rerunning with existing results, this historical usage is still shown, which doesn't represent new spending for this run.

CI checks JSONL parsing, sampling with a fixed seed, every metric, and concurrent reuse and retry usage accounting against a local fake model service, without reaching external model services.
