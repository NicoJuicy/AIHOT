// The engine's ways in, one panel each: what it is for, the steps to connect, then the details folded away.
// Addresses are the site's configured public address (`base`); what visitors copy carries the site's tag
// (CopyTag) when it has one.
import { Fragment, useState } from "react";
import { Link } from "react-router";
import { PUBLIC_INTERFACE_VERSION } from "@aihot/contracts/http-policy";
import { MCP_TOOL_NAMES as T, MCP_TOOLS } from "@aihot/contracts/mcp";
import { feedCategoryLabel, PUBLIC_API_CATEGORY_KEYS } from "@aihot/contracts/taxonomy";
import { ACCESS, AGENT, EDITION_TIMES, EDITION_WHEN, POLICY, REPORTS, SITE, subjectAfter, withSubject } from "@aihot/site";
import { CodeBlock, CopyButton } from "./CodeBlock";
import { PillTabs } from "../../components/ui/Tabs";
import type { AgentPanelProps } from "../../modules";
import { AGENT_PARTS, GUIDE_CLIENTS, TAG } from "./module-parts";
import { Address, Ask, Block, Bullets, Details, Mono, PanelHead, Step, Steps, Table, Tips } from "./parts";

const V = PUBLIC_INTERFACE_VERSION;

/** Every MCP tool: the engine's and the modules'. */
export const mcpToolCount = () => MCP_TOOLS.length + AGENT_PARTS.reduce((n, a) => n + (a.tools?.length ?? 0), 0);
const link = "text-accent hover:underline";

/** An address on this site as the copy buttons copy it, with the tag. */
function addressOf({ base, tag }: AgentPanelProps, path: string): string {
  return TAG && tag ? `${base}${path}?${TAG.query}=${tag}` : `${base}${path}`;
}

const MCP_CLIENTS = [
  { key: "claude", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "json", label: "JSON config" },
  { key: "other", label: "Other clients" },
] as const;

export function McpPanel(props: AgentPanelProps) {
  const url = addressOf(props, "/api/mcp");
  const name = SITE.mcpPrefix;
  const [client, setClient] = useState<string>("claude");
  return (
    <>
      <PanelHead label={`MCP · ${V}`} title={`Add one address, give your agent ${mcpToolCount()} new tools`}>
        Standard Streamable HTTP: anonymous and read-only, with no token, and it never reads your login state. Works with clients that support remote MCP, such as Claude Desktop, Cursor and Cherry Studio.
      </PanelHead>
      <Steps>
        <Step n={1} title="Copy the server address">
          <Address url={url} />
          {TAG && <p className="mt-2 text-[13px] text-ink-3">{TAG.mcp}</p>}
        </Step>
        <Step n={2} title="Add it to your client">
          <PillTabs className="mt-3" size="xs" layoutId="agent-mcp-client" label="Client" active={client} onSelect={setClient} items={MCP_CLIENTS.map((c) => ({ key: c.key, label: c.label }))} />
          {client === "claude" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`claude mcp add --transport http ${name} '${url}'`} />}
          {client === "codex" && <CodeBlock className="mb-0 mt-3" lang="bash" code={`codex mcp add ${name} --url '${url}'`} />}
          {client === "json" && <CodeBlock className="mb-0 mt-3" title="Cursor, Cherry Studio and other clients configured with JSON" lang="json" code={JSON.stringify({ mcpServers: { [name]: { type: "http", url } } }, null, 2)} />}
          {client === "other" && <p className="mt-3">{`Add a new entry in your client's MCP or connector settings: name it ${name}, use the address above, set authentication to "None" and leave the API key empty. For clients that only run local commands, go through their built-in remote MCP proxy.`}</p>}
        </Step>
        <Step n={3} title="Have your agent call it once">
          <Ask text={`Call ${T.latest} and tell me the ${subjectAfter("5 most important", "stories")} from the last 24 hours, with ${SITE.name} links.`} />
          <p className="mt-2 text-[13px] text-ink-3">{`If the client shows a call to ${T.latest} and the answer has a time range, summaries and ${new URL(props.base).host} links, you're connected.`}</p>
        </Step>
      </Steps>

      <Block title={`${mcpToolCount()} tools`}>
        <Table
          head={["Tool", "What it does", "Try asking"]}
          minWidth={600}
          rows={[
            [<Mono>{T.latest}</Mono>, "Picks or all news from the last 24 hours or the last 7 days", `What's new in ${SITE.subject} today?`],
            [<Mono>{T.search}</Mono>, AGENT.search.scope, AGENT.search.ask],
            [<Mono>{T.hot}</Mono>, "The current top 10 trending stories", "What's trending right now?"],
            [<Mono>{T.story}</Mono>, "A trending story's timeline and its running overview", "How did this story unfold?"],
            [<Mono>{T.daily}</Mono>, `The latest ${withSubject("Daily")}, or the one for a given date`, "Give me today's daily."],
            [<Mono>{T.weekly}</Mono>, `The latest ${withSubject("Weekly")}, or the one for a given week`, `What were the big ${withSubject("stories")} this week?`],
            [<Mono>{T.monthly}</Mono>, `The latest ${withSubject("Monthly")}, or the one for a given month`, `What happened in ${SITE.subject} last month?`],
            ...AGENT_PARTS.flatMap((a) => a.tools ?? []).map((t) => [<Mono>{t.name}</Mono>, t.does, t.ask]),
          ]}
        />
      </Block>

      <Details
        items={[
          {
            title: "Limits and safety",
            body: (
              <Bullets items={[
                "Regular queries return at most 30 items, trending at most 10 and a story timeline at most 50; out-of-range requests fail with a clear error instead of being quietly widened.",
                `The public_id for ${T.story} must come from a story link the trending tool returned; don't guess IDs.`,
                "Titles and summaries come from outside sources and are reference material only; the tools mark this safety boundary. Check important figures, policies and quotes against the original.",
              ]} />
            ),
          },
          {
            title: "Can't connect?",
            body: (
              <Bullets items={[
                "First check that the address is complete and that your client supports remote Streamable HTTP; if new tools are missing, refresh the tool list or reconnect.",
                ...AGENT_PARTS.flatMap((a) => a.mcpTroubles ?? []),
                'The server needs no sign-in; if your client asks for OAuth or an API key, choose "None".',
                "On a 429, wait as instructed and don't retry in parallel.",
                <>Still stuck? Send your client's name, version and the error through the <Link viewTransition to="/feedback" className={link}>feedback page</Link>.</>,
              ]} />
            ),
          },
        ]}
      />
    </>
  );
}

