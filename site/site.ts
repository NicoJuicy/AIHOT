// The site's identity and the copy readers see. When switching to your industry, change this file first.
// Both the web app and the backend read it; rebuild after changing it (docker compose up --build).
// The domain isn't here: set it with the SITE_URL environment variable when deploying.

import type { Founder } from "@aihot/contracts/site-config";

/**
 * When the daily, weekly and monthly reports come out (Beijing time, UTC+8, HH:mm): the daily covers the 24 hours
 * before this time, the weekly comes out on the Monday after each calendar week, and the monthly on the 1st of each
 * month. Scheduling, issue windows, missing-issue alerts and all copy that mentions the times read it (files in
 * public/ use the placeholders {{dailyTime}}, {{weeklyTime}}, {{monthlyTime}}); the scheduler checks every half hour,
 * so use a whole or half hour.
 */
export const EDITION_TIMES = { daily: "08:00", weekly: "10:00", monthly: "10:30" };

/**
 * "Daily at 08:00", "Mondays at 10:00", "On the 1st of each month at 10:30": the edition times as written in copy
 * (Beijing time, UTC+8). They start with a capital letter, so they read best at the start of a sentence or label.
 */
export const EDITION_WHEN = {
  daily: `Daily at ${EDITION_TIMES.daily}`,
  weekly: `Mondays at ${EDITION_TIMES.weekly}`,
  monthly: `On the 1st of each month at ${EDITION_TIMES.monthly}`,
};

export const SITE = {
  /** Site name: used in navigation, page titles, share images, RSS, MCP and the admin. */
  name: "MyHOT",
  /**
   * Industry word: composed into the default phrases, such as "AI Daily" and "AI news".
   * Change it to "Legal", "HR", "Gold" and so on, and the pages will say "Legal Daily", "Legal news".
   */
  subject: "AI",
  /** The home page's full title (browser tab, search results). */
  homeTitle: "MyHOT — AI Industry News · Daily Picks and Digest",
  /** Title of the topics index page (/topics). */
  topicsTitle: "AI Topics: the latest on companies and models, research directions and content formats",
  /** Example text in the feedback form's input. */
  feedbackExample: "For example: when I searched for a keyword, I ran into ... I was trying to ...",
  /** The line under the feedback page's title. */
  feedbackLead: "Found a bug, want a feature, or see something you don't like? Tell us.",
  /** Hint in the feedback form's email field. */
  feedbackEmailHint: "Leave your email and we can write back",
  /** One-line description: used by search engines, share cards, RSS and llms.txt. */
  description: `Picks the AI news worth reading from a set of sources, groups coverage of the same story, and publishes a digest every day at ${EDITION_TIMES.daily} (UTC+8).`,
  /** A longer introduction under the one-line description in llms.txt (optional). */
  llmsIntro: null as string | null,
  /** A line of small print: under share images and posters. */
  tagline: "AI news worth your attention",
  /** Keywords for search engines (the home page's structured data). */
  keywords: ["AI news", "AI daily", "AI digest", "AI industry news"] as string[],
  /** The year the site started collecting (the time range in structured data, optional). */
  since: null as string | null,
  /** Interface language as a BCP 47 tag (HTML lang, og:locale, schema.org inLanguage, the web manifest's lang). */
  locale: "en-US",
  /** Default domain, used only when SITE_URL isn't set. */
  defaultUrl: "http://localhost:3000",
  /** Icons also served at the site root besides the standard ones (favicon.ico, icon.png, icon-192.png, apple-icon.png, logo.svg): file names in site/brand/ (optional); use when manifest.webmanifest or other sites reference them. */
  rootIcons: [] as string[],
  /**
   * Prefix for MCP tool names (lowercase letters, digits, underscores); the tools will be called myhot_get_latest,
   * myhot_search, ... Don't change it once anyone has connected.
   */
  mcpPrefix: "myhot",
  /**
   * Version of the public interfaces (MCP, OpenAPI, llms.txt); it only goes up.
   * Bump the major version when you change an existing field or its meaning, and say so in the deployment notes.
   */
  interfaceVersion: "4.0.0",
  /** Public contact email (optional): written in llms.txt and in the usage notes for agents. */
  contactEmail: null as string | null,
  /** A line of small print at the bottom of the about page (optional). */
  footerNote: "Powered by the open-source AIHOT framework",
  /** ICP filing number for websites in mainland China (optional); when set, it's shown at the bottom of the sidebar and the "Me" page, linked to the MIIT filing system. */
  icp: null as string | null,
  /** Public security filing for websites in mainland China (optional); when set, it's shown at the bottom of the sidebar and the "Me" page. */
  psb: null as string | null,
  /** The source code's GitHub repository URL (optional); when set, "Open source on GitHub" is shown at the bottom of the sidebar and the "Me" page. */
  github: null as string | null,
  /** The website operator in structured data (for search engines). */
  organization: {
    name: "MyHOT",
    /** Founder (optional). */
    founder: null as Founder | null,
  },
  /** The name and version reported when fetching sources (in the User-Agent); don't impersonate another site. */
  crawlerName: "MyHOTBot/1.0",
} as const;

