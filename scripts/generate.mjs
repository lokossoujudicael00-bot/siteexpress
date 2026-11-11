// Usage : node --env-file=.env.local scripts/generate.mjs Cotonou amenity=restaurant 3
import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";
const [city, tag, n = "5"] = process.argv.slice(2);
if (!city || !tag) { console.log('Exemple : node --env-file=.env.local scripts/generate.mjs Paris shop=hairdresser 5'); process.exit(1); }
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
const all = await overpass();
if (!all) { console.log("Les serveurs OpenStreetMap sont occupés. Réessaie dans 5 minutes."); process.exit(1); }
const els = all.slice(0, Number(n));
console.log(all.length + " commerces sans site trouvés, je traite " + els.length);
for (const e of els) {
  const t = e.tags;
  const name = t.name;
  const address = [t["addr:housenumber"], t["addr:street"], t["addr:city"] || city].filter(Boolean).join(" ");
  const phone = t.phone || t["contact:phone"] || "";
  const email = t.email || t["contact:email"] || null;
  const prompt = `Commerce : ${name}, type : ${tag}, ville : ${city}. Réponds UNIQUEMENT en JSON : {"tagline":"phrase d'accroche courte","servicesTitle":"titre de la liste","services":[{"name":"...","price":""}]} avec 5 services ou produits typiques de ce métier, écrits dans la langue du pays. Ne mets AUCUN prix inventé : price reste vide.`;
  const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
  });
  let gen;
  try { gen = JSON.parse((await g.json()).candidates[0].content.parts[0].text); } catch { console.log("Gemini a échoué pour", name); continue; }
  const config = { ...gen, address, phone, hours: t.opening_hours || "", photos: [] };
  const slug = name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);
  const { data, error } = await db.from("shops").insert({ slug, name, type: tag, config, owner_email: email }).select().single();
  if (error) { console.log("Erreur", name, error.message); continue; }
  const line = `${name};${email || ""};${process.env.SITE_URL}/${slug};${process.env.SITE_URL}/edit/${data.edit_token}\n`;
  appendFileSync("leads.csv", line);
  console.log(line.trim());
  await sleep(6000);
}