const FEEDS = [
  { name: "Picks (summaries)", badge: "Recommended", path: "/feed.xml", desc: "The latest 50 picks, with titles, summaries, and links to read them here and to the original." },
  { name: "Picks (full text)", path: "/feed/full.xml", desc: "The same 50 items, with full text where the source allows republishing and summaries otherwise." },
  { name: subjectAfter("All", "news"), path: "/feed/all.xml", desc: "Everything public from the last 7 days, newest first by original publish time." },
  { name: withSubject("Daily"), path: "/feed/daily.xml", desc: `${EDITION_WHEN.daily} (UTC+8): the lead story plus the issue's full contents, keeping the last 30 issues.` },
  { name: withSubject("Weekly"), path: "/feed/weekly.xml", desc: `${EDITION_WHEN.weekly} (UTC+8): an overview plus the ${REPORTS.entry.noun} sorted by section, keeping the last 12 issues.` },
  { name: withSubject("Monthly"), path: "/feed/monthly.xml", desc: `${EDITION_WHEN.monthly} (UTC+8): an overview plus the ${REPORTS.entry.noun} sorted by section, keeping the last 12 issues.` },
];

/** The category feeds, under the names the feeds themselves use. */
const FEED_CATEGORIES = PUBLIC_API_CATEGORY_KEYS.map((key) => [key, feedCategoryLabel(key)] as const);

export function RssPanel(props: AgentPanelProps) {
  const { base } = props;
  const lead = `${["Works with any mainstream RSS 2.0 reader and with automation tools such as n8n and Zapier. The addresses don't change", ...AGENT_PARTS.flatMap((a) => a.rssLead ?? [])].join("; ")}.`;
  return (
    <>
      <PanelHead label="RSS" title="Copy an address and subscribe in your reader">
        {lead}
      </PanelHead>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEEDS.map((f) => (
          <div key={f.path} className="card flex flex-col p-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{f.name}</span>
              {f.badge && <span className="inline-flex h-[18px] items-center rounded-full bg-accent-soft px-2 text-[11px] font-medium text-accent">{f.badge}</span>}
            </div>
            <p className="mt-1 flex-1 text-[13px] leading-[1.7] text-ink-3">{f.desc}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
              <code className="mono min-w-0 flex-1 truncate text-[12px] text-ink-4">{base}{f.path}</code>
              <CopyButton text={addressOf(props, f.path)} label="Copy address" className="shrink-0" />
            </div>
          </div>
        ))}
      </div>
      {TAG && <p className="mt-3 text-[12.5px] text-ink-4">{TAG.rss}</p>}

      <Block title="Subscribe by category">
        <Table
          head={["Category", "Summaries", "Full text"]}
          minWidth={420}
          rows={FEED_CATEGORIES.map(([slug, label]) => [
            <span className="font-medium text-ink">{label}</span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
            <span className="inline-flex items-center gap-2"><Mono>{`/feed/full/category/${slug}.xml`}</Mono><CopyButton text={addressOf(props, `/feed/full/category/${slug}.xml`)} className="!h-6 !px-1.5" /></span>,
          ])}
        />
      </Block>

      <Block title="How often to refresh">
        <p>Readers send the last ETag, and when nothing has changed they get a tiny 304 instead of downloading the feed again. Refreshing every 30 minutes is enough; refreshing faster won't get you anything newer.</p>
        <p className="mt-3 text-[13px] text-ink-3">{`Item links go to the reading page on this site; the link to the original is in the summary. Being able to subscribe anonymously doesn't mean every use is permitted${POLICY.terms.notes ? `: ${POLICY.terms.notes.rss}` : ""}; see the `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>
    </>
  );
}

