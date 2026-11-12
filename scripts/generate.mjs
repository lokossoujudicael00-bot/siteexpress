// Usage : node --env-file=.env.local scripts/generate.mjs VILLE tag=valeur NOMBRE PAYS
// Exemple : node --env-file=.env.local scripts/generate.mjs Cotonou amenity=restaurant 3 BJ
// Options (variables) : ONLY_EMAIL=1 (ne garder que les commerces avec e-mail), PEXELS_API_KEY (photos gratuites)
import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";
const [city, tag, n = "5", countryArg] = process.argv.slice(2);
if (!city || !tag) { console.log("Exemple : node --env-file=.env.local scripts/generate.mjs Cotonou amenity=restaurant 3 BJ"); process.exit(1); }
const country = (countryArg || "FR").toUpperCase();
const ONLY_EMAIL = process.env.ONLY_EMAIL === "1";
const AUTO = process.env.AUTO === "1";
const COUNTRIES = {
  BJ: ["fr", "XOF"], TG: ["fr", "XOF"], CI: ["fr", "XOF"], SN: ["fr", "XOF"], ML: ["fr", "XOF"], BF: ["fr", "XOF"], NE: ["fr", "XOF"],
  CM: ["fr", "XAF"], GA: ["fr", "XAF"], CG: ["fr", "XAF"], FR: ["fr", "EUR"], BE: ["fr", "EUR"], LU: ["fr", "EUR"], CH: ["fr", "EUR"],
  MA: ["fr", "MAD"], DZ: ["fr", "EUR"], TN: ["fr", "EUR"], ES: ["es", "EUR"], PT: ["pt", "EUR"], BR: ["pt", "USD"], MX: ["es", "USD"],
  CO: ["es", "USD"], AR: ["es", "USD"], US: ["en", "USD"], GB: ["en", "GBP"], IE: ["en", "EUR"], NG: ["en", "USD"], GH: ["en", "USD"],
  KE: ["en", "USD"], ZA: ["en", "USD"], DE: ["en", "EUR"], IT: ["en", "EUR"], NL: ["en", "EUR"], CA: ["en", "USD"],
};
const [lang, currency] = COUNTRIES[country] || ["en", "USD"];
const LANGNAME = { fr: "français", en: "English", es: "español", pt: "português" };
function themeFor(tg) {
  if (/amenity=(restaurant|cafe|bar|fast_food|pub|ice_cream)|shop=(bakery|pastry|butcher)/.test(tg)) return "food";
  if (/shop=(hairdresser|beauty|cosmetics|massage|tattoo)|amenity=spa/.test(tg)) return "beauty";
  if (/shop=(car_repair|car|tyres|motorcycle|car_parts)|amenity=car_wash/.test(tg)) return "auto";
  if (/amenity=(dentist|doctors|clinic|pharmacy|hospital|veterinary)|healthcare/.test(tg)) return "health";
  if (/tourism=(hotel|guest_house|hostel|apartment|motel)/.test(tg)) return "hotel";
  if (/leisure=(fitness_centre|sports_centre|gym)/.test(tg)) return "fitness";
  if (/amenity=(school|driving_school|kindergarten|language_school)/.test(tg)) return "school";
  if (/^shop=/.test(tg)) return "shop";
  return "generic";
}
const theme = themeFor(tag);
const [key, val] = tag.split("=");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const base = `nwr(area.a)["${key}"="${val}"][name][!website][!"contact:website"]`;
const query = ONLY_EMAIL
  ? `[out:json][timeout:90];area[name="${city}"]->.a;(${base}[email];${base}["contact:email"];);out center tags 400;`
  : `[out:json][timeout:60];area[name="${city}"]->.a;${base};out center tags 300;`;
