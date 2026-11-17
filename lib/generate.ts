import { db } from "@/lib/db";
import { COUNTRIES, LANGNAME, themeFor } from "@/lib/countries";

async function withTimeout(url: string, init: any, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(t); }
}

async function gemini(prompt: string): Promise<any | null> {
  const raw = (process.env.GEMINI_MODEL || "").replace(/^GEMINI_MODEL=/, "").trim();
  const models = Array.from(new Set([raw || "gemini-flash-latest", "gemini-flash-lite-latest"]));
  for (const m of models) {
    try {
      const g = await withTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY || "" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      }, 22000);
      const j: any = await g.json().catch(() => ({}));
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) { try { return JSON.parse(String(t).replace(/```json|```/g, "").trim()); } catch {} }
      console.log("Gemini", m, g.status);
    } catch (e) { console.log("Gemini échec", m); }
  }
  return null;
}

const THEME_Q: Record<string, string> = { food: "african restaurant food", beauty: "hair salon", auto: "car garage mechanic", health: "clinic doctor", hotel: "hotel room", fitness: "gym fitness", school: "classroom school", shop: "small shop store", generic: "small business" };
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);

async function photos(q: string, per = 10): Promise<{ hero: string; card: string; dl?: string }[]> {
  if (!q || !process.env.UNSPLASH_ACCESS_KEY) return [];
  try {
    const auth = { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` };
    const r = await withTimeout(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${per}&orientation=landscape`, { headers: auth }, 8000);
    const j: any = await r.json();
    return (j.results || []).map((p: any) => ({ hero: p.urls.regular, card: p.urls.small, dl: p.links?.download_location }));
  } catch { return []; }
}
function ping(p: any) { try { if (p?.dl) fetch(p.dl, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }).catch(() => {}); } catch {} }

export type NewShop = { name: string; tag: string; city: string; country: string; phone?: string; email?: string; address?: string; hours?: string; extra?: any };

export async function createShop(input: NewShop): Promise<{ slug: string; editToken: string; lang: string } | null> {
  const country = (input.country || "FR").toUpperCase();
  const [lang, currency] = COUNTRIES[country] || ["en", "USD"];
  const theme = themeFor(input.tag);
  const prompt = `Tu écris le contenu du site web d'un commerce. Nom : ${input.name}. Type : ${input.tag}. Ville : ${input.city}, pays : ${country}. Langue de rédaction : ${LANGNAME[lang]}. Réponds UNIQUEMENT en JSON, sans texte autour : {"tagline":"phrase d'accroche courte et chaleureuse","about":"paragraphe de 2 à 3 phrases présentant le commerce, sans inventer de faits précis (pas d'année, pas de récompense, pas de chiffres)","servicesTitle":"titre de la liste","services":[{"name":"...","desc":"une courte phrase","photoQuery":"2 à 3 mots en anglais"}],"highlights":[{"title":"...","text":"une phrase"}],"faq":[{"q":"...","a":"..."}],"heroQuery":"2 à 4 mots en anglais"} avec exactement 6 services ou produits typiques de ce métier dans ce pays, 3 atouts généraux sans chiffres inventés, et 3 questions fréquentes utiles. N'invente AUCUN prix, AUCUN horaire, AUCUNE adresse, AUCUN avis client.`;
  const gen = (await gemini(prompt)) || { tagline: input.name, about: "", servicesTitle: "", services: [], highlights: [], faq: [] };
  const heroQ: string = gen.heroQuery || THEME_Q[theme] || "small business";
  const [heroRaw, ...picsRaw] = await Promise.all([photos(heroQ, 12), ...(gen.services || []).slice(0, 3).map((sv: any) => photos(sv.photoQuery || heroQ, 6))]);
  const heroList = shuffle(heroRaw).slice(0, 4);
  heroList.forEach(ping);
  const picsList = picsRaw.map((l: any[]) => shuffle(l)[0] || null);
  picsList.forEach(ping);
  const services = (gen.services || []).slice(0, 6).map((sv: any, i: number) => ({ name: sv.name, desc: sv.desc || "", price: "", img: picsList[i] ? picsList[i].card : "" }));
  const heroes = heroList.map((p) => p.hero);
  const credit = heroes.length || picsList.some(Boolean) ? "Unsplash" : false;
  const config = {
    tagline: gen.tagline, about: gen.about, servicesTitle: gen.servicesTitle, services, highlights: gen.highlights || [], faq: gen.faq || [],
    heroes, hero: heroes[0] || "", photoCredit: credit, theme, lang, currency, country,
    address: input.address || input.city, phone: input.phone || "", hours: input.hours || "", photos: [], manual: true, ...(input.extra || {}),
  };
  const slug = input.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);
  const { data, error } = await db.from("shops").insert({ slug, name: input.name, type: input.tag, config, owner_email: input.email || null }).select().single();
  if (error || !data) { console.log("insert", error?.message); return null; }
  return { slug, editToken: data.edit_token, lang };
}
