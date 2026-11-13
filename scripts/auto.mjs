// Lancé chaque nuit par GitHub Actions : choisit la cible du jour dans targets.json et crée les sites.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const targets = JSON.parse(readFileSync(new URL("../targets.json", import.meta.url), "utf8"));
const day = Math.floor(Date.now() / 86400000);
const t = targets[day % targets.length];
console.log("Cible du jour :", JSON.stringify(t));
const r = spawnSync("node", ["scripts/generate.mjs", t.city, t.tag, String(t.count || 10), t.country], { stdio: "inherit", env: { ...process.env, ONLY_CONTACT: "1", AUTO: "1" } });
process.exit(r.status || 0);
