// The selection thresholds. The scoring rubric itself is in prompts/selection-score.md; this file only decides "what score gets picked".
// Each item is scored twice, independently, by the scoring model (0–100); it becomes a pick candidate when the two scores sum to ≥ 2 × the threshold.
// After its news identity and added value are confirmed, the publication rules decide what is shown (see docs/selection.md); cards show the average of the two scores.
// Thresholds differ by source tier: first-hand official sources have a lower bar, media and individuals a higher one; a source class can raise the bar for some official sources.
// After changing a threshold or the scoring prompt, rerun scripts/eval-selection.ts on your own labeled samples before going live (see docs/selection.md).

export const SELECTION = {
  /**
   * Source tier → selection threshold (average score). Set each source's tier under "Sources" in the admin:
   *   T1 first-hand official (websites, official blogs, institutions) · T1_5 official accounts, quasi-official creators · T2 media and individuals
   * The EXCLUDE_MP tier and any tier not listed here are not scored for selection (they only appear in "All updates").
   */
  thresholds: { T1: 60, T1_5: 65, T2: 76 } as Record<string, number>,
  /**
   * Source class → minimum threshold. The tier only says whether a source is official and first-hand; some official sources mostly write
   * day-to-day content for developers or insiders, and readers only want the big news among it. Give such a source a class under
   * "Sources" in the admin, and its threshold is raised to at least the number here.
   * Raise only, never lower: tiers whose threshold is already higher (media) are unaffected. Sources without a class use only their tier.
   *   ecosystem: chips and hardware, inference and cloud services, model hosting, development frameworks and toolchains, security research vendors, engineering and developer blogs
   *   leaderboard: evaluation organizations that benchmark and rank models
   */
  classes: {
    ecosystem: { label: "Ecosystem & infrastructure", threshold: 70 },
    leaderboard: { label: "Leaderboards", threshold: 76 },
  } as Record<string, { label: string; threshold: number }>,
  /**
   * Items not picked but with an average score above this number are also written the way picks are (content understanding: title,
   * summary, reason to read); the rest use the cheaper "title and summary translation".
   */
  understandFloor: 50,
  /**
   * Browsing "All updates" (the web list, and the all mode of the API and RSS) shows only items whose average score is at least this
   * number; items without a score show as usual. Search still covers everything. Items below 40 are mostly retellings and news-account
   * spam (once over a third of all updates), and no pick has ever scored below 60.
   */
  browseFloor: 40,
} as const;
