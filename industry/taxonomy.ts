// This industry's classification: categories, tag vocabularies, the directory of companies (subjects), and the
// identity lexicon that keeps companies from being mixed up.
// The model tags items from the vocabularies here, the topics (topics.json) group items by tag, and the filter bar groups by category.
// When switching industries: a category key appears in URLs (/all?category=…), so do not change it after launch; tags and the directory can change at any time.

/**
 * Categories on the site (filter bar, card badges, per-category RSS). The key is the identity in URLs and APIs; do not change it after launch.
 * section is the section heading in the daily report (several categories can share one section, ordered as here); guide tells the
 * structure extraction model what this category holds and where its border with neighboring categories lies (the general
 * classification principles are in prompts/structure.md).
 * commentary marks commentary categories (tutorials, opinions): when the daily report already covered something and a commentary
 * follow-up arrives, it takes only a one-line brief (unless enough sources report it).
 * Items without a category go, in the daily report, into the section of the first category whose key is industry (or the last section if there is none).
 * tagColor is the color of this category's small tag after the title in Feishu push cards (a Feishu text_tag color name).
 * feedLabel is the name in the category RSS title (label when absent). To publish one category merged into another in the public API,
 * RSS and MCP, set it in the site settings (PUBLIC_CATEGORIES in site/site.ts).
 */
