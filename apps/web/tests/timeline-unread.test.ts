// Failure modes fixed before adding the timeline's reader-side unread filter (issue #185):
// - a page whose cards are all read shows nothing and stops, instead of paging on and handing the
//   rest back to the button;
// - a failed page is not offered for retry, or retrying loses the filter;
// - a reading group disappears because its representative is read, or a fully read one stays;
// - returning to the list drops the filter, or an ordinary card survives it.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, expect, type Browser } from "@playwright/test";
import { FIXTURE_AT as at, fakeApi, feedItem, itemDetail, startWebServer, type WebServer } from "./web-server.ts";

const earlier = "2026-10-03T08:00:00.000Z";

const summaryOf = (id: string, title: string, timelineAt = at) => feedItem({ id, title, publishedAt: timelineAt, timelineAt });
const card = (id: string, title: string, timelineAt = at) => ({ key: id, anchorAt: timelineAt, item: summaryOf(id, title, timelineAt), group: null });
// A reading group whose representative is read but whose other selected report is not: the filter
// must keep it, or the unread report behind the representative would be unreachable.
const groupCard = { key: "g1", anchorAt: at, item: summaryOf("rep-1", "Representative article"), group: { factId: "f1", additionalSourceCount: 1, reportCount: 2, memberIds: ["rep-1", "member-2"] } };
// ...and one whose every selected report is read: it must go.
const readGroupCard = { key: "g2", anchorAt: at, item: summaryOf("rep-3", "Fully read group"), group: { factId: "f2", additionalSourceCount: 1, reportCount: 2, memberIds: ["rep-3", "member-4"] } };

let web: WebServer;
let origin: string;
let chrome: Browser;
let failNextPage = false;

const api = fakeApi((url, res) => {
  const p = url.pathname;
  if (p === "/api/site/topics") return { groups: [], topics: [] };
  if (p === "/api/site/hot") return { computedAt: at, windowHours: 48, entries: [] };
  if (p === "/api/site/timeline") {
    const tag = url.searchParams.get("tag");
    const cursor = url.searchParams.get("cursor");
    if (tag === "boundary") {
      const n = cursor ? Number(cursor) : 1;
      return { filters: { channel: "all", category: null, tag }, cards: [card(`boundary-${n}`, `Batch ${n}`)], nextCursor: n < 5 ? String(n + 1) : null, hot: null, dayCounts: { "2026-10-04": 5 } };
    }
    if (tag === "group") {
      return { filters: { channel: "all", category: null, tag: "group" }, cards: [groupCard, readGroupCard], nextCursor: null, hot: null, dayCounts: { "2026-10-04": 2 } };
    }
    if (tag === "read") {
      return { filters: { channel: "all", category: null, tag: "read" }, cards: [card("c1", "Page one article A")], nextCursor: null, hot: null, dayCounts: { "2026-10-04": 1 } };
    }
    if (cursor === "p2") {
      if (failNextPage) { res.statusCode = 503; return { code: "unavailable" }; }
      return { filters: { channel: "all", category: null, tag: null }, cards: [card("c3", "Page two article A", earlier), card("c4", "Page two article B", earlier)], nextCursor: null, hot: null, dayCounts: { "2026-10-03": 2 } };
    }
    return { filters: { channel: "all", category: null, tag: null }, cards: [card("c1", "Page one article A"), card("c2", "Page one article B")], nextCursor: "p2", hot: null, dayCounts: { "2026-10-04": 2 } };
  }
  if (p === "/api/site/groups/f1/reports") {
    const report = (id: string, title: string) => ({ id, title, source: { name: "Fixture" }, timelineAt: at, originalUrl: `https://example.org/${id}` });
    return { factId: "f1", reports: [report("rep-1", "Representative article"), report("member-2", "Unread report in group"), report("other-5", "Read report in group")] };
  }
  if (p.startsWith("/api/site/items/")) {
    const id = p.split("/").at(-1)!;
    return itemDetail({ id, title: `Article ${id}`, originalTitle: `Article ${id}` });
  }
});

before(async () => {
  const started = await Promise.allSettled([
    startWebServer(api).then((w) => { web = w; origin = w.origin; }),
    chromium.launch({ channel: "chromium" }).then((b) => { chrome = b; }),
  ]);
  for (const result of started) if (result.status === "rejected") throw result.reason;
});

after(async () => {
  await chrome?.close();
  await web?.stop();
});

/** A reader who has already opened these reports, in this browser only. */
async function readerWith(read: string[]) {
  const context = await chrome.newContext();
  await context.addInitScript((ids) => {
    try { window.localStorage.setItem("aihot-read-items", JSON.stringify(ids)); } catch { /* storage unavailable */ }
  }, read);
  return context;
}

