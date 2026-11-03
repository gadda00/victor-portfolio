export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  tagClass: "ai" | "engineering" | "research" | "agri";
  date: string;
  readTime: string;
  wordCount: number;
  tags: string[];
  ogImage?: string;
};

export const posts: Post[] = [
  {
    slug: "state-of-ai-october-2026",
    title: "The State of AI, October 2026: Capability Stopped Being the Bottleneck",
    excerpt:
      "The frontier is a three-lab race decided by 2.7%, benchmarks built for years are saturating in months, and the bottleneck has moved from \u201ccan AI do it?\u201d to \u201ccan we trust, power and govern it?\u201d",
    tag: "AI",
    tagClass: "ai",
    date: "2026-10-30",
    readTime: "8 min",
    wordCount: 1636,
    tags: ["state of AI", "AI Index 2026", "frontier models", "AI agents", "AI regulation", "EU AI Act"],
    ogImage: "/og/og-state-of-ai-october-2026.png",
  },
  {
    slug: "agents-in-production-2026",
    title: "Agents in Production: Notes from the 2026 Hype Cycle",
    excerpt:
      "OSWorld says agents complete two-thirds of computer tasks now — and still fail one in three. What a year of shipping Keja AI, Tapi Learn and AgentReplay taught me about reliability, context and the economics of the agent era.",
    tag: "Engineering",
    tagClass: "engineering",
    date: "2026-10-30",
    readTime: "6 min",
    wordCount: 1251,
    tags: ["AI agents", "production AI", "reliability", "evals", "AgentReplay", "Keja AI"],
    ogImage: "/og/og-agents-in-production-2026.png",
  },
  {
    slug: "africa-ai-view-from-nairobi",
    title: "The View from Nairobi: Africa Is Not Waiting for AI",
    excerpt:
      "Talent pipelines with 63,000+ applications, a national AI strategy with real dates, and products shipping in Swahili and French — the AI story the global discourse keeps missing, from where I sit.",
    tag: "Research",
    tagClass: "research",
    date: "2026-10-30",
    readTime: "6 min",
    wordCount: 1268,
    tags: ["Kenya", "Africa", "AI talent", "multilingual AI", "AI policy", "Nairobi"],
    ogImage: "/og/og-africa-ai-view-from-nairobi.png",
  },
  {
    slug: "agentreplay-deterministic-replay",
    title: "AgentReplay: Deterministic Replay and Counterfactual Debugging for AI Agent Reliability",
    excerpt:
      "A research-backed whitepaper on AgentReplay — an open-source deterministic replay and counterfactual debugging layer for AI agents. Bit-exact replay with zero model calls. 0.67% overhead, 100% reproduction fidelity.",
    tag: "Research",
    tagClass: "research",
    date: "2026-07-12",
    readTime: "18 min",
    wordCount: 3459,
    tags: ["AgentReplay", "AI agents", "deterministic replay", "counterfactual debugging", "LangGraph", "open-source", "reliability", "whitepaper"],
  },
  {
    slug: "building-50-agent-dag",
    title: "Building a 50-Agent Multi-Agent DAG Pipeline",
    excerpt:
      "How I designed and built Busara AI's 6-stage parallel DAG pipeline with 50 specialized agents — from Kahn's topological sort to circuit breakers and O(1) LRU caching.",
    tag: "AI",
    tagClass: "ai",
    date: "2026-07-01",
    readTime: "5 min",
    wordCount: 966,
    tags: ["multi-agent", "DAG", "TypeScript", "Busara AI", "orchestration"],
  },
  {
    slug: "kilimopro-ai-for-farmers",
    title: "KilimoPRO: AI for 5 Million Kenyan Farmers",
    excerpt:
      "Designing agricultural intelligence that works offline on low-end Android phones. Integrating KilimoSTAT, FAOSTAT, Google Earth Engine, and KALRO data.",
    tag: "Agriculture",
    tagClass: "agri",
    date: "2026-06-28",
    readTime: "3 min",
    wordCount: 500,
    tags: ["KilimoPRO", "agriculture", "Flutter", "TensorFlow Lite", "Kenya"],
  },
  {
    slug: "chinese-smart-agriculture",
    title: "Lessons from China's National Smart Agriculture Action Plan",
    excerpt:
      "What Kenya can learn from China's space-air-ground monitoring networks, large agricultural models, and the 2024-2028 smart agriculture framework.",
    tag: "Research",
    tagClass: "research",
    date: "2026-06-25",
    readTime: "3 min",
    wordCount: 452,
    tags: ["policy", "China", "Kenya", "smart agriculture", "research"],
  },
  {
    slug: "real-math-not-vibes",
    title: "Real Math, Not Vibes: The Statistical Engines Behind Honest Forecasting",
    excerpt:
      "Holt-Winters triple exponential smoothing, OLS regression via the normal equation, K-Means++ with silhouette scoring — the statistical engines behind Busara AI, and why real math matters when forecasts drive decisions.",
    tag: "Engineering",
    tagClass: "engineering",
    date: "2026-06-20",
    readTime: "3 min",
    wordCount: 546,
    tags: ["TypeScript", "statistics", "Holt-Winters", "OLS", "K-Means"],
  },
  {
    slug: "multi-llm-council",
    title: "The Multi-LLM Council: When One AI Isn't Enough",
    excerpt:
      "How KilimoPRO uses 5 expert AI personas (agronomist, economist, climate scientist, extension officer, risk manager) to deliberate complex farming decisions.",
    tag: "AI",
    tagClass: "ai",
    date: "2026-06-15",
    readTime: "2 min",
    wordCount: 365,
    tags: ["LLM", "multi-agent", "KilimoPRO", "agriculture"],
  },
  {
    slug: "quant-finance-for-agriculture",
    title: "Quantitative Finance for Agricultural Markets",
    excerpt:
      "Applying EWMA volatility, GARCH(1,1), Value at Risk (VaR), and RSI from financial markets to agricultural commodity price forecasting.",
    tag: "Research",
    tagClass: "research",
    date: "2026-06-10",
    readTime: "3 min",
    wordCount: 423,
    tags: ["quant", "GARCH", "EWMA", "VaR", "agriculture"],
  },
  {
    slug: "22-data-sources",
    title: "20 Data Sources for Kenyan Agricultural Intelligence",
    excerpt:
      "A comprehensive inventory of verified, operational data APIs: KilimoSTAT, FAOSTAT, KALRO, Google Earth Engine, Sentinel-2, CHIRPS, ARDC, and more.",
    tag: "Agriculture",
    tagClass: "agri",
    date: "2026-06-05",
    readTime: "3 min",
    wordCount: 548,
    tags: ["data sources", "API", "agriculture", "Kenya", "KilimoSTAT"],
  },
  {
    slug: "on-device-disease-detection",
    title: "On-Device Crop Disease Detection with TensorFlow Lite",
    excerpt:
      "Training MobileNetV3 on the PlantVillage dataset, quantizing to int8, and running inference on low-end Android phones — completely offline.",
    tag: "Engineering",
    tagClass: "engineering",
    date: "2026-06-01",
    readTime: "3 min",
    wordCount: 531,
    tags: ["TensorFlow Lite", "MobileNetV3", "PlantVillage", "on-device ML", "Flutter"],
  },
  {
    slug: "nasip-2026-2030-opportunity",
    title: "NASIP 2026-2030: The KES 1.08 Trillion Opportunity",
    excerpt:
      "Deep analysis of Kenya's National Agri-Food Systems Investment Plan and how technology platforms can operationalize its 9 flagship programs.",
    tag: "Agriculture",
    tagClass: "agri",
    date: "2026-05-28",
    readTime: "3 min",
    wordCount: 462,
    tags: ["NASIP", "Kenya", "policy", "agriculture", "investment"],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