/** The terms of use and privacy notice pages (their text is in pages/). */
export const POLICY = {
  terms: {
    /** Page name: used in navigation, the footer and the page title. */
    name: "Terms of Use",
    description: "Terms for using this site's web pages, RSS, public API and MCP.",
    /** A one-line note about this page in llms.txt (optional). */
    covers: null as string | null,
    /** Usage reminders for the RSS and API panels of the agent access page (optional). */
    notes: null as null | { rss: string; api: string },
    /**
     * Wording on which uses need permission first (optional): llms goes after the copyright note in llms.txt's
     * "Usage" section, and agent opens the "Terms of use" section of the usage notes for agents.
     */
    license: null as null | { llms: string; agent: string },
    /**
     * Response headers that declare the terms on the public API, RSS and OpenAPI file (optional): sent as is, plus a
     * Link header pointing to this page (rel="terms-of-service"); callers in the browser can read them too.
     */
    headers: null as null | Record<string, string>,
  },
  privacy: {
    description: "How this site handles data stored in your browser, feedback and access logs.",
    /** A one-line note about this page in llms.txt (optional). */
    covers: null as string | null,
  },
  /**
   * Whether the text and images of an X post count as full text: if so, they're shown only when the item allows
   * full text on the site (the source allows it and the body was fetched); if not, they're always shown, like the
   * title and summary.
   */
  xPostIsFullText: true,
} as const;

/** Navigation (desktop sidebar, phone tab bar, the "Me" page). */
export const NAV = {
  /**
   * Engine entries left out of navigation; only the trending list ("/hot") and topics ("/topics") are supported.
   * The pages still open; back buttons and links that led to them go to the picks instead, and with "/hot" the
   * home page doesn't show what's trending either.
   */
  hidden: [] as Array<"/hot" | "/topics">,
};

/** A few phrases and display options on item cards and detail pages. */
export const ITEM_COPY = {
  /** What the model's one-line reason is called: used on cards, detail pages, Markdown export, answers for agents and group notifications. */
  reasonLabel: "Why it matters",
  /** Whether readers see the AI score on the web and on share images. Display only: the public API and MCP still include score, and the admin shows it as usual. */
  showScore: true,
};

/** A QR code card on the about page. */
interface ContactCard {
  kind: string;
  title: string;
  note: string;
  /** A root file name other sites have linked to (optional), such as qr-feishu.jpg: this address always redirects to the current QR code. */
  alias?: string;
}

