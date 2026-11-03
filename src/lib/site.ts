export const site = {
  name: "Victor Ndunda",
  title: "AI Systems Engineer",
  url: "https://victorndunda.com",
  email: "mututandunda@gmail.com",
  location: "Nairobi, Kenya",
  timezone: "Africa/Nairobi",
  description:
    "AI systems engineer in Nairobi. 13 production systems across real estate, education, agriculture and fintech — engineered for low bandwidth, low-end devices and three languages.",
  socials: {
    github: "https://github.com/gadda00",
    linkedin: "https://www.linkedin.com/in/victor-ndunda",
  },
  resumePdf: "/Victor-Ndunda-Resume.pdf",
  availability: "Available for select engagements — Nairobi & remote",
} as const;

export const nav = [
  { href: "/work", key: "nav.work" },
  { href: "/blog", key: "nav.blog" },
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
] as const;
