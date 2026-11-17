import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CATEGORIES, COUNTRIES, WA_MSG, intlPhone } from "@/lib/countries";
import { sign } from "@/lib/sign";
import "../[slug]/site.css";
export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string; created?: string; err?: string }> }) {
  const sp = await searchParams;
  if (!process.env.ADMIN_KEY || sp.key !== process.env.ADMIN_KEY) notFound();
  const base = process.env.SITE_URL || "";
  let created: any = null;
  if (sp.created) { const r = await db.from("shops").select("*").eq("slug", sp.created).single(); created = r.data; }
  const { data: list } = await db.from("shops").select("slug,name,status,owner_email,config,edit_token,created_at").order("created_at", { ascending: false }).limit(20);
  const inp: any = { padding: 12, fontSize: 16, border: "1.5px solid #dfe3ec", borderRadius: 10, width: "100%" };
  const lang = created ? ((created.config || {}).lang || "fr") : "fr";
  const wa = created && intlPhone((created.config || {}).phone || "") ? `https://wa.me/${intlPhone(created.config.phone)}?text=${encodeURIComponent((WA_MSG[lang] || WA_MSG.fr)(created.name, `${base}/${created.slug}`))}` : "";
  return (
    <div className="sx" style={{ ["--h" as any]: 215 }}>
      <main className="sx-wrap" style={{ padding: "30px 20px 80px", maxWidth: 760 }}>
        <h1 style={{ fontSize: 28 }}>Créer un site à la main</h1>
        <p style={{ color: "#5d6577" }}>Pour tout commerce trouvé ailleurs (Google Maps, Facebook, bouche à oreille). La création prend 20 à 40 secondes.</p>
        {sp.err ? <div className="sx-ok" style={{ background: "#fdeaea", color: "#8a1f1f" }}>Échec : réessaie (le nom est obligatoire).</div> : null}
        {created ? (
          <div className="sx-ok">
            Site créé : <a href={`${base}/${created.slug}`}><b>{created.name}</b></a><br />
            Aperçu : {base}/{created.slug}<br />
            Lien de modification : {base}/edit/{created.edit_token}<br />
            {wa ? <a href={wa}>→ Ouvrir WhatsApp avec le message prêt</a> : null}
          </div>
        ) : null}
        <form action="/api/admin/create" method="post" style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <input type="hidden" name="key" value={sp.key} />
          <input name="name" placeholder="Nom du commerce *" required style={inp} />
          <select name="tag" style={inp}>{CATEGORIES.map(([label, tag]) => (<option key={tag} value={tag}>{label}</option>))}</select>
          <input name="city" placeholder="Ville (ex. Cotonou)" required style={inp} />
          <input name="country" list="pays" placeholder="Code du pays (ex. BJ, FR, US)" defaultValue="BJ" required style={inp} />
          <datalist id="pays">{Object.keys(COUNTRIES).map((c) => (<option key={c} value={c} />))}</datalist>
          <input name="phone" placeholder="Téléphone avec indicatif (ex. +229 01 ...)" style={inp} />
          <input name="email" type="email" placeholder="E-mail (facultatif)" style={inp} />
          <input name="address" placeholder="Adresse (facultatif)" style={inp} />
          <input name="hours" placeholder="Horaires (facultatif)" style={inp} />
          <label style={{ fontWeight: 400 }}><input type="checkbox" name="sendmail" /> Envoyer l'aperçu par e-mail au commerçant (si e-mail renseigné)</label>
          <button type="submit" className="sx-btn" style={{ padding: 16 }}>Créer le site</button>
        </form>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>Derniers sites</h2>
        {(list || []).map((s: any) => (
          <div key={s.slug} className="sx-card" style={{ marginTop: 10 }}>
            <b>{s.name}</b> — {s.status}<br />
            <a href={`${base}/${s.slug}`}>Aperçu</a> · <a href={`${base}/edit/${s.edit_token}`}>Modifier</a>
            {s.status === "payment_declared" ? <> · <a href={`${base}/confirm/${s.slug}?sig=${sign(s.slug)}`} style={{ color: "#c0392b", fontWeight: 700 }}>Confirmer le paiement</a></> : null}
            <br /><span style={{ color: "#5d6577", fontSize: 14 }}>{s.owner_email || "pas d'e-mail"}</span>
          </div>
        ))}
      </main>
    </div>
  );
}
