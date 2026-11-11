// Usage : node --env-file=.env.local scripts/generate.mjs VILLE tag=valeur NOMBRE PAYS
// Exemple : node --env-file=.env.local scripts/generate.mjs Cotonou amenity=restaurant 3 BJ
import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";
const [city, tag, n = "5", countryArg] = process.argv.slice(2);
if (!city || !tag) { console.log("Exemple : node --env-file=.env.local scripts/generate.mjs Cotonou amenity=restaurant 3 BJ"); process.exit(1); }
const country = (countryArg || "FR").toUpperCase();
if (!countryArg) console.log("Astuce : ajoute le code du pays à la fin (BJ, TG, CI, SN, FR, US, ES...). Par défaut : FR.");
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
const query = `[out:json][timeout:60];area[name="${city}"]->.a;nwr(area.a)["${key}"="${val}"][name][!website][!"contact:website"];out center tags 100;`;
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
async function gemini(prompt) {
  const models = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-latest"];
  for (const m of [...new Set(models)]) {
    try {
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      });
      const j = await g.json().catch(() => ({}));
      const t = j?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) { try { return JSON.parse(t.replace(/```json|```/g, "").trim()); } catch {} }
      console.log("Gemini (" + m + ") :", g.status, String(j?.error?.message || "réponse vide").slice(0, 200));
    } catch (e) { console.log("Gemini échec réseau :", e.message); }
    await sleep(8000);
  }
  return null;
}
const MSG = {
  fr: (name, link) => `Bonjour, j'ai préparé gratuitement un aperçu de site web pour ${name} : ${link}\nLe tarif et les détails sont sur la page. Répondez STOP si vous ne voulez pas être contacté.`,
  en: (name, link) => `Hello, I prepared a free website preview for ${name}: ${link}\nPrice and details are on the page. Reply STOP if you do not want to be contacted.`,
  es: (name, link) => `Hola, he preparado gratis una vista previa de sitio web para ${name}: ${link}\nEl precio y los detalles están en la página. Responda STOP si no desea ser contactado.`,
  pt: (name, link) => `Olá, preparei gratuitamente uma pré-visualização de site para ${name}: ${link}\nO preço e os detalhes estão na página. Responda STOP se não quiser ser contactado.`,
};
const all = await overpass();
if (!all) { console.log("Les serveurs OpenStreetMap sont occupés. Réessaie dans 5 minutes."); process.exit(1); }
const els = all.slice(0, Number(n));
console.log(all.length + " commerces sans site trouvés, je traite " + els.length + " (pays " + country + ", langue " + lang + ", thème " + theme + ")");
for (const e of els) {
  const t = e.tags;
  const name = t.name;
  const address = [t["addr:housenumber"], t["addr:street"], t["addr:city"] || city].filter(Boolean).join(" ");
  const phone = t.phone || t["contact:phone"] || t["contact:mobile"] || "";
  const email = t.email || t["contact:email"] || null;
  const prompt = `Tu écris le contenu du site web d'un commerce. Nom : ${name}. Type : ${tag}. Ville : ${city}. Langue de rédaction : ${LANGNAME[lang]}. Réponds UNIQUEMENT en JSON, sans texte autour : {"tagline":"phrase d'accroche courte et chaleureuse","about":"paragraphe de 2 à 3 phrases présentant le commerce, sans inventer de faits précis (pas d'année, pas de récompense, pas de chiffres)","servicesTitle":"titre de la liste","services":[{"name":"...","desc":"une courte phrase"}],"faq":[{"q":"...","a":"..."}]} avec exactement 6 services ou produits typiques de ce métier et 3 questions fréquentes utiles. N'invente AUCUN prix, AUCUN horaire, AUCUNE adresse.`;
  let gen = await gemini(prompt);
  if (!gen) { console.log("→ Contenu simple utilisé pour", name); gen = { tagline: name, about: "", servicesTitle: "", services: [], faq: [] }; }
  const config = { ...gen, theme, lang, currency, country, address, phone, hours: t.opening_hours || "", photos: [] };
  const slug = name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);
  const { data, error } = await db.from("shops").insert({ slug, name, type: tag, config, owner_email: email }).select().single();
  if (error) { console.log("Erreur", name, error.message); continue; }
  const link = `${process.env.SITE_URL}/${slug}`;
  let wa = "";
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+") || digits.startsWith("00")) {
    const num = digits.replace(/^\+/, "").replace(/^00/, "");
    wa = `https://wa.me/${num}?text=${encodeURIComponent(MSG[lang](name, link))}`;
  }
  appendFileSync("leads.csv", `${name};${email || ""};${link};${process.env.SITE_URL}/edit/${data.edit_token};${wa}\n`);
  console.log("✔", name, "| e-mail:", email || "aucun", "| WhatsApp:", wa ? "oui" : "non");
  console.log("   Aperçu :", link);
  await sleep(6000);
}
