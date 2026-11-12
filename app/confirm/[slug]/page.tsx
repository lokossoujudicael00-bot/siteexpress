import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { sign } from "@/lib/sign";
import "../../[slug]/site.css";
export const dynamic = "force-dynamic";

export default async function Confirm({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sig?: string; done?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!sp.sig || sp.sig !== sign(slug)) notFound();
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();
  const p: any = (s.config || {}).payment || {};
  return (
    <div className="sx" style={{ ["--h" as any]: 210 }}>
      <main className="sx-pay">
        <h1 style={{ fontSize: 28 }}>Confirmer le paiement</h1>
        <div className="panel">
          <div className="kv"><span>Commerce</span><b>{s.name}</b></div>
          <div className="kv"><span>Client</span><b>{p.name || "—"}</b></div>
          <div className="kv"><span>E-mail</span><b>{s.owner_email || p.email || "—"}</b></div>
          <div className="kv"><span>Référence</span><b>{p.ref || "—"}</b></div>
          <div className="kv"><span>État</span><b>{s.status}</b></div>
        </div>
        {s.status === "live" || sp.done ? (
          <div className="panel"><div className="ok">Site en ligne. Le client a reçu son lien par e-mail.</div><p><a className="sx-btn" href={`/${slug}`}>Voir le site</a></p></div>
        ) : (
          <div className="panel">
            <p>Clique seulement si tu as bien reçu l'argent. Le site est alors livré au client automatiquement.</p>
            <form action="/api/confirm" method="post">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="sig" value={sp.sig} />
              <button type="submit" className="sx-btn">J'ai bien reçu le paiement : livrer le site</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