/** About page copy. The numbers (sources, collected, picks, daily issues) come from live site statistics and aren't written here. */
export const ABOUT = {
  kicker: `About ${SITE.name}`,
  /** Page description (search results, share cards). */
  description: `About ${SITE.name}: ${SITE.description}`,
  /** The headline: the first line in the normal color, the second in the accent color. */
  headline: ["Something new happens in AI every day.", "Only a few things are worth reading."] as [string, string],
  /**
   * The paragraph under the headline. {sources} is replaced with the live source count, with a space added on each
   * side (so don't write spaces around {sources}); when the stats aren't available, it's replaced with
   * sourcesFallback as is, so the fallback carries its own surrounding spaces.
   */
  lead: `${SITE.name} watches{sources}sources for you: collecting, grouping, scoring and picking, with a new digest every day at ${EDITION_TIMES.daily}. Free, no sign-up.`,
  sourcesFallback: " a dozen or so ",
  /** The four stages under the source river animation. */
  steps: {
    collect: "We follow feeds from official blogs, media and individuals; the more often a source updates, the more often we check it, as often as every 15 minutes.",
    store: "Everything collected is kept, and coverage of the same story is grouped together; the trending list is computed from this.",
    select: `A model first checks whether it belongs to this industry and carries real information, then writes the title, summary and "${ITEM_COPY.reasonLabel}". Marketing copy and duplicate reposts don't get in.`,
    publish: `A daily digest every day at ${EDITION_TIMES.daily}, a weekly review on Mondays at ${EDITION_TIMES.weekly}, and a monthly roundup on the 1st of each month at ${EDITION_TIMES.monthly}.`,
  },
  /**
   * The author block (optional); null hides it.
   * avatarSourceId: the id of an X account source whose avatar to use (optional).
   * Upload the QR codes on the admin "Settings" page, or put them in site/brand/contact/; a card without a QR code isn't shown.
   */
  maker: null as null | {
    name: string;
    avatarSourceId?: string | null;
    greeting: string[];
    feishu?: ContactCard;
  },
  /** The copyright and takedown note at the bottom of the page; a link to the feedback page goes between the two parts. */
  copyright: [`${SITE.name} is an aggregated summary and reading index; copyright in the original articles belongs to their sources. If you are a source and would like a correction, a takedown, or a change in how your content is shown, contact us through the `, "."] as [string, string],
  /** Anchor id of the "Terms of Use" link at the bottom of the page (optional): set it if outside documents have hard-coded the anchor, and never change it afterwards. */
  termsAnchor: null as string | null,
} as const;

/** Notes for admins on admin pages (optional). */
export const ADMIN = {
  /** A line under the "Feedback" page title. */
  feedbackNote: null as string | null,
  /** A sentence with this site's rule added to the confirmation dialog when banning a feedback source. */
  banNote: null as string | null,
  /** A sentence with this site's rule added to the confirmation dialog when changing a paid service's request limit. */
  budgetNote: null as string | null,
};

/** Examples on the agent access page. */
export const AGENT = {
  /** The "search" row in the MCP tools table: what it can search and how to ask. */
  search: { scope: "Search the last 7 days by company, product, person or topic", ask: "What has this company released lately?" },
};

/** Wording on the daily, weekly and monthly report layouts. */
export const REPORTS = {
  /** The publisher line under the masthead. */
  imprint: SITE.name.toUpperCase(),
  /** A word beside the masthead. */
  motto: SITE.subject as string,
  /** Each report kind's page description (search results, share cards), without a final period; llms.txt also uses it to introduce the weekly and monthly. */
  descriptions: {
    daily: `The curated ${withSubject("industry digest")} from ${SITE.name}, published every day at ${EDITION_TIMES.daily} (UTC+8)`,
    weekly: subjectAfter("Weekly", "industry review"),
    monthly: subjectAfter("Monthly", "industry roundup"),
  },
  /**
   * What one entry of an issue is called ("4 stories"): used in the title when there is no lead story ("The day's
   * 4 AI stories"), the entry counts on the masthead and in the archive, the sentence for a weekly or monthly
   * without an overview, and "the stories sorted by section" in the subscription notes. measure is a counting word
   * placed before noun (Chinese needs a measure word there); English leaves it empty.
   */
  entry: { measure: "", noun: "stories" },
  /** What the masthead's other figures are followed by; the picks and daily issue counts read the same on the about and topic pages. */
  metricUnits: { sourcesCount: "sources", firstPartyEvents: "first-party releases", selectedCount: "picks", reportsCovered: "daily issues" },
  /** How a report's share image says "N in all". */
  shareUnit: "stories",
  /** Title and lead for a daily whose window had items judged but no new major stories. */
  quiet: { title: "A quiet day: nothing major happened", paragraph: `No new major ${withSubject("news")} between {start} and {end} (UTC+8).` },
};

