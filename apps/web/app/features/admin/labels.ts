// Shared admin vocabulary.
import { SELECTION } from "@aihot/industry/selection";

export const KIND_LABEL: Record<string, string> = { rss: "RSS", web_list: "Web list", json_list: "JSON", x_search: "X", external: "External reports" };
export const MODE_LABEL: Record<string, string> = { editorial: "Editorial", hot_signal: "Heat signal", isolated: "Isolated" };
export const HEALTH_LABEL: Record<string, string> = { ok: "OK", degraded: "Unstable", failing: "Failing", paused: "Paused", unknown: "Not checked" };
export const VISIBILITY_LABEL: Record<string, string> = { public: "Public", "summary-only": "Summary only", withdrawn: "Withdrawn" };
export const FEEDBACK_STATUS: Record<string, string> = { new: "New", triaged: "In progress", replied: "Replied", resolved: "Resolved", spam: "Spam" };
export const FEEDBACK_KIND: Record<string, string> = { bug: "Bug", suggestion: "Suggestion", question: "Question", other: "Other" };
export const TIER_LABEL: Record<string, string> = { T1: "T1", T1_5: "T1.5", T2: "T2", EXCLUDE_MP: "Not selected" };
/** The industry pack's source classes, each with the threshold floor it sets. */
export const SELECTION_CLASS_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SELECTION.classes).map(([k, c]) => [k, `${c.label} (threshold at least ${c.threshold})`]),
);