const RECIPES = [
  { key: "latest", label: "Follow the latest" },
  { key: "sync", label: "Sync all picks" },
];

export function ApiPanel(props: AgentPanelProps) {
  const { base, tag } = props;
  const userAgent = [ACCESS.userAgent, TAG && tag ? TAG.userAgent(tag) : null].filter(Boolean).join(" ");
  const curl = `curl --compressed${userAgent ? ` -A '${userAgent}'` : ""}`;
  let pace = `How often things change: new items arrive throughout the day, the picks change anywhere from a few to a few dozen times a day, and the reports come out once per period: the daily at ${EDITION_TIMES.daily}, the weekly on Mondays at ${EDITION_TIMES.weekly} and the monthly on the 1st at ${EDITION_TIMES.monthly} (UTC+8).`;
  if (ACCESS.ratePerMinute) pace += ` More than about ${ACCESS.ratePerMinute} requests a minute from one IP get a 429; wait as Retry-After says and don't retry in parallel.`;
  const [recipe, setRecipe] = useState<string>("latest");
  const recipes = AGENT_PARTS.flatMap((a) => a.recipes ?? []);
  const items = `${base}/api/v1/items?mode=selected&window=24h&limit=20`;
  return (
    <>
      <PanelHead label={`REST API · ${V}`} title="Anonymous GET, ready to use">
        No token needed: cross-origin browser requests, curl and the default HTTP client of any language all work. Paths are under /api/v1; the <a href="/openapi-v1.json" className={link}>OpenAPI</a> file is the reference for fields and error codes.
      </PanelHead>
      <CodeBlock className="mt-6" title="Your first request" lang="bash" code={`${curl} '${items}'`} />

      <Block title="Filter by category">
        <p>Add <Mono>category</Mono> to an items request to get only that category; leave it out to get every category. The <Mono>category</Mono> of returned items uses the values in this table too.</p>
        <Table head={["Category", "Parameter"]} rows={FEED_CATEGORIES.map(([key, name]) => [name, <Mono>{`category=${key}`}</Mono>])} />
      </Block>

      <Block title="Use less, go faster">
        <Tips
          items={[
            { title: "Turn on compression", text: <>Add <Mono>--compressed</Mono> to curl, or turn on gzip or br in other clients. Compressed JSON is 1/4 to 1/8 of its original size.</> },
            { title: "Send the ETag", text: <>Save the ETag from the response and send it next time as <Mono>If-None-Match</Mono>; when nothing has changed you get a 304 with no body.</> },
            { title: "Fetch on schedule", text: `Items and trending at most once a minute; the daily once after ${EDITION_TIMES.daily} (UTC+8), the weekly and monthly once after each issue comes out; when paging back, stop at the first item you already have.` },
          ]}
        />
        <p className="mt-3 text-[13px] leading-[1.75] text-ink-3">{pace}</p>
      </Block>

      <Block title="All endpoints">
        <Table
          head={["Path", "What it's for", "How often"]}
          minWidth={640}
          rows={[
            { group: "Items" },
            [<Mono>/api/v1/items</Mono>, "Picks, or everything from the last 7 days; filter by category, time window and keyword", "At most once a minute"],
            { group: "Trending and stories" },
            [<Mono>/api/v1/hot-topics</Mono>, "The current top 10 trending stories", "At most once a minute"],
            [<Mono>{"/api/v1/stories/{publicId}"}</Mono>, "A story's coverage timeline, AI overview and related stories", "When needed"],
            { group: "Daily" },
            [<Mono>/api/v1/dailies/latest</Mono>, "The latest daily", `Once, after ${EDITION_TIMES.daily} (UTC+8)`],
            [<Mono>{"/api/v1/dailies/{date}"}</Mono>, "The daily for a given date; retractions remove their references", "Revalidate the ETag once the cache expires"],
            [<Mono>/api/v1/dailies</Mono>, "Index of daily dates", "Once a day"],
            { group: "Weekly and monthly" },
            [<Mono>/api/v1/weeklies/latest</Mono>, "The latest weekly: lead story, overview and the week's highlights by section", `Once, after Mondays at ${EDITION_TIMES.weekly} (UTC+8)`],
            [<Mono>{"/api/v1/weeklies/{week}"}</Mono>, "A given ISO week, such as 2026-W39; retractions remove their references", "Revalidate the ETag once the cache expires"],
            [<Mono>/api/v1/weeklies</Mono>, "Index of weeklies", "Once a week"],
            [<Mono>/api/v1/monthlies/latest</Mono>, "The latest monthly", `Once, after the 1st at ${EDITION_TIMES.monthly} (UTC+8)`],
            [<Mono>{"/api/v1/monthlies/{month}"}</Mono>, "A given month, such as 2026-09", "Revalidate the ETag once the cache expires"],
            [<Mono>/api/v1/monthlies</Mono>, "Index of monthlies", "Once a month"],
            ...AGENT_PARTS.flatMap((a) => (a.api ? [{ group: a.api.group }, ...a.api.rows.map(([path, does, often]) => [<Mono>{path}</Mono>, does, often])] : [])),
            { group: "For AI assistants" },
            [<Mono>/api/v1/agent</Mono>, `Usage notes for agents; the addresses it lists return ready-to-read Markdown${GUIDE_CLIENTS ? `, which ${GUIDE_CLIENTS} use` : ""}`, "When needed"],
            { group: "Full picks sync" },
            [<Mono>/api/v1/selected/snapshot</Mono>, "Every current pick, paged, to fetch everything once", "Only the first time"],
            [<Mono>/api/v1/selected/changes</Mono>, "Additions, edits and removals since then", "Every few minutes"],
          ]}
        />
      </Block>

      <Block title="Common recipes">
        <PillTabs size="xs" layoutId="agent-api-recipe" label="Recipe" active={recipe} onSelect={setRecipe} items={[...RECIPES, ...recipes].map((r) => ({ key: r.key, label: r.label }))} />
        {recipe === "latest" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# First time: save the ETag from the response headers\n${curl} -i '${items}'\n# Then at most once a minute, with the ETag; a 304 means nothing changed\n${curl} -i -H 'If-None-Match: <last ETag>' '${items}'`} />
            <p>To page back, pass <Mono>page.nextCursor</Mono> back as cursor and stop at the first item you already have; don't re-read all 7 days every time.</p>
          </>
        )}
        {recipe === "sync" && (
          <>
            <CodeBlock className="mb-3 mt-3" lang="bash" code={`# First time: page through everything. Save the cursor from the first page's response (it's the same on every page)\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500'\n# While hasMore is true, pass nextPage to keep going until done\n${curl} '${base}/api/v1/selected/snapshot?fields=minimal&limit=500&page=<nextPage of the previous page>'\n# After that: pass the cursor back as is to get only additions, edits and removals\n${curl} '${base}/api/v1/selected/changes?cursor=<cursor of the first page>&limit=100'`} />
            <p>Save the new cursor only after each page is safely stored locally. The cursor marks a position in the change log and never expires; on a 409 <Mono>snapshot_required</Mono>, take a fresh snapshot, so nothing is silently missed.</p>
          </>
        )}
        {recipes.map((r) => recipe === r.key && <r.Body key={r.key} base={base} curl={curl} />)}
      </Block>

      <Block title="When something goes wrong" id="agent-api-recovery">
        <dl className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
          <dt className="mono text-[13px] text-ink">400</dt>
          <dd>Bad parameters: fix them using the OpenAPI file and the returned code; don't fall back to a broader query automatically. A cursor that is invalid or has slid out of the time window returns invalid_cursor: start again from the first page.</dd>
          <dt className="mono text-[13px] text-ink">409</dt>
          <dd>snapshot_required: the changes can't be resumed safely; take a fresh full snapshot.</dd>
          <dt className="mono text-[13px] text-ink">429</dt>
          <dd>Too many requests: wait as Retry-After says and don't retry in parallel.</dd>
          <dt className="mono text-[13px] text-ink">5xx</dt>
          <dd>Back off exponentially and use the last successful result meanwhile; the public service has no SLA.</dd>
          {AGENT_PARTS.flatMap((a) => a.apiErrors ?? []).map(([status, what]) => (
            <Fragment key={status}>
              <dt className="mono text-[13px] text-ink">{status}</dt>
              <dd>{what}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-4 text-[13px] text-ink-3">{`Being able to call it anonymously doesn't mean every use is permitted${POLICY.terms.notes ? `: ${POLICY.terms.notes.api}` : ""}; see the `}<Link viewTransition to="/terms" className={link}>{POLICY.terms.name}</Link>.</p>
      </Block>

    </>
  );
}