/** A few phrases in operations alerts (sent only to the site owner) that vary by deployment. */
export const ALERTS = {
  /** After how many minutes without a newly collected article to alert "the site has stopped collecting new content" (at most a day); the ALERT_QUIET_MINUTES environment variable takes precedence. */
  quietMinutes: 360,
  /** When editorial sources keep fetching successfully but have no new articles, after how many minutes to alert (at most a day). */
  quietWhileFetchingMinutes: 720,
  /** In the same alert, a sentence on the usual volume added after "none"; null leaves it out. */
  usualFlow: null as string | null,
  /** In the alert that the worker has stopped, how to read its logs. */
  workerLogs: "check the worker logs (docker compose logs worker)",
};

/** Defaults when creating a source in the admin. */
export const SOURCE_DEFAULTS = {
  /** Show full text on the site; when false, show only the summary and the link to the original. */
  siteFulltext: false,
};

/**
 * Community site sources (by source id): when computing heat, each posting account counts as an independent source,
 * rather than the whole source counting as one.
 * dev is the dev.to article stream; hn is the Hacker News post stream.
 */
export const COMMUNITY_FEEDS: { dev: string[]; hn: string[] } = {
  dev: [],
  hn: [],
};

/** Text on each page's share image (/og/pages/*.png). The topics index image is generated from the number of topics. */
export const CARDS: Record<string, { kicker: string; title: string; subtitle: string; accent?: "hot" | "amber" }> = {
  site: { kicker: subjectAfter("Daily", "picks"), title: SITE.tagline, subtitle: SITE.description },
  all: { kicker: subjectAfter("All", "news"), title: "The latest from every source, in one place", subtitle: "The latest from every source in time order, filterable by category and tag." },
  hot: { kicker: "Trending", title: "What everyone has been talking about in the last 48 hours", subtitle: "Heat index, trend, and the public sources behind the heat.", accent: "hot" },
  daily: { kicker: withSubject("Daily"), title: subjectAfter(`Every day at ${spokenTime(EDITION_TIMES.daily)}, one`, "digest you can read in full"), subtitle: `${subjectAfter("The previous day's", "news")} worth your attention.` },
  weekly: { kicker: withSubject("Weekly"), title: `A week of ${REPORTS.entry.noun}, at a glance`, subtitle: "This week's main threads, key releases and discussions worth revisiting." },
  monthly: { kicker: withSubject("Monthly"), title: "A month of change", subtitle: "The month's main threads and key events in review." },
  about: { kicker: "About", title: `About ${SITE.name}`, subtitle: SITE.description },
  terms: { kicker: "Terms of Use", title: `${SITE.name} Terms of Use`, subtitle: "What the web pages, API, RSS and MCP may be used for." },
  privacy: { kicker: "Privacy", title: `${SITE.name} Privacy Notice`, subtitle: "How access logs, browser-stored data and feedback are handled." },
  changelog: { kicker: "Changelog", title: `${SITE.name} Changelog`, subtitle: "Feature updates, improvements, announcements and retirements." },
  feedback: { kicker: "Feedback", title: "Tell us what could be better", subtitle: "Content, features, integrations, or correction and takedown requests from sources." },
  agent: { kicker: "Agent access", title: `Connect ${SITE.name} to your agent`, subtitle: "MCP, RSS or API: anonymous, read-only, no API key needed." },
};