test("an all-read page keeps paging, then hides the read cards and shows the unread one", async () => {
  const context = await readerWith(["c1", "c2"]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/`);
    await expect(page.getByRole("link", { name: "Page one article A", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unread only" }).click();
    // Both loaded cards are read: the list pages on by itself and lands on the unread report.
    await expect(page.getByRole("link", { name: "Page two article A", exact: true })).toBeVisible();
    assert.equal(await page.getByRole("link", { name: "Page one article A", exact: true }).count(), 0, "a read card is hidden");
    assert.equal(await page.getByRole("button", { name: "Unread only" }).getAttribute("aria-pressed"), "true");
  } finally {
    await context.close();
  }
});

test("a page that fails to load offers a retry that keeps the filter", async () => {
  const context = await readerWith(["c1", "c2"]);
  const page = await context.newPage();
  failNextPage = true;
  try {
    await page.goto(`${origin}/`);
    await expect(page.getByRole("link", { name: "Page one article A", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unread only" }).click();
    const retry = page.getByRole("button", { name: "Couldn't load more. Tap to retry" });
    await expect(retry).toBeVisible();
    failNextPage = false;
    await retry.click();
    await expect(page.getByRole("link", { name: "Page two article A", exact: true })).toBeVisible();
    assert.equal(await page.getByRole("button", { name: "Unread only" }).getAttribute("aria-pressed"), "true", "retrying keeps the filter");
  } finally {
    failNextPage = false;
    await context.close();
  }
});

test("returning to the list keeps the filter and finds the unread report again", async () => {
  const context = await readerWith(["c1", "c2"]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/`);
    await expect(page.getByRole("link", { name: "Page one article A", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unread only" }).click();
    const opened = page.getByRole("link", { name: "Page two article A", exact: true });
    await expect(opened).toBeVisible();
    // Opening a card marks it read in this browser, so the return has to find the other unread one.
    await opened.click();
    await expect(page.getByText("Fixed body", { exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("button", { name: "Unread only" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "Page two article B", exact: true })).toBeVisible();
    assert.equal(await page.getByRole("link", { name: "Page two article A", exact: true }).count(), 0, "the report just opened stays hidden");
  } finally {
    await context.close();
  }
});

test("a group stays while any selected report in it is unread, and goes once all are read", async () => {
  const context = await readerWith(["rep-1", "rep-3", "member-4"]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/?tag=group`);
    await expect(page.getByRole("link", { name: "Representative article", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unread only" }).click();
    await expect(page.getByRole("link", { name: "Representative article", exact: true })).toBeVisible();
    assert.equal(await page.getByRole("link", { name: "Fully read group", exact: true }).count(), 0, "a fully read group is hidden");
  } finally {
    await context.close();
  }
});

// A group kept for its unread reports must not look read, and opening it shows which reports are
// still unread (read ones in the same grey as read cards).
for (const phone of [false, true]) test(`a kept group is not greyed and its ${phone ? "sheet" : "expansion"} marks the unread reports`, async () => {
  const context = await readerWith(["rep-1", "other-5"]);
  const page = await context.newPage();
  await page.setViewportSize(phone ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  // The title text itself is drawn in the read grey (the source line beside it always is).
  const greyed = (name: string) => page.evaluate((text) => {
    const node = [...document.querySelectorAll("a, a *")].find((e) => e.childElementCount === 0 && e.textContent === text && (e as HTMLElement).offsetParent)!;
    const probe = document.body.appendChild(Object.assign(document.createElement("span"), { className: "text-ink-4" }));
    const grey = getComputedStyle(probe).color;
    probe.remove();
    return getComputedStyle(node).color === grey;
  }, name);
  try {
    await page.goto(`${origin}/?tag=group`);
    await page.getByRole("button", { name: "Unread only" }).click();
    const title = page.getByRole("heading", { name: "Representative article" });
    await expect(title).toBeVisible();
    assert.equal(await greyed("Representative article"), false, "the kept group's card is not greyed");
    await page.locator("article", { has: title }).getByRole("button", { name: "Also covered by 1 other source" }).filter({ visible: true }).click();
    await expect(page.getByText("Unread report in group", { exact: true }).filter({ visible: true })).toBeVisible();
    assert.equal(await greyed("Unread report in group"), false, "an unread report keeps the normal colour");
    assert.equal(await greyed("Read report in group"), true, "a read report is grey");
  } finally {
    await context.close();
  }
});

test("with everything read and no more pages, the filter says so instead of looking empty", async () => {
  const context = await readerWith(["c1"]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/?tag=read`);
    await expect(page.getByRole("link", { name: "Page one article A", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unread only" }).click();
    await expect(page.getByText("No unread picks", { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("all-read pages stop at the automatic bound and can continue manually without changing local records", async () => {
  const context = await readerWith(["boundary-1", "boundary-2", "boundary-3", "boundary-4"]);
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/?tag=boundary`);
    const raw = await page.evaluate(() => localStorage.getItem("aihot-read-items"));
    await page.getByRole("button", { name: "Unread only" }).click();
    const more = page.getByRole("button", { name: "Load more", exact: true });
    await expect(more).toBeVisible();
    await more.click();
    await expect(more).toBeVisible();
    await expect(page.getByText("You've read all of these picks", { exact: true })).toBeVisible();
    await more.click();
    await expect(page.getByRole("link", { name: "Batch 5", exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => localStorage.getItem("aihot-read-items")), raw);
  } finally { await context.close(); }
});
