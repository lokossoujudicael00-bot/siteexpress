import { db } from "@/lib/db";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Shop({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();
  const c = s.config || {};
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 20, fontFamily: "Georgia,serif" }}>
      <h1 style={{ fontSize: 40 }}>{s.name}</h1>
      <p>{c.tagline}</p>
      {(c.photos || []).map((u: string) => <img key={u} src={u} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 8 }} />)}
      <h2>{c.servicesTitle || "Services"}</h2>
      {(c.services || []).map((x: any) => (
        <div key={x.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ddd" }}>
          <b>{x.name}</b><span>{x.price}</span>
        </div>
      ))}
      <h2>Infos pratiques</h2>
      <p>{c.hours}<br />{c.address}<br />{c.phone}</p>
      <h2>Réserver</h2>
      <form action="/api/book" method="post" style={{ display: "grid", gap: 8 }}>
        <input type="hidden" name="slug" value={s.slug} />
        <input name="name" placeholder="Votre nom" required />
        <input name="contact" placeholder="Téléphone ou e-mail" required />
        <input name="when" placeholder="Jour et heure souhaités" required />
        <textarea name="note" placeholder="Message (facultatif)" />
        <button type="submit">Envoyer ma demande</button>
      </form>
      {s.status === "preview" && <p style={{ background: "#fff3cd", padding: 10, marginTop: 24 }}>Aperçu créé pour vous par SiteExpress. Il passe en ligne dès le paiement.</p>}
    </main>
  );
}
