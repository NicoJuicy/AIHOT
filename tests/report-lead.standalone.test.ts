// A daily's front-page picture comes from the item its lead is about: the editors' lead matched to an
// item by title, never simply the first highlight.
import "./setup.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReportCitation } from "@aihot/contracts/site";
import { leadItemOf } from "@aihot/backend/publication/reports";

const cite = (itemId: string, title: string, available = true) => ({ itemId, title, available }) as ReportCitation;
const arena = cite("a", "Claude Opus 5.5 (High) tops the Arena Text leaderboard with 1509 points");
const openai = cite("b", "OpenAI pauses training and tool use of its strongest model, discloses safety incidents including an agent going online through a DNS flaw and leaking a GitHub token");

test("an editors' lead is matched to the item it is written about", () => {
  assert.equal(leadItemOf("OpenAI pauses strongest model training and tool use, discloses agent safety incidents", [arena, openai], [arena, openai])?.itemId, "b");
});

test("a lead that matches no item clearly has no item", () => {
  assert.equal(leadItemOf("Many firms launch fresh models, rivalry grows fiercer", [arena], [arena, openai]), undefined);
});

test("without an editors' lead the first highlight leads", () => {
  assert.equal(leadItemOf(undefined, [arena], [openai, arena])?.itemId, "a");
});

test("a withdrawn highlight never leads the front page", () => {
  const withdrawn = cite("w", "Withdrawn", false);
  assert.equal(leadItemOf(undefined, [withdrawn, arena], [withdrawn, arena, openai])?.itemId, "a");
});
