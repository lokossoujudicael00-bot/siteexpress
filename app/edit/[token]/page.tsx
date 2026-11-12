import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ResizeInput from "@/components/ResizeInput";
import "../../[slug]/site.css";
export const dynamic = "force-dynamic";

export default async function Edit({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const { data: s } = await db.from("shops").select("*").eq("edit_token", token).single();
  if (!s) notFound();
  const c: any = s.config || {};
  const services: any[] = c.services || [];
  const rows = Math.max(services.length + 3, 6);
  const { data: b } = await db.from("bookings").select("*").eq("shop_id", s.id).order("created_at", { ascending: false }).limit(30);
  const lab: any = { display: "grid", gap: 6, fontWeight: 600, fontSize: 14 };
  return (
    <div className="sx" style={{ ["--h" as any]: 210 }}>
      <nav className="sx-nav"><div className="sx-wrap"><span className="sx-brand">{s.name}</span><a className="sx-btn sm" href={`/${s.slug}`}>Voir mon site</a></div></nav>
      <main className="sx-wrap" style={{ padding: "30px 20px 80px", maxWidth: 760 }}>
        <h1 style={{ fontSize: 28 }}>Mon espace</h1>
        {sp.saved ? <div className="sx-ok">Modifications enregistrées.</div> : null}
        <form action="/api/edit" method="post" encType="multipart/form-data" style={{ display: "grid", gap: 14, marginTop: 20 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="rows" value={rows} />
          <label style={lab}>Phrase d'accroche<input name="tagline" defaultValue={c.tagline || ""} style={{ padding: 12, fontSize: 16 }} /></label>
          <label style={lab}>À propos (quelques phrases)<textarea name="about" rows={4} defaultValue={c.about || ""} style={{ padding: 12, fontSize: 16 }} /></label>
          <label style={lab}>Horaires<input name="hours" defaultValue={c.hours || ""} style={{ padding: 12, fontSize: 16 }} /></label>
          <label style={lab}>Adresse<input name="address" defaultValue={c.address || ""} style={{ padding: 12, fontSize: 16 }} /></label>
          <label style={lab}>Téléphone (avec l'indicatif, ex. +229...)<input name="phone" defaultValue={c.phone || ""} style={{ padding: 12, fontSize: 16 }} /></label>
          <div style={lab}>Grande photo du haut de la page{c.hero ? <img src={c.hero} alt="" style={{ width: 220, borderRadius: 10 }} /> : null}<ResizeInput name="hero_file" />{c.hero ? <label style={{ fontWeight: 400 }}><input type="checkbox" name="hero_del" /> Retirer cette photo</label> : null}</div>

          <h2 style={{ fontSize: 22, marginTop: 10 }}>Mes plats, produits ou services</h2>
          <p style={{ color: "#5d6577", margin: 0 }}>Pour chacun : nom, description, prix et photo. Les lignes vides sont ignorées.</p>
          {Array.from({ length: rows }).map((_, i) => {
            const x: any = services[i] || {};
            return (
              <div key={i} className="sx-card" style={{ display: "grid", gap: 8 }}>
                <input name={`name_${i}`} defaultValue={x.name || ""} placeholder="Nom (ex. Poulet braisé)" style={{ padding: 10, fontSize: 16 }} />
                <input name={`desc_${i}`} defaultValue={x.desc || ""} placeholder="Courte description" style={{ padding: 10, fontSize: 16 }} />
                <input name={`price_${i}`} defaultValue={x.price || ""} placeholder="Prix (ex. 3 500 F)" style={{ padding: 10, fontSize: 16 }} />
                <input type="hidden" name={`img_${i}`} value={x.img || ""} />
                {x.img ? <img src={x.img} alt="" style={{ width: 160, borderRadius: 10 }} /> : null}
                <ResizeInput name={`file_${i}`} />
                {x.name ? <label style={{ fontWeight: 400 }}><input type="checkbox" name={`del_${i}`} /> Supprimer cette ligne</label> : null}
              </div>
            );
          })}
          <div style={lab}>Ajouter une photo à la galerie<ResizeInput name="gallery_file" /></div>
          <button type="submit" className="sx-btn" style={{ padding: 16 }}>Enregistrer</button>
        </form>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>Réservations et commandes reçues</h2>
        {(b || []).length === 0 ? <p style={{ color: "#5d6577" }}>Rien pour l'instant.</p> : null}
        {(b || []).map((r: any) => (<p key={r.id}><b>{r.customer_name}</b> – {r.customer_contact}<br />{r.requested_at} {r.note}</p>))}
      </main>
    </div>
  );
}
