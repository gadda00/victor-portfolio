/* =====================================================================
 * profile.js — Victor Ndunda's Master Professional Profile (single source of truth)
 * ---------------------------------------------------------------------
 * This is the "master resume" data structure. Every tailored resume and
 * cover letter is generated FROM this object by selecting/reordering the
 * entries most relevant to a given job's keywords.
 *
 * Edit this file to keep your master profile current. The generators
 * (resume.js, coverletter.js) read from window.VICTOR_PROFILE.
 * ===================================================================== */
(function (global) {
  'use strict';

  const PROFILE = {
    // ── Identity & contact ──────────────────────────────────────────────
    name: 'Victor Ndunda',
    title: 'AI Engineer',
    tagline: 'AI Engineer building production ML systems for agriculture and emerging markets.',
    location: {
      city: 'Nairobi',
      country: 'Kenya',
      countryCode: 'KE',
      region: 'East Africa',
      timezone: 'Africa/Nairobi (UTC+3 / EAT)',
    },
    contact: {
      email: 'mututandunda@gmail.com',      // primary application email
      phone: '+254 724 346 971',            // WhatsApp + phone
      website: 'https://victorndunda.com',
      github: 'https://github.com/gadda00',
      linkedin: 'https://www.linkedin.com/in/victor-ndunda',
      // twitter: '@victorndunda',
    },

    // ── Job-search preferences (used by scorer + Gmail) ─────────────────
    preferences: {
      remoteEligible: true,
      remotePreferred: true,
      willingToRelocate: false,
      yearsExperience: 5,
      workAuth: { kenya: 'citizen', remote: 'globally (async)' },
      availability: 'Immediate',
      salaryExpectation: {
        minAnnualUSD: 36000,     // floor
        targetAnnualUSD: 60000,  // ideal
        currency: 'USD',
        notes: 'Open to equity for startups; KES roles benchmarked separately.',
      },
      jobTypes: ['full-time', 'contract', 'part-time'],
    },

    // ── Professional summary (base; tailored per job) ───────────────────
    summary:
      'AI Engineer with 5+ years designing, shipping, and scaling machine-learning systems ' +
      'for agriculture and emerging-market products. I specialise in on-device inference, ' +
      'LLM/agent orchestration, and turning research prototypes into reliable production ' +
      'services. Most recently I led ML at an agritech startup serving smallholder farmers, ' +
      'and I publish openly about the engineering behind it.',

    // ── Skills, grouped & weighted. `weight` informs resume ordering + scoring. ──
    // weight: 3 = core/deep, 2 = strong, 1 = working knowledge
    skills: {
      core: [
        { name: 'Python', weight: 3 },
        { name: 'Machine Learning', weight: 3, aliases: ['ML'] },
        { name: 'Deep Learning', weight: 3 },
        { name: 'TensorFlow', weight: 3 },
        { name: 'PyTorch', weight: 2 },
        { name: 'LLM Application Development', weight: 3, aliases: ['LLMs', 'Large Language Models', 'GPT'] },
        { name: 'MLOps', weight: 2 },
      ],
      ml: [
        { name: 'Computer Vision', weight: 3 },
        { name: 'On-Device ML', weight: 3, aliases: ['Edge AI', 'TensorFlow Lite', 'TFLite', 'Mobile ML'] },
        { name: 'NLP', weight: 2, aliases: ['Natural Language Processing'] },
        { name: 'Reinforcement Learning', weight: 1 },
        { name: 'Time-Series Forecasting', weight: 2 },
        { name: 'Recommendation Systems', weight: 1 },
        { name: 'Multi-LLM Orchestration', weight: 2, aliases: ['LLM Council', 'Agent DAG'] },
      ],
      languages: [
        { name: 'Python', weight: 3 },
        { name: 'TypeScript', weight: 2 },
        { name: 'JavaScript', weight: 2 },
        { name: 'SQL', weight: 2 },
        { name: 'Bash', weight: 1 },
        { name: 'Go', weight: 1 },
      ],
      web: [
        { name: 'React', weight: 2 },
        { name: 'Next.js', weight: 2 },
        { name: 'Node.js', weight: 2 },
        { name: 'FastAPI', weight: 2 },
        { name: 'Flask', weight: 1 },
        { name: 'REST APIs', weight: 2 },
      ],
      data: [
        { name: 'PostgreSQL', weight: 2 },
        { name: 'Redis', weight: 1 },
        { name: 'Pandas', weight: 3 },
        { name: 'NumPy', weight: 3 },
        { name: 'Scikit-learn', weight: 3 },
        { name: 'Data Pipelines', weight: 2, aliases: ['ETL'] },
        { name: 'Feature Engineering', weight: 2 },
      ],
      cloud: [
        { name: 'Docker', weight: 2 },
        { name: 'GitHub Actions', weight: 2 },
        { name: 'AWS', weight: 1 },
        { name: 'GCP', weight: 1 },
        { name: 'Linux', weight: 2 },
      ],
      domain: [
        { name: 'Agritech', weight: 3, aliases: ['Agriculture', 'Precision Agriculture', 'AgriTech'] },
        { name: 'Emerging Markets', weight: 2 },
        { name: 'Quantitative Finance', weight: 1, aliases: ['Quant'] },
        { name: 'Computer Vision for Health', weight: 1 },
      ],
      soft: [
        { name: 'Technical Writing', weight: 2 },
        { name: 'Product Thinking', weight: 2 },
        { name: 'Mentorship', weight: 1 },
        { name: 'Cross-functional Collaboration', weight: 2 },
      ],
    },

    // ── Experience (most recent first) ──────────────────────────────────
    // `highlights` are achievement bullets. The resume generator picks the
    // bullets whose keywords best match the target job.
    experience: [
      {
        role: 'Lead AI Engineer',
        company: 'KilimoPro (Agritech Startup)',
        location: 'Nairobi, Kenya (Remote-first)',
        period: '2023 — Present',
        type: 'full-time',
        summary:
          'Lead ML engineering for an AI-for-farmers platform serving smallholder farmers across East Africa.',
        highlights: [
          'Designed and shipped an on-device crop-disease detection model (TensorFlow Lite) that runs offline on low-end Android phones, reaching farmers without connectivity.',
          'Built a multi-LLM "council" orchestration layer that routes agronomy questions across specialist models, improving answer accuracy by 32% over a single-model baseline.',
          'Architected a 50-node agent DAG for automated farm-advisory report generation, cutting manual report time from hours to minutes.',
          'Owned MLOps: model registry, canary deployment, and drift monitoring across 6 production models.',
          'Integrated 22 heterogeneous data sources (weather, market, satellite, soil) into a unified feature store.',
        ],
        tech: ['Python', 'TensorFlow', 'TFLite', 'FastAPI', 'PostgreSQL', 'Docker', 'LLMs'],
      },
      {
        role: 'Machine Learning Engineer',
        company: 'Busara AI',
        location: 'Nairobi, Kenya',
        period: '2021 — 2023',
        type: 'full-time',
        summary:
          'Built ML products for behavioural-science and emerging-market research at scale.',
        highlights: [
          'Productionised NLP pipelines classifying survey responses with 94% precision.',
          'Reduced model inference cost 40% via quantisation and batching on CPU-only deploys.',
          'Mentored two junior engineers; established the team\'s experiment-tracking practice.',
        ],
        tech: ['Python', 'PyTorch', 'Scikit-learn', 'Pandas', 'AWS'],
      },
      {
        role: 'Software Engineer (Data)',
        company: 'Independent / Freelance',
        location: 'Nairobi, Kenya',
        period: '2019 — 2021',
        type: 'contract',
        summary:
          'Delivered data engineering and ML prototypes for startups and NGOs.',
        highlights: [
          'Built ETL pipelines and dashboards for an agriculture value-chain NGO.',
          'Prototyped a quantitative finance model for agricultural commodity pricing.',
        ],
        tech: ['Python', 'SQL', 'Pandas', 'Flask'],
      },
    ],

    // ── Projects (open-source / side) — also keyword-matched ────────────
    projects: [
      {
        name: 'On-Device Crop Disease Detection',
        url: 'https://victorndunda.com/blog/articles/on-device-disease-detection.html',
        description:
          'Offline-first mobile model identifying 30+ crop diseases from leaf photos, optimised for sub-$100 phones.',
        tech: ['TensorFlow Lite', 'Python', 'Computer Vision'],
        highlights: [
          'Achieved 91% top-1 accuracy with a model under 4 MB.',
          'Latency < 120 ms on a 2018-era Android device.',
        ],
      },
      {
        name: 'Multi-LLM Council',
        url: 'https://victorndunda.com/blog/articles/multi-llm-council.html',
        description:
          'Orchestration framework routing queries across multiple LLMs and synthesising a consensus answer.',
        tech: ['Python', 'LLMs', 'FastAPI'],
        highlights: ['Open architecture pluggable to any provider; used in production advisory tooling.'],
      },
      {
        name: '50-Agent DAG for Advisory Reports',
        url: 'https://victorndunda.com/blog/articles/building-50-agent-dag.html',
        description:
          'A directed-acyclic-graph of 50 specialised agents that auto-generate structured farm-advisory reports.',
        tech: ['Python', 'LLMs', 'Agents'],
        highlights: ['Replaced a manual 3-hour workflow with a 4-minute automated run.'],
      },
    ],

    // ── Education & certifications ──────────────────────────────────────
    education: [
      {
        degree: 'BSc Computer Science',
        institution: 'University of Nairobi',
        period: '2015 — 2019',
        details: 'First Class Honours. Final-year project: ML for agricultural yield prediction.',
      },
    ],
    certifications: [
      'TensorFlow Developer Certificate',
      'DeepLearning.AI Deep Learning Specialization',
    ],

    // ── Meta ────────────────────────────────────────────────────────────
    meta: {
      version: '1.0.0',
      lastUpdated: '2026-07-04',
    },
  };

  global.VICTOR_PROFILE = PROFILE;
})(window);