async function overpass() {
  const mirrors = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
  for (let round = 0; round < 2; round++) {
    for (const url of mirrors) {
      try {
        const r = await fetch(url, { method: "POST", headers: { "User-Agent": "SiteExpress/1.0 (Rufinjudicael08@gmail.com)", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ data: query }) });
        const txt = await r.text();
        if (txt.trim().startsWith("{")) return JSON.parse(txt).elements || [];
        console.log("Serveur occupé (" + r.status + "), j'essaie un autre...");
      } catch (e) { console.log("Échec réseau :", e.message); }
      await sleep(3000);
    }
  }
  return null;
}
const MODEL = (process.env.GEMINI_MODEL || "").replace(/^GEMINI_MODEL=/, "").trim() || "gemini-flash-latest";
async function gemini(prompt) {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const m of [...new Set([MODEL, "gemini-flash-latest"])]) {
      try {
        const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
        });
        const j = await g.json().catch(() => ({}));
        const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (t) { try { return JSON.parse(t.replace(/```json|```/g, "").trim()); } catch {} }
        console.log("Gemini (" + m + ") :", g.status, String(j?.error?.message || "réponse vide").slice(0, 160));
      } catch (e) { console.log("Gemini échec réseau :", e.message); }
    }
    await sleep(8000);
  }
  return null;
}
async function pexels(q) {
  if (!process.env.PEXELS_API_KEY || !q) return null;
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape`, { headers: { Authorization: process.env.PEXELS_API_KEY } });
    const j = await r.json();
    const list = j.photos || [];
    if (!list.length) return null;
    const p = list[Math.floor(Math.random() * list.length)];
    return { hero: p.src.large2x || p.src.large, card: p.src.medium || p.src.large };
  } catch { return null; }
}
const MSG = {
  fr: (name, link) => `Bonjour, j'ai préparé gratuitement un aperçu de site web pour ${name} : ${link}\nLe tarif et les détails sont sur la page. Répondez STOP si vous ne voulez pas être contacté.`,
  en: (name, link) => `Hello, I prepared a free website preview for ${name}: ${link}\nPrice and details are on the page. Reply STOP if you do not want to be contacted.`,
  es: (name, link) => `Hola, he preparado gratis una vista previa de sitio web para ${name}: ${link}\nEl precio y los detalles están en la página. Responda STOP si no desea ser contactado.`,
  pt: (name, link) => `Olá, preparei gratuitamente uma pré-visualização de site para ${name}: ${link}\nO preço e os detalhes estão na página. Responda STOP se não quiser ser contactado.`,
};
const all = await overpass();
if (!all) { console.log("Les serveurs OpenStreetMap sont occupés. Réessaie dans 5 minutes."); process.exit(1); }
const { data: existing } = await db.from("shops").select("config").eq("type", tag);
const known = new Set((existing || []).map((x) => x.config?.osm_id).filter(Boolean));
const score = (e) => ((e.tags.email || e.tags["contact:email"]) ? 2 : 0) + ((e.tags.phone || e.tags["contact:phone"] || e.tags["contact:mobile"]) ? 1 : 0);
const todo = all.filter((e) => !known.has(`${e.type}/${e.id}`)).sort((a, b) => score(b) - score(a));
console.log(all.length + " commerces sans site trouvés, " + todo.length + " nouveaux (pays " + country + ", langue " + lang + ", thème " + theme + ", modèle " + MODEL + ")");
let created = 0;
for (const e of todo) {
  if (created >= Number(n)) break;
  const t = e.tags;
  const name = t.name;
  const address = [t["addr:housenumber"], t["addr:street"], t["addr:city"] || city].filter(Boolean).join(" ");
  const phone = t.phone || t["contact:phone"] || t["contact:mobile"] || "";
  const email = t.email || t["contact:email"] || null;
  const prompt = `Tu écris le contenu du site web d'un commerce. Nom : ${name}. Type : ${tag}. Ville : ${city}, pays : ${country}. Langue de rédaction : ${LANGNAME[lang]}. Réponds UNIQUEMENT en JSON, sans texte autour : {"tagline":"phrase d'accroche courte et chaleureuse","about":"paragraphe de 2 à 3 phrases présentant le commerce, sans inventer de faits précis (pas d'année, pas de récompense, pas de chiffres)","servicesTitle":"titre de la liste","services":[{"name":"...","desc":"une courte phrase","photoQuery":"2 à 3 mots en anglais pour chercher une photo"}],"highlights":[{"title":"...","text":"une phrase"}],"faq":[{"q":"...","a":"..."}],"heroQuery":"2 à 4 mots en anglais pour une grande photo d'ambiance"} avec exactement 6 services ou produits typiques de ce métier dans ce pays, 3 atouts (highlights) généraux sans chiffres inventés, et 3 questions fréquentes utiles. N'invente AUCUN prix, AUCUN horaire, AUCUNE adresse, AUCUN avis client.`;
  const gen = await gemini(prompt);
  if (!gen && AUTO) { console.log("→ Gemini indisponible, je saute", name); continue; }
  const content = gen || { tagline: name, about: "", servicesTitle: "", services: [], highlights: [], faq: [] };
  let credit = false;
  let heroUrl = "";
  const h = await pexels(content.heroQuery);
  if (h) { heroUrl = h.hero; credit = true; }
  const services = [];
  for (const sv of (content.services || []).slice(0, 6)) {
    const p = await pexels(sv.photoQuery);
    if (p) credit = true;
    services.push({ name: sv.name, desc: sv.desc || "", price: "", img: p ? p.card : "" });
  }
  const config = { tagline: content.tagline, about: content.about, servicesTitle: content.servicesTitle, services, highlights: content.highlights || [], faq: content.faq || [], hero: heroUrl, photoCredit: credit, theme, lang, currency, country, address, phone, hours: t.opening_hours || "", photos: [], osm_id: `${e.type}/${e.id}` };
  const slug = name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);
  const { data, error } = await db.from("shops").insert({ slug, name, type: tag, config, owner_email: email }).select().single();
  if (error) { console.log("Erreur", name, error.message); continue; }
  created++;
  const link = `${process.env.SITE_URL}/${slug}`;
  let wa = "";
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+") || digits.startsWith("00")) {
    wa = `https://wa.me/${digits.replace(/^\+/, "").replace(/^00/, "")}?text=${encodeURIComponent(MSG[lang](name, link))}`;
  }
  try { appendFileSync("leads.csv", `${name};${email || ""};${link};${process.env.SITE_URL}/edit/${data.edit_token};${wa}\n`); } catch {}
  console.log("✔", name, "| e-mail:", email || "aucun", "| WhatsApp:", wa ? "oui" : "non", "| photos:", heroUrl ? "oui" : "non");
  console.log("   Aperçu :", link);
  await sleep(4000);
}
console.log(created + " site(s) créé(s).");
