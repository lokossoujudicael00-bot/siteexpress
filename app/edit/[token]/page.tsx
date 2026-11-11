import { db } from "@/lib/db";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Edit({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: s } = await db.from("shops").select("*").eq("edit_token", token).single();
  if (!s) notFound();
  const c = s.config || {};
  const { data: b } = await db.from("bookings").select("*").eq("shop_id", s.id).order("created_at", { ascending: false }).limit(20);
  const lines = (c.services || []).map((x: any) => `${x.name} | ${x.price}`).join("\n");
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Mon site : {s.name}</h1>
      <p><a href={`/${s.slug}`}>Voir mon site</a></p>
      <form action="/api/edit" method="post" encType="multipart/form-data" style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="token" value={token} />
        <label>Phrase d'accroche<input name="tagline" defaultValue={c.tagline} /></label>
        <label>Horaires<input name="hours" defaultValue={c.hours} /></label>
        <label>Adresse<input name="address" defaultValue={c.address} /></label>
        <label>Téléphone<input name="phone" defaultValue={c.phone} /></label>
        <label>Services ou produits (une ligne : nom | prix)<textarea name="services" rows={8} defaultValue={lines} /></label>
        <label>Ajouter une photo<input type="file" name="photo" accept="image/*" /></label>
        <button type="submit" style={{ padding: 12 }}>Enregistrer</button>
      </form>
      <h2>Réservations reçues</h2>
      {(b || []).map((r: any) => <p key={r.id}><b>{r.customer_name}</b> – {r.customer_contact}<br />{r.requested_at} {r.note}</p>)}
    </main>
  );
}