/** Parts of the public interfaces' access terms that vary by deployment: written in the usage notes for agents and llms.txt. */
export const ACCESS = {
  /** Roughly how many requests per minute one IP can make before getting a 429 with Retry-After (optional, rate-limited by the deployment's reverse proxy); null means no limit, and the notes don't mention one. */
  ratePerMinute: null as number | null,
  /** The User-Agent people syncing data with a program should send (optional), written after the JSON endpoint notes. */
  userAgent: null as string | null,
};

/** A few arrangements of this deployment (optional). */
export const DEPLOYMENT = {
  /** Default directory for the credential group files (models.env, collectors.env, ...), relative to the repository root; the AIHOT_CREDENTIALS_DIR environment variable takes precedence, and with neither only environment variables are read. */
  credentialsDir: null as string | null,
  /** File names of the credential groups (in the credentials directory, optional): groups not listed use "<group>.env", such as models.env. */
  credentialFiles: {} as Partial<Record<string, string>>,
  /** Extra credentials this deployment requires ([group, environment variable name]); checked when the production API starts. No extra requirements by default. */
  requiredSecrets: [] as const,
  /** The Host the production api receives (the domain the CDN uses to reach the origin, optional); in local development, requests the web dev server forwards to the api use it too, matching production. */
  originHost: null as string | null,
  /** When the reverse proxy sends a signed-out admin visit to log in, the request header that carries the original address (optional, to return there after login). */
  loginReturnHeader: null as string | null,
  /**
   * Traffic cap for the image proxy fetching from origin sites: past it, uncached images return 503 until the minute
   * or day is over, and using up the day's budget goes into the operations daily report; null means no cap. The
   * IMGPROXY_UPSTREAM_MB_PER_MINUTE and IMGPROXY_UPSTREAM_GB_PER_DAY environment variables take precedence.
   */
  imageUpstreamBudget: null as null | { mbPerMinute: number; gbPerDay: number },
  /**
   * Domains tested to be reached directly by the server, not through the egress proxy (EGRESS_PROXY_URL), shared by
   * collection and images (optional). Each redirect picks the route again by target domain, and direct connections
   * still check the actual address connected to.
   */
  directFetchHosts: [] as string[],
  /**
   * The gold set the selection evaluation (scripts/eval-selection.ts) uses when run without arguments: the file
   * (relative to the repository root), the sample size, which split to sample, and the threshold sweep range.
   * null uses all samples in .data/gold.jsonl (up to 200) and sweeps 40–90.
   */
  selectionGold: null as null | { file: string; sample: number; split: string; sweep: [number, number] },
};

/** Phrases in the RSS feed descriptions that vary by site. */
export const FEED_COPY = {
  /** In the "All news" feed's description, what else it leaves out besides unreviewed content, low-relevance items, low-scoring items and merged duplicates (optional). */
  allLeavesOut: [] as string[],
};

/**
 * Categories in the public interfaces (API, RSS, MCP) that differ from the website (optional). Don't change them after
 * launch: category keys appear in API parameters and feed URLs.
 * merge: categories published merged into another; the key is a category of the industry pack, the value the
 * category it's merged into (for when the public interfaces have one category fewer than the website).
 * feedLabels: names in the per-category RSS titles, replacing the industry pack's feedLabel (when a category is
 * merged into another, its name often has to change too).
 */
export const PUBLIC_CATEGORIES = {
  merge: {},
  feedLabels: {},
} as const;

/** Phrases like "AI Daily": the industry word, a space, then the noun. */
export function withSubject(noun: string): string {
  return `${SITE.subject} ${noun}`;
}

/** Phrases like "All AI news" or "Past AI dailies": the industry word after text, separated by a space; noun follows as in withSubject. */
export function subjectAfter(text: string, noun?: string): string {
  return `${text.trimEnd()} ${noun ? withSubject(noun) : SITE.subject}`;
}

/** "8 AM", "10:30 AM": HH:mm as spoken, on a 12-hour clock. */
function spokenTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${hour < 12 ? "AM" : "PM"}`;
}
