// Words this site does not use in reader-facing text; each entry is the spelling to look for and how to fix it (for example
// [/\b(?:game-changing|mind-blowing)\b/iu, "no hype; say plainly what happened"]). After the writing step writes the English title, summary
// and reason to read, each entry is checked; if any is used, the model is asked once to change only those spots (mendWording in
// packages/backend/src/editorial/analyze.ts). List only spellings that can be judged at a glance: leave out uncertain ones, or normal
// words get changed by mistake. Empty means no check.

export const READER_WORDING: ReadonlyArray<readonly [RegExp, string]> = [];
