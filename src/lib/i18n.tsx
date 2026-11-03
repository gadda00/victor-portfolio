"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "fr" | "sw";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.work": "Work",
  "nav.blog": "Field Notes",
  "nav.about": "About",
  "nav.contact": "Contact",
  "hero.kicker": "AI Systems Engineer — Nairobi, Kenya",
  "hero.l1": "AI systems",
  "hero.l2a": "that ",
  "hero.l2b": "survive",
  "hero.l3": "the real world.",
  "hero.sub":
    "Victor Ndunda, Nairobi. Thirteen production systems across real estate, education, agriculture and fintech — engineered for low bandwidth, low-end devices and three languages.",
  "hero.cta1": "Explore the systems",
  "hero.cta2": "Start a project",
  "hero.stat1": "systems shipped",
  "hero.stat2": "learners served",
  "hero.stat3": "countries",
  "hero.stat4": "working languages",
  "work.label": "Selected systems",
  "work.title.a": "Work that runs",
  "work.title.b": "in production.",
  "cap.label": "Capabilities",
  "cap.title.a": "What I get",
  "cap.title.b": "hired to build.",
  "notes.label": "Field notes",
  "notes.title.a": "Notes from",
  "notes.title.b": "the build.",
  "voices.label": "Client voices",
  "voices.title.a": "What clients",
  "voices.title.b": "report back.",
  "contact.label": "Contact",
  "contact.title.a": "Let's build something",
  "contact.title.b": "that survives.",
  "footer.tag": "Designed & built in Nairobi. Shipped worldwide.",
  "footer.rights": "© 2026 Victor Ndunda · Nairobi, Kenya",
  "footer.col.work": "Systems",
  "footer.col.more": "Elsewhere",
};

const fr: Dict = {
  "nav.work": "Projets",
  "nav.blog": "Notes de terrain",
  "nav.about": "À propos",
  "nav.contact": "Contact",
  "hero.kicker": "Ingénieur systèmes IA — Nairobi, Kenya",
  "hero.l1": "Des systèmes d'IA",
  "hero.l2a": "qui ",
  "hero.l2b": "tiennent",
  "hero.l3": "dans le monde réel.",
  "hero.sub":
    "Victor Ndunda, Nairobi. Treize systèmes en production — immobilier, éducation, agriculture, fintech — conçus pour la faible bande passante, les appareils modestes et trois langues.",
  "hero.cta1": "Explorer les systèmes",
  "hero.cta2": "Démarrer un projet",
  "hero.stat1": "systèmes livrés",
  "hero.stat2": "apprenants servis",
  "hero.stat3": "pays",
  "hero.stat4": "langues de travail",
  "work.label": "Systèmes sélectionnés",
  "work.title.a": "Du travail qui tourne",
  "work.title.b": "en production.",
  "cap.label": "Compétences",
  "cap.title.a": "Ce pour quoi on",
  "cap.title.b": "m'engage.",
  "notes.label": "Notes de terrain",
  "notes.title.a": "Notes depuis",
  "notes.title.b": "le chantier.",
  "voices.label": "Voix clients",
  "voices.title.a": "Ce que les clients",
  "voices.title.b": "rapportent.",
  "contact.label": "Contact",
  "contact.title.a": "Construisons quelque chose",
  "contact.title.b": "qui dure.",
  "footer.tag": "Conçu et construit à Nairobi. Livré dans le monde entier.",
  "footer.rights": "© 2026 Victor Ndunda · Nairobi, Kenya",
  "footer.col.work": "Systèmes",
  "footer.col.more": "Ailleurs",
};

const sw: Dict = {
  "nav.work": "Kazi",
  "nav.blog": "Makala za Uwanjani",
  "nav.about": "Kuhusu",
  "nav.contact": "Wasiliana",
  "hero.kicker": "Injiniya wa Mifumo ya AI — Nairobi, Kenya",
  "hero.l1": "Mifumo ya AI",
  "hero.l2a": "inayoshinda ",
  "hero.l2b": "dunia",
  "hero.l3": "halisi.",
  "hero.sub":
    "Victor Ndunda, Nairobi. Mifumo kumi na tatu katika uzalishaji — mali isiyohamishika, elimu, kilimo, fintech — iliyoundwa kwa bandwidth ndogo, vifaa vya kawaida na lugha tatu.",
  "hero.cta1": "Tazama mifumo",
  "hero.cta2": "Anzisha mradi",
  "hero.stat1": "mifumo iliyotumwa",
  "hero.stat2": "wanafunzi waliohudumiwa",
  "hero.stat3": "nchi",
  "hero.stat4": "lugha za kazi",
  "work.label": "Mifumo iliyochaguliwa",
  "work.title.a": "Kazi inayofanya kazi",
  "work.title.b": "katika uzalishaji.",
  "cap.label": "Uwezo",
  "cap.title.a": "Ninachoajiriwa",
  "cap.title.b": "kujenga.",
  "notes.label": "Makala za uwanjani",
  "notes.title.a": "Makala kutoka",
  "notes.title.b": "kwenye ujenzi.",
  "voices.label": "Sauti za wateja",
  "voices.title.a": "Wateja",
  "voices.title.b": "wanaripoti.",
  "contact.label": "Wasiliana",
  "contact.title.a": "Tujenge kitu",
  "contact.title.b": "cha kudumu.",
  "footer.tag": "Imeundwa na kujengwa Nairobi. Imetumwa duniani kote.",
  "footer.rights": "© 2026 Victor Ndunda · Nairobi, Kenya",
  "footer.col.work": "Mifumo",
  "footer.col.more": "Mahali pengine",
};

const dicts: Record<Lang, Dict> = { en, fr, sw };

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k] ?? k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vn_lang");
      if (saved === "fr" || saved === "sw" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("vn_lang", l);
    } catch {
      /* storage unavailable */
    }
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string) => dicts[lang][key] ?? en[key] ?? key, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
