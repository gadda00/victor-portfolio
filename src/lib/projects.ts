export type Metric = { value: string; label: string; note?: string };

export type Project = {
  slug: string;
  name: string;
  client?: string;
  domain: string;
  year: string;
  category: string;
  status: "live" | "trial" | "production" | "active" | "shipped" | "dev" | "stealth";
  statusLabel: string;
  featured: boolean;
  tagline: string;
  summary: string;
  liveUrl?: string;
  demoUrl?: string;
  github?: string;
  accent: string;
  stack: string[];
  metrics: Metric[];
  caseStudy?: {
    mandate: string[];
    built: string[];
    flow?: { title: string; items: string[] };
    flow2?: { title: string; items: string[] };
    outcomes: Metric[];
    outcomeNote?: string;
    quote?: { text: string; who: string; org: string };
  };
};

export const projects: Project[] = [
  {
    slug: "keja-ai",
    name: "Keja AI",
    client: "CHACADOM INVESTMENTS",
    domain: "Real Estate · Trust Infrastructure",
    year: "2026",
    category: "Client Work",
    status: "trial",
    statusLabel: "Public trial",
    featured: true,
    tagline: "The trust layer for African property transactions.",
    summary:
      "A 7-stage real-estate platform covering the full transaction lifecycle — Discover → Verify → Analyse → Finance → Invest → Transact → Manage — with verified titles, per-listing investment scoring and the Ask Keja AI assistant across 8 stakeholder workspaces. Live in public trial with 87+ listings across 12 Kenyan counties. Nominated for an Africa AI Future Award (ceremony 27 Nov 2026, Nairobi).",
    liveUrl: "https://keja.app",
    accent: "#38bdf8",
    stack: ["Next.js", "AI Assistant", "Investment Scoring", "Title Verification", "Market Data", "Tokenization", "EN·SW·FR"],
    metrics: [
      { value: "87+", label: "live listings" },
      { value: "12", label: "Kenyan counties" },
      { value: "70", label: "listings at Trust Score ≥ 80" },
      { value: "8", label: "stakeholder workspaces" },
    ],
    caseStudy: {
      mandate: [
        "Property transactions in Kenya run on fragmented trust: listings in one place, title documents in another, market data nowhere. CHACADOM INVESTMENTS set out to build the platform that holds the whole picture — one ecosystem where every stage of the transaction lives and every stakeholder has a workspace.",
        "My mandate was the reasoning layer: making structured listing, document and market data usable as answers, scores and verifications at every one of the seven stages.",
      ],
      built: [
        "Ask Keja AI — an assistant that answers from the platform's actual listing data, not the open internet",
        "Per-listing investment scoring with an explainable standard behind every score",
        "KEJA Trust Score — verified titles and documents rolled into one number users check first; 70 listings certified above 80 in the first months",
        "Market data layer and tokenized asset support across the lifecycle",
        "Dedicated workspaces for buyers, sellers, landlords, tenants, investors, developers, banks and institutions — in English, Swahili and French",
      ],
      flow: {
        title: "The 7-stage lifecycle",
        items: ["Discover", "Verify", "Analyse", "Finance", "Invest", "Transact", "Manage"],
      },
      outcomes: [
        { value: "87+", label: "live listings (Oct 2026)" },
        { value: "12", label: "counties covered" },
        { value: "70", label: "Trust Score ≥ 80" },
        { value: "3", label: "languages served" },
      ],
      outcomeNote: "Public trial at keja.app. Africa AI Future Awards nominee — ceremony 27 Nov 2026, Nairobi.",
      quote: {
        text: "Keja AI set out to make property transactions in Kenya transparent — and the AI layer Victor built is what makes that real in production. The Ask Keja assistant answers from our actual listing data, the investment scores give every property an explainable standard, and the KEJA Trust Score has become the number our users check first — 70 listings were already certified above 80 in the first months.",
        who: "CHACADOM INVESTMENTS",
        org: "Client",
      },
    },
  },
  {
    slug: "tapi-learn",
    name: "Tapi Learn",
    client: "ACLA",
    domain: "EdTech · Multilingual AI",
    year: "2026",
    category: "Client Work",
    status: "active",
    statusLabel: "Live",
    featured: true,
    tagline: "A career coach that never closes — in three languages.",
    summary:
      "The multilingual AI learning product behind ACLA's climate-leadership academy: a 24/7 AI Career Coach (CV reviews, interview prep, career advice), a personalized recommendation engine and an EN·FR·SW NLP pipeline coaching real learners in production — 11,000+ learners across 38 countries at a 4.8/5 average rating (client-reported).",
    liveUrl: "https://acla.io/tapi-learn",
    accent: "#34d399",
    stack: ["Multilingual NLP", "EN·FR·SW", "AI Career Coach", "Recommendation Engine", "Opportunities Board", "Mobile"],
    metrics: [
      { value: "11,000+", label: "learners (client-reported)" },
      { value: "38", label: "countries" },
      { value: "4.8/5", label: "average rating" },
      { value: "24/7", label: "coaching availability" },
    ],
    caseStudy: {
      mandate: [
        "ACLA's climate-leadership academy serves learners across Africa and the diaspora — in English, French and Kiswahili. Human mentoring could not scale to the demand, could not stay open at 2 a.m. when learners actually study, and could not serve all three languages with equal quality.",
        "The mandate: guidance that never closes and speaks the learners' languages, as a core part of the product rather than a bolt-on support widget.",
      ],
      built: [
        "A 24/7 AI Career Coach — CV reviews, interview preparation and career advice, in-context and conversational",
        "An EN·FR·SW NLP pipeline holding equal quality across English, Français and Kiswahili",
        "A personalized recommendation engine matching learners to content and paths",
        "An opportunities board turning academy graduates into placed candidates",
      ],
      flow: {
        title: "The coaching loop",
        items: ["Learner asks", "Language detected", "Coach answers", "Path updates"],
      },
      outcomes: [
        { value: "11,000+", label: "learners served" },
        { value: "38", label: "countries reached" },
        { value: "4.8/5", label: "average rating" },
        { value: "3", label: "languages, equal quality" },
      ],
      outcomeNote: "Learner and rating figures are client-reported as of Oct 2026.",
      quote: {
        text: "Tapi Learn needed guidance that never closes and speaks our learners' languages. Victor delivered a 24/7 Career Coach in English, Français and Kiswahili — and the product visibly moved: 11,000+ learners across 38 countries and a 4.8/5 rating. Learners treat the coach as part of the product, not a support widget.",
        who: "ACLA",
        org: "Client",
      },
    },
  },
  {
    slug: "firstlight",
    name: "FirstLight",
    domain: "Geo-AI · Disaster Response",
    year: "2026",
    category: "AI Platform",
    status: "trial",
    statusLabel: "Public demo",
    featured: true,
    tagline: "Geo-AI decision layer for the first 72 hours after a flood.",
    summary:
      "A disaster-response decision layer: SAR-based damage and flood detection, H3 priority zoning with need scoring, Dijkstra routing with isochrones, and FNV-1a hash-verified situation reports — every data layer provenance-labeled so responders know exactly what they are looking at.",
    liveUrl: "https://gadda00.github.io/firstlight/",
    demoUrl: "https://firstlight.vercel.app",
    github: "https://github.com/gadda00/firstlight",
    accent: "#f59e0b",
    stack: ["Next.js", "TypeScript", "MapLibre GL", "Uber H3", "Geo-AI", "SAR", "Dijkstra", "Isochrones"],
    metrics: [
      { value: "H3 res-8", label: "priority zoning" },
      { value: "FNV-1a", label: "hash-verified sitreps" },
      { value: "100%", label: "provenance-labeled data" },
    ],
    caseStudy: {
      mandate: [
        "After a flood, the first 72 hours decide everything — yet responders work from fragmented maps, unverified social media, and gut prioritization. FirstLight was built to compress that chaos into one decision layer: where is the damage, who needs help first, and how do we get there.",
      ],
      built: [
        "Damage and flood detection from SAR imagery, rendered on an interactive MapLibre GL map",
        "H3 res-8 hexagonal zoning with per-cell need scoring for transparent prioritization",
        "Dijkstra-based routing with isochrones — reachability, not just distance",
        "Situation reports verified with FNV-1a hashes, so every sitrep is tamper-evident",
        "Strict provenance labeling: simulated layers are labeled simulated, so the demo never lies about its data",
      ],
      flow: {
        title: "The response loop",
        items: ["Detect", "Zone", "Prioritize", "Route", "Report"],
      },
      outcomes: [
        { value: "72h", label: "decision window targeted" },
        { value: "res-8", label: "H3 zoning granularity" },
        { value: "0", label: "unlabeled data layers" },
      ],
      outcomeNote: "Public demo with simulated, provenance-labeled data. Open source on GitHub.",
    },
  },
  {
    slug: "busara-ai",
    name: "Busara AI",
    domain: "Data Intelligence · Multi-Agent",
    year: "2026",
    category: "AI Platform",
    status: "production",
    statusLabel: "Live",
    featured: true,
    tagline: "Fifty agents, six stages, statistics from scratch.",
    summary:
      "An owned multi-agent data-intelligence platform: a 6-stage parallel DAG pipeline orchestrating 50 specialized agents, with Holt-Winters forecasting, OLS regression and K-Means++ clustering implemented from first principles, Kahn's topological sort for scheduling, circuit breakers and O(1) LRU caching. Live at busaraai.com.",
    liveUrl: "https://busaraai.com",
    accent: "#00d4ff",
    stack: ["TypeScript", "Next.js 15", "Multi-Agent DAG", "GLM-4.6", "PostgreSQL", "PWA", "Flutterwave"],
    metrics: [
      { value: "50", label: "specialized agents" },
      { value: "6", label: "pipeline stages" },
      { value: "3", label: "stats engines from scratch" },
    ],
    caseStudy: {
      mandate: [
        "Most 'AI analytics' products wrap one LLM call in a chart library. Busara AI started from the opposite premise: real statistical engines — implemented, tested and owned — with agents as the orchestration layer on top, not the substance underneath.",
      ],
      built: [
        "A 6-stage DAG pipeline with 50 specialized agents, scheduled by Kahn's topological sort",
        "Holt-Winters triple exponential smoothing, OLS regression via the normal equation, and K-Means++ with silhouette scoring — implemented from scratch in TypeScript",
        "Circuit breakers between stages and O(1) LRU caching so one slow agent cannot stall the pipeline",
        "A PWA front end with Flutterwave payments for the East African market",
      ],
      flow: {
        title: "The 6-stage DAG",
        items: ["Ingest", "Clean", "Enrich", "Model", "Score", "Deliver"],
      },
      outcomes: [
        { value: "50", label: "agents orchestrated" },
        { value: "O(1)", label: "LRU cache lookups" },
        { value: "0", label: "black-box stats dependencies" },
      ],
      outcomeNote: "Live at busaraai.com — owned product, not client work.",
    },
  },
  {
    slug: "agentreplay",
    name: "AgentReplay",
    domain: "Developer Tools · Agent Reliability",
    year: "2026",
    category: "Open-Source",
    status: "shipped",
    statusLabel: "Open source · MIT",
    featured: true,
    tagline: "Record once. Replay bit-exact. Zero model calls.",
    summary:
      "Deterministic replay and counterfactual debugging for AI agents: record a live run once, then replay it bit-exact without spending another token — 0.67% overhead against a 5% budget, 100% reproduction fidelity, counterfactual 'what-if' branches, and regression tests for agents in CI. MIT-licensed.",
    demoUrl: "https://agentreplay.vercel.app",
    github: "https://github.com/gadda00/agentreplay",
    accent: "#fbbf24",
    stack: ["Python", "LangGraph", "OpenAI SDK", "Anthropic SDK", "Deterministic Replay", "Counterfactual", "CI Regression"],
    metrics: [
      { value: "0.67%", label: "runtime overhead (5% budget)" },
      { value: "100%", label: "reproduction fidelity" },
      { value: "0", label: "model calls on replay" },
    ],
    caseStudy: {
      mandate: [
        "AI agents fail in ways normal software does not: nondeterministic model calls, hidden context drift, bugs that vanish when you try to reproduce them. Standard observability tells you that something went wrong; it does not let you step back into the exact run and ask 'what if'.",
        "AgentReplay closes that gap: bit-exact replay with zero model calls, plus counterfactual branching for the questions observability cannot answer.",
      ],
      built: [
        "Call-site canonicalization — every external call recorded against a stable identity",
        "A content-addressed blob store so recorded runs deduplicate naturally",
        "Interceptors for the OpenAI and Anthropic SDKs and LangGraph — no forking required",
        "A replay engine reproducing runs bit-exact with zero model calls",
        "Counterfactual mode: branch a recorded run, change one prompt or parameter, observe the divergence",
        "CI regression: replay saved runs on every commit and fail on behavioral drift",
      ],
      flow: {
        title: "The replay loop",
        items: ["Record", "Canonicalize", "Store", "Replay", "Branch"],
      },
      outcomes: [
        { value: "0.67%", label: "overhead vs 5% target" },
        { value: "100%", label: "reproduction fidelity" },
        { value: "MIT", label: "license, fully open" },
      ],
      outcomeNote: "Open source at github.com/gadda00/agentreplay. Full whitepaper on the blog.",
    },
  },
  {
    slug: "fraud-detection-system",
    name: "Fraud Detection System",
    domain: "Fintech · Real-Time Risk",
    year: "2026",
    category: "Open-Source",
    status: "shipped",
    statusLabel: "Open source",
    featured: true,
    tagline: "Regulated-grade fraud scoring in Go, in real time.",
    summary:
      "An enterprise-grade real-time fraud scoring engine in Go: 7 independent detectors fused by a weighted ensemble with logistic calibration, a business-rules engine, full case management, RBAC with JWT, Prometheus metrics, OpenTelemetry tracing, Slack alerting and Kubernetes manifests — the full production surface, not a notebook.",
    demoUrl: "https://fraud-detection-vn.vercel.app",
    github: "https://github.com/gadda00/fraud-detection-system",
    accent: "#ef4444",
    stack: ["Go 1.22", "Gin", "Weighted Ensemble", "Logistic Calibration", "Rules Engine", "Case Management", "RBAC + JWT", "Prometheus", "OpenTelemetry", "Kubernetes"],
    metrics: [
      { value: "7", label: "independent detectors" },
      { value: "<100ms", label: "scoring path design target" },
      { value: "3", label: "observability layers" },
    ],
    caseStudy: {
      mandate: [
        "Fraud scoring in regulated markets is not a modeling problem alone — it is a systems problem. The score matters less than the audit trail behind it, the case workflow around it, and the observability watching all of it.",
      ],
      built: [
        "7 independent fraud detectors, each explainable on its own",
        "A weighted ensemble with logistic calibration producing calibrated risk probabilities",
        "A rules engine for hard business constraints that must never wait on a model",
        "Case management with full investigation workflow and immutable event history",
        "RBAC with JWT, Prometheus metrics, OpenTelemetry tracing and Slack alerting",
        "Kubernetes manifests and CI — deployable, not just runnable",
      ],
      flow: {
        title: "The scoring path",
        items: ["Ingest", "Rules", "Detectors", "Ensemble", "Calibrate", "Case"],
      },
      outcomes: [
        { value: "7→1", label: "detectors fused to one score" },
        { value: "92%", label: "of codebase in Go" },
        { value: "K8s", label: "deployment ready" },
      ],
      outcomeNote: "Open source at github.com/gadda00/fraud-detection-system.",
    },
  },
  {
    slug: "kilimopro",
    name: "KilimoPRO",
    domain: "Agricultural AI · Offline-First",
    year: "2026",
    category: "Open-Source",
    status: "active",
    statusLabel: "Open source",
    featured: true,
    tagline: "Agritech that works on a $50 Android phone, offline.",
    summary:
      "Offline-first agricultural intelligence for 8 IGAD countries: on-device crop-disease detection with TensorFlow Lite (MobileNetV3, int8, PlantVillage), a 5-persona Multi-LLM Council for complex farming decisions, 22 verified data sources from KilimoSTAT to Sentinel-2, and SMS delivery for farmers without smartphones.",
    demoUrl: "https://kilimopro-ai.vercel.app",
    github: "https://github.com/gadda00/kilimopro",
    accent: "#10b981",
    stack: ["Next.js 14", "Drizzle ORM", "TensorFlow Lite", "MobileNetV3", "Multi-LLM Council", "Open-Meteo", "FAOSTAT", "ICPAC", "SMS", "Offline-First"],
    metrics: [
      { value: "8", label: "IGAD countries targeted" },
      { value: "22", label: "verified data sources" },
      { value: "int8", label: "on-device inference" },
    ],
    caseStudy: {
      mandate: [
        "Five million Kenyan farmers do not have flagship phones, stable power or consistent connectivity. Any AI that serves them must run on a low-end Android device, offline, and still give agronomist-grade advice.",
      ],
      built: [
        "On-device crop-disease detection — MobileNetV3 trained on PlantVillage, quantized to int8, running offline on low-end Android",
        "A Multi-LLM Council of 5 expert personas — agronomist, economist, climate scientist, extension officer, risk manager — deliberating complex decisions",
        "22 verified, operational data sources: KilimoSTAT, FAOSTAT, KALRO, Google Earth Engine, Sentinel-2, CHIRPS, ICPAC and more",
        "Quantitative finance techniques — EWMA volatility, GARCH(1,1), VaR, RSI — applied to commodity price forecasting",
        "SMS delivery for farmers without smartphones",
      ],
      flow: {
        title: "The field loop",
        items: ["Photo", "Detect", "Deliberate", "Advise", "SMS/App"],
      },
      outcomes: [
        { value: "int8", label: "fully offline detection" },
        { value: "5", label: "council personas" },
        { value: "22", label: "data sources verified" },
      ],
      outcomeNote: "Open source at github.com/gadda00/kilimopro. Deep-dive posts in Field Notes.",
    },
  },
  {
    slug: "verxlite",
    name: "Verxlite",
    domain: "Sales & Ops Automation",
    year: "2026",
    category: "Open-Source",
    status: "active",
    statusLabel: "Open source",
    featured: true,
    tagline: "The AI workflow agent for teams with no ML team.",
    summary:
      "A universal AI workflow agent for sales and operations: Celery-backed workflow pipelines, Google and HubSpot OAuth integrations, Langfuse tracing on every step, Fernet-encrypted credentials, and a Next.js 14 front end — the automation backbone for teams that need outcomes without an ML department.",
    demoUrl: "https://verxlite.vercel.app",
    github: "https://github.com/gadda00/verxlite",
    accent: "#a855f7",
    stack: ["Python", "FastAPI", "Celery", "Next.js 14", "SQLAlchemy 2", "Alembic", "Google OAuth", "HubSpot OAuth", "Langfuse", "Fernet"],
    metrics: [
      { value: "2", label: "native CRM integrations" },
      { value: "100%", label: "steps traced in Langfuse" },
      { value: "AES", label: "Fernet-encrypted credentials" },
    ],
    caseStudy: {
      mandate: [
        "Small sales and ops teams watch AI demos all day and ship none of it — every tool assumes a data team, a DevOps budget and a tolerance for glue code. Verxlite is the counter-thesis: one install, OAuth in, workflows running.",
      ],
      built: [
        "A workflow engine on Celery — long-running, retryable, observable",
        "Google and HubSpot OAuth integrations with encrypted token storage (Fernet)",
        "Langfuse tracing across every workflow step — the full chain, not just the final answer",
        "A FastAPI backend with SQLAlchemy 2 and Alembic migrations; Next.js 14 front end",
      ],
      flow: {
        title: "The workflow path",
        items: ["Connect", "Compose", "Run", "Trace", "Iterate"],
      },
      outcomes: [
        { value: "0", label: "ML team required" },
        { value: "2", label: "CRMs supported natively" },
        { value: "Full", label: "step-level tracing" },
      ],
      outcomeNote: "Open source at github.com/gadda00/verxlite.",
    },
  },
  {
    slug: "hazina-assist",
    name: "Hazina Assist",
    domain: "AI Platform",
    year: "2027",
    category: "AI Platform",
    status: "stealth",
    statusLabel: "In development",
    featured: false,
    tagline: "In early development.",
    summary:
      "A new AI platform now in active development. Public details will be published when the project reaches its first milestone.",
    accent: "#64748b",
    stack: [],
    metrics: [],
  },
  {
    slug: "intelliflow",
    name: "IntelliFlow",
    domain: "Multi-Agent Research",
    year: "2026",
    category: "Open-Source",
    status: "active",
    statusLabel: "Open source",
    featured: false,
    tagline: "33 self-evolving agents on one backbone.",
    summary:
      "A research platform for self-improving agent architectures: 33 agents that evolve their own prompts, orchestrated on a Turborepo + Next.js 15 backbone in TypeScript — built to test how far agents can go when they own their own improvement loop.",
    demoUrl: "https://intelliflow.vercel.app",
    github: "https://github.com/gadda00/IntelliFlow",
    accent: "#00d4ff",
    stack: ["TypeScript", "Multi-Agent", "Self-Evolving", "Turborepo", "Next.js 15"],
    metrics: [
      { value: "33", label: "agents" },
      { value: "1", label: "shared Turborepo backbone" },
    ],
  },
  {
    slug: "eco-africa-awards",
    name: "Eco Africa Awards",
    client: "ACLA",
    domain: "Nonprofit · Digital Experience",
    year: "2026",
    category: "Client Work",
    status: "active",
    statusLabel: "Live",
    featured: false,
    tagline: "The digital home of African climate leadership.",
    summary:
      "The awards platform celebrating climate leadership across Africa — an initiative of ACLA. Built with Next.js, Three.js and AI; live at ecoafricaawards.com.",
    liveUrl: "https://ecoafricaawards.com",
    github: "https://github.com/gadda00/eco-africa-awards",
    accent: "#34d399",
    stack: ["TypeScript", "Next.js", "Three.js", "AI"],
    metrics: [{ value: "Live", label: "at ecoafricaawards.com" }],
  },
  {
    slug: "financial-forecasting-suite",
    name: "Financial Forecasting Suite",
    domain: "Data Science · Time Series",
    year: "2026",
    category: "Data Science",
    status: "shipped",
    statusLabel: "Shipped",
    featured: false,
    tagline: "Forecastingtoolkit built for decisions, not dashboards.",
    summary:
      "A production-grade time-series forecasting toolkit: Holt-Winters, ARIMA and ensemble methods — the statistical engines behind Busara AI's forecasts, packaged to be reused wherever forecasts drive real decisions.",
    demoUrl: "https://forecasting-suite.vercel.app",
    github: "https://github.com/gadda00/financial-forecasting-suite",
    accent: "#10b981",
    stack: ["Python", "Holt-Winters", "ARIMA", "Ensemble Methods"],
    metrics: [
      { value: "3", label: "forecasting families" },
      { value: "95%", label: "of codebase in Python" },
    ],
  },
  {
    slug: "customer-segmentation-engine",
    name: "Customer Segmentation Engine",
    domain: "Data Science · Growth",
    year: "2026",
    category: "Data Science",
    status: "shipped",
    statusLabel: "Shipped",
    featured: false,
    tagline: "Transaction noise in, actionable cohorts out.",
    summary:
      "RFM analysis fused with K-Means and Gaussian Mixture Models: turns raw transaction histories into segments a growth team can actually act on — with the statistical honesty to say when a cluster is not a cluster.",
    demoUrl: "https://segmentation-engine.vercel.app",
    github: "https://github.com/gadda00/customer-segmentation-engine",
    accent: "#a855f7",
    stack: ["Python", "RFM", "K-Means", "GMM", "Silhouette Validation"],
    metrics: [
      { value: "3", label: "segmentation methods fused" },
      { value: "RFM", label: "recency · frequency · money" },
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured && p.status !== "stealth");

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const projectCategories = [
  "All",
  "Client Work",
  "AI Platform",
  "Open-Source",
  "Data Science",
];

export const capabilities = [
  {
    num: "01",
    title: "AI platforms & agents",
    body: "Multi-agent DAG pipelines, RAG systems, multilingual NLP (EN·FR·SW) and assistants that answer from your actual data — built with the reliability practices of Keja AI and Tapi Learn.",
    tags: ["LangGraph", "RAG", "Evals", "Guardrails", "Human-in-the-loop"],
  },
  {
    num: "02",
    title: "Product & platform engineering",
    body: "Full platforms in TypeScript and Go — Next.js front ends, FastAPI and Gin back ends, databases, auth, payments (Flutterwave/M-Pesa paths), deployed and monitored.",
    tags: ["Next.js", "TypeScript", "Go", "PostgreSQL", "Kubernetes"],
  },
  {
    num: "03",
    title: "Data science & forecasting",
    body: "Statistics implemented, not imported: Holt-Winters, OLS, K-Means++, GARCH — with validation that survives contact with stakeholders.",
    tags: ["Forecasting", "Segmentation", "On-device ML", "TFLite"],
  },
  {
    num: "04",
    title: "Frontier-constraint delivery",
    body: "Systems engineered for low bandwidth, low-end devices and offline-first operation — the discipline that makes AI usable for the next billion users.",
    tags: ["Offline-first", "SMS", "Low-end Android", "Swahili & French"],
  },
];