export const CATEGORIES = [
  { key: "ai-models", tagColor: "indigo", label: "Models", feedLabel: "AI Models", section: "Model Releases & Updates", guide: "Releases, versions, opened weights, capability or price changes of models themselves, and models' results on existing leaderboards. Publishing one benchmark run is not releasing a new benchmark, nor a tutorial." },
  { key: "ai-products", tagColor: "turquoise", label: "Products", feedLabel: "AI Products", section: "Product Launches & Updates", guide: "Launches and updates of usable AI products, features, apps, tools, APIs, platforms and engineering components. Inference frameworks, kernel libraries and hardware adaptation components released by model vendors are still products; do not file them under models because of the vendor's name." },
  { key: "industry", tagColor: "orange", label: "Industry", feedLabel: "Industry News", section: "Industry News", guide: "Company operations, funding and M&A, personnel, partnerships, litigation, policy, real safety incidents and the progress of their investigations that have already happened. News posted by the party involved, even with an attitude, does not become opinion because of that." },
  { key: "paper", tagColor: "violet", label: "Papers", feedLabel: "Papers", section: "Research Papers", guide: "Papers, technical reports, new benchmarks or research datasets centered on new research methods, experimental designs and findings. Systematic red-teaming experiments are research; results on existing leaderboards go to models, and news investigations of real incidents go to industry." },
  { key: "tip", tagColor: "green", label: "Tutorials", section: "Tips & Opinions", guide: "Methods, prompts, tool usage, engineering retrospectives and technical explainers that readers can follow. The focus is a reusable practice; a plain tool launch goes to products, and attitudes and predictions without a practice go to opinions.", commentary: true },
  { key: "opinion", tagColor: "purple", label: "Opinions", section: "Tips & Opinions", guide: "The focus is the author's explanation, judgment, argument, prediction, commentary or interview views. Discussing the market does not automatically make it industry, and a famous author does not automatically make it opinion.", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * The kind of release this industry watches most (new models in AI): the daily report's masthead "N new models" and the revision of
 * published reports after a reclassification both count it. category is the category and tag is the tag; both must match. unit follows the number.
 * Industries without such a kind set this to null, and the masthead does not show the figure.
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "ai-models", tag: "Model Release", unit: "new models" };

/** Industry-wide terms (lowercase) that weekly and monthly overviews may use without finding them in the reports. The site name is added automatically. */
export const PLAIN_TERMS: readonly string[] = ["ai", "api", "llm", "gpu", "agi", "ceo", "ipo"];

/**
 * The "content type" the content understanding step assigns to each item (written in prompts/content-understanding.md; change that
 * prompt along with the types). The scoring prompt (prompts/selection-score.md) weights the five dimensions differently per type.
 */
export const ITEM_TYPES = ["model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;

// ── Tag vocabularies ────────────────────────────────────────────────────────────────────

/** Every item's first tag must be one of these "category tags". */
export const CATEGORY_TAGS = [
  "Product Update", "Model Release", "Paper/Research", "Open Source/Repo", "Tutorial/How-to", "Trends", "Expert Opinion", "Eval/Benchmark", "Safety/Alignment", "Industry News", "Policy/Regulation",
  "Non-AI/General Tool", "Other",
] as const;

/** Optional topic tags. */
export const TOPIC_TAGS = [
  "Agent", "Coding", "Reasoning", "Multimodal", "Voice", "Video", "Image Generation", "RAG", "On-device", "Data/Training", "Search", "Deployment/Engineering", "Open-source Ecosystem", "Embodied AI", "MCP/Tool Use",
] as const;

/** Optional entity tags (companies, organizations, platforms). */
export const ENTITY_TAGS = ["OpenAI", "Anthropic", "DeepSeek", "DeepMind", "Google", "Meta", "Microsoft", "xAI", "Hugging Face", "GitHub", "arXiv"] as const;

/** Synonyms the model often writes, mapped to the vocabulary's spelling; every tag also matches in lowercase. */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  ...Object.fromEntries([...CATEGORY_TAGS, ...TOPIC_TAGS, ...ENTITY_TAGS].map((t) => [t.toLowerCase(), t])),
  "tutorial/practice": "Tutorial/How-to", "tips/best practices": "Tutorial/How-to", "partnership/ecosystem": "Industry News", "funding/acquisition": "Industry News", "company news": "Industry News",
  partnership: "Industry News", ecosystem: "Industry News", funding: "Industry News", acquisition: "Industry News", investment: "Industry News", "m&a": "Industry News",
  policy: "Policy/Regulation", regulation: "Policy/Regulation", law: "Policy/Regulation", safety: "Safety/Alignment", alignment: "Safety/Alignment",
  paper: "Paper/Research", research: "Paper/Research", papers: "Paper/Research",
  "open-source": "Open Source/Repo", "open source": "Open Source/Repo", repository: "Open Source/Repo", repo: "Open Source/Repo",
  tutorial: "Tutorial/How-to", "how-to": "Tutorial/How-to", guide: "Tutorial/How-to", tips: "Tutorial/How-to", "best practices": "Tutorial/How-to", practice: "Tutorial/How-to",
  product: "Product Update", update: "Product Update", release: "Model Release", model: "Model Release", trend: "Trends", phenomenon: "Trends", opinion: "Expert Opinion",
  benchmark: "Eval/Benchmark", eval: "Eval/Benchmark", evaluation: "Eval/Benchmark",
  "video generation": "Video", "non-ai": "Non-AI/General Tool", "general tool": "Non-AI/General Tool", "engineering tool": "Non-AI/General Tool",
  "security scanning": "Non-AI/General Tool", devops: "Non-AI/General Tool", industry: "Industry News", news: "Industry News",
};

// ── Companies and subjects ──────────────────────────────────────────────────────────────

/**
 * Company topics: id → display name, the tag shown on cards (null means grouped only by entity:<id>), aliases.
 * aliases are shown to the structure extraction model; orgNames are the organization names (company, lab, team) this company opens
 * its posts with, which can be dropped on its own topic page because readers know who is meant; otherNames are the company's other
 * names (official account names, sub-brands). All these names are used to recognize which company is meant, for example to match a fact's subject to the publisher.
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  "world-labs": { name: "World Labs", displayTag: null, aliases: ["World Labs"] },
  "thinking-machines": { name: "Thinking Machines Lab", displayTag: null, aliases: ["Thinking Machines"] },
  amd: { name: "AMD", displayTag: null, aliases: ["AMD", "Advanced Micro Devices"] },
  openai: { name: "OpenAI", displayTag: "OpenAI", aliases: ["OpenAI", "ChatGPT", "Sora", "Codex", "GPT"], orgNames: ["OpenAI"], otherNames: ["OpenAI Developers"] },
  anthropic: { name: "Anthropic", displayTag: "Anthropic", aliases: ["Anthropic", "Claude"], orgNames: ["Anthropic"], otherNames: ["Claude Code"] },
  google: { name: "Google", displayTag: "Google", aliases: ["Google", "DeepMind", "Gemini"], orgNames: ["Google DeepMind", "Google Research", "Google", "DeepMind"], otherNames: ["Google AI", "Google Labs", "Google Cloud"] },
  deepseek: { name: "DeepSeek", displayTag: "DeepSeek", aliases: ["DeepSeek"], orgNames: ["DeepSeek"] },
  qwen: { name: "Qwen", displayTag: null, aliases: ["Qwen", "Tongyi", "Alibaba"], orgNames: ["Tongyi Qianwen", "Tongyi Lab", "Alibaba Group", "Alibaba Cloud", "Alibaba", "Qwen Team", "Qwen"], otherNames: ["Qwen App"] },
  kimi: { name: "Moonshot AI / Kimi", displayTag: null, aliases: ["Kimi", "Moonshot AI", "Moonshot", "Kimi / Moonshot AI"], orgNames: ["Moonshot AI", "Kimi"] },
  minimax: { name: "MiniMax", displayTag: null, aliases: ["MiniMax", "Hailuo"], orgNames: ["MiniMax"] },
  zhipu: { name: "Zhipu GLM", displayTag: null, aliases: ["Zhipu", "GLM", "Z.ai"], orgNames: ["Zhipu AI", "Zhipu", "Z.ai"] },
  xai: { name: "xAI", displayTag: "xAI", aliases: ["xAI", "Grok"], orgNames: ["SpaceX Super Intelligence", "SpaceXAI", "SpaceXSI", "xAI"], otherNames: ["Grok Bot"] },
  meta: { name: "Meta", displayTag: "Meta", aliases: ["Meta", "Llama"], orgNames: ["Meta Superintelligence Labs", "Meta AI", "Meta"], otherNames: ["AI at Meta", "Muse"] },
  microsoft: { name: "Microsoft", displayTag: "Microsoft", aliases: ["Microsoft", "Copilot"], orgNames: ["Microsoft Research", "Microsoft AI", "Microsoft"] },
  nvidia: { name: "NVIDIA", displayTag: null, aliases: ["NVIDIA"], orgNames: ["NVIDIA"] },
  "hugging-face": { name: "Hugging Face", displayTag: "Hugging Face", aliases: ["Hugging Face"], orgNames: ["Hugging Face", "HuggingFace"] },
  cursor: { name: "Cursor", displayTag: null, aliases: ["Cursor", "Anysphere"], orgNames: ["Cursor"] },
  openrouter: { name: "OpenRouter", displayTag: null, aliases: ["OpenRouter"], orgNames: ["OpenRouter"] },
};

/**
 * Identity lexicon: a company that appears in a summary or title must also appear in the source; otherwise the original title is kept
 * and the summary is dropped (so the model cannot mix companies up). An industry without this problem can leave the array empty.
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "openai", name: "OpenAI", patterns: [/openai|chatgpt|\bgpt-?[o\d]|\bsora\b|\bcodex\b/i] },
  { id: "anthropic", name: "Anthropic", patterns: [/anthropic|\bclaude\b/i, /\b(?:opus|sonnet|haiku)\s*\d+(?:[.\-]\d+)*\b/i, /\bfable\s*\d+(?:[.\-]\d+)*\b|\bmythos\b/i] },
  { id: "google", name: "Google / Gemini", patterns: [/google|deepmind|\bgemini\b|notebooklm|\bveo\s?\d|\bAlphaFold\b|\bAMIE\b/i] },
  { id: "deepseek", name: "DeepSeek", patterns: [/deepseek/i] },
  { id: "xai", name: "xAI / Grok", patterns: [/\bxai\b|\bgrok\b/i] },
  { id: "meta", name: "Meta / Llama", patterns: [/\bMeta\b/, /\bmeta\s?ai\b|\bllama\b/i] },
  { id: "microsoft", name: "Microsoft / Copilot", patterns: [/microsoft|copilot/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/nvidia|\bnemotron\b|\bnemo\b|\bblackwell\b|\brubin(?:\s+ultra)?\b|\bcuda\b/i] },
  { id: "qwen", name: "Qwen", patterns: [/\bqwen|\btongyi\b/i] },
  { id: "hugging-face", name: "Hugging Face", patterns: [/hugging\s?face/i] },
  { id: "cursor", name: "Cursor", patterns: [/\bCursor\b/] },
  { id: "kimi", name: "Moonshot AI / Kimi", patterns: [/\bkimi\b|\bmoonshot\s?ai\b/i] },
  { id: "openrouter", name: "OpenRouter", patterns: [/openrouter/i] },
  { id: "minimax", name: "MiniMax", patterns: [/minimax/i] },
  { id: "zhipu", name: "Zhipu GLM", patterns: [/\bzhipu\b|\bglm-?[4-9]/i] },
  { id: "hunyuan", name: "Tencent Hunyuan", patterns: [/hunyuan/i] },
  { id: "doubao", name: "ByteDance Doubao", patterns: [/doubao|bytedance/i] },
  { id: "mistral", name: "Mistral", patterns: [/mistral/i] },
  { id: "perplexity", name: "Perplexity", patterns: [/\bPerplexity\b/] },
  { id: "runway", name: "Runway", patterns: [/\brunway\b/i] },
  { id: "suno", name: "Suno", patterns: [/\bsuno\b/i] },
  { id: "midjourney", name: "Midjourney", patterns: [/midjourney/i] },
  { id: "stability-ai", name: "Stability AI", patterns: [/stability\s?ai/i] },
  { id: "elevenlabs", name: "ElevenLabs", patterns: [/eleven\s?labs/i] },
  { id: "vllm", name: "vLLM", patterns: [/\bvllm\b/i] },
  { id: "ollama", name: "Ollama", patterns: [/\bollama\b/i] },
  { id: "windsurf", name: "Windsurf", patterns: [/windsurf/i] },
  { id: "devin", name: "Devin", patterns: [/\bdevin\b/i] },
  { id: "manus", name: "Manus", patterns: [/\bmanus\b/i] },
  { id: "apple", name: "Apple AI", patterns: [/\bapple\s?(intelligence|silicon|ai)\b/i] },
  { id: "amazon", name: "Amazon / AWS", patterns: [/amazon|\baws\b/i] },
  { id: "baidu", name: "Baidu ERNIE", patterns: [/baidu|\bernie\s?bot\b/i] },
];

/** Articles on these domains are published by the matching company (hosting platforms such as GitHub and arXiv do not count). */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "openai", domains: ["openai.com"] },
  { entityId: "anthropic", domains: ["anthropic.com", "claude.com"] },
  { entityId: "google", domains: ["deepmind.google", "ai.google", "blog.google"] },
  { entityId: "deepseek", domains: ["deepseek.com"] },
  { entityId: "xai", domains: ["x.ai"] },
  { entityId: "meta", domains: ["ai.meta.com"] },
  { entityId: "microsoft", domains: ["microsoft.com"] },
  { entityId: "nvidia", domains: ["nvidia.com"] },
  { entityId: "qwen", domains: ["qwen.ai"] },
  { entityId: "cursor", domains: ["cursor.com"] },
  { entityId: "openrouter", domains: ["openrouter.ai"] },
];

/** These spellings in the source also count as mentioning the matching company. */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "meta", pattern: /@AIatMeta\b/i },
  { entityId: "zhipu", pattern: /\bZhipu(?:\s+AI\b|['’]s\b)/i },
];
