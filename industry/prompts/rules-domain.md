
[AI terminology rules: this platform covers only AI/ML/LLM industry content; follow strictly]

1. Ambiguity defaults: always read the terms below in their AI sense, and when the source is not in English, render them with these standard English AI terms:
   - LLM = large language model (never "Master of Laws")
   - Token / tokens = model tokens (never cryptocurrency tokens)
   - Transformer = the Transformer architecture (not an electrical transformer)
   - Diffusion = diffusion models (AI generation, not physical diffusion)
   - Agent / Agentic = AI agents / agentic (not a human agent, broker or intermediary)
   - Alignment = alignment (in the AI safety sense)
   - Inference = inference (running a model to generate output)
   - Reasoning = reasoning (keep it distinct from inference; use "chain-of-thought" for CoT where needed; a reasoning model means a thinking model such as o1/o3/R1)
   - Embedding = embedding (vector)
   - Distillation = knowledge distillation
   - Hallucination = model hallucination
   - Fine-tune / Fine-tuning = fine-tuning
   - Pretrain / Pretraining = pretraining
   - Context window = context window
   - Prompt = prompt
   - Skill / Skills = skills (capability packages for Claude and other agent frameworks, not a person's talents)

2. Always keep the following proper nouns exactly as officially written; do not translate, paraphrase or add glosses:
   - AI companies: OpenAI / Anthropic / Google DeepMind / xAI / Meta AI / Mistral / DeepSeek / Cohere / Hugging Face (HF) / Runway / ElevenLabs / Suno / Pika / Midjourney / Perplexity
   - Model families (examples + general rule): GPT / Claude / Gemini / Llama / Qwen / Grok / o series / DeepSeek / Mistral / Mixtral / Phi / Sora / Veo / Imagen
     **Rule**: keep every model family name and product codename as officially written
   - Model versions (examples + general rule): GPT-5 / Claude 4.7 / Claude Sonnet 4.6 / Llama 4 / Gemini 3 / o3 / o4 / DeepSeek-V4 / Qwen3.7
     **Rule**: never change a single character of a version (including letter and number suffixes such as 4o / 4.7 / 405B / V4 / R1), and never expand it (do not turn "405B" into "405 billion", and do not turn "V4" into "fourth generation")
   - Technical abbreviations (examples + general rule): LLM / RAG / RLHF / DPO / LoRA / QLoRA / PEFT / MoE / CoT / ReAct / KV cache / SOTA / AGI / MCP / ADK / NPU / GPU / TPU
     **Rule**: any all-caps abbreviation of 2–5 letters defaults to its AI/ML meaning and stays as written
   - Benchmarks (examples + general rule): MMLU / GPQA / HumanEval / SWE-bench / SWE-bench Verified / AIME / HLE / ARC-AGI / ARC-AGI 2 / MT-Bench / Chatbot Arena / Aider Polyglot / LiveCodeBench
     **Rule**: benchmark names ending in -bench / -eval, or written in all caps, stay as written
   - AI tools/products: Cursor / Copilot / Codex / Aider / Devin / Cline / Claude Code / Windsurf / Zed / v0 / Bolt / Lovable / Replit Agent
   - Agent frameworks: LangChain / LangGraph / LlamaIndex / CrewAI / AutoGen / Pydantic AI / Vercel AI SDK / DSPy
   - Inference/deployment: Ollama / vLLM / SGLang / TensorRT / Triton / CUDA / ROCm
   - General tech: API / SDK / CLI / IDE / SaaS / CDN / SSO / OAuth / JWT / WebSocket / SSE / gRPC

3. For vendors outside the English-speaking world, use their official English brand names (on first mention you may pair the company and the product, such as "Alibaba's Qwen3"; afterwards pick one form and stay consistent):
   - Qwen (Alibaba) / ERNIE (Baidu) / GLM (Zhipu AI, Z.ai) / Kimi (Moonshot AI) / DeepSeek / Step (StepFun) / Yi (01.AI) / Baichuan / Doubao (ByteDance) / Hunyuan (Tencent) / Kling (Kuaishou) / Jimeng (ByteDance) / MiniMax / LongCat (Meituan) / Skywork (Kunlun Tech) / MiniCPM (ModelBest) / Ascend (Huawei) / Cambricon

4. Keep code / commands / URLs / numbers with units **exactly as written**:
   - Backticked code `code` is not rewritten
   - Commands such as /code-review, pip install, npm run are not paraphrased (do not turn /code-review into "code review")
   - URLs stay as they are
   - Numbers with units: 8k context / 175B params / 3.5x speedup / $3 per M tokens / 99.9%
   - Amounts, parameter counts, ratios and ranges must keep the source's digits and units; do not rewrite $10B-$100B as words such as "tens to hundreds of billions of dollars"
