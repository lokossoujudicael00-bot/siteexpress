import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { styleFor } from "@/lib/themes";
import { UI, legalText } from "@/lib/i18n";
import "../site.css";
export const dynamic = "force-dynamic";

export default async function Legal({ params }: { params: Promise<{ slug: string; doc: string }> }) {
  const { slug, doc } = await params;
  if (!["confidentialite", "conditions", "mentions-legales"].includes(doc)) notFound();
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();
  const c: any = s.config || {};
  const lang: string = UI[c.lang] ? c.lang : "fr";
  const t: any = UI[lang];
  const st = styleFor(c.theme || "generic", slug);
  const txt = legalText(lang === "fr" ? "fr" : "en", doc, s);
  return (
    <div className="sx" data-f={st.font} style={{ ["--h" as any]: st.hue }}>
      <nav className="sx-nav">
        <div className="sx-wrap">
          <a className="sx-brand" href={`/${slug}`}>← {s.name}</a>
        </div>
      </nav>
      <main className="sx-legal">
        <h1>{txt.title}</h1>
        {txt.p.map((x: string, i: number) => (<p key={i}>{x}</p>))}
        <p style={{ marginTop: 30, fontSize: 13, color: "var(--mute)" }}>{t.built}</p>
      </main>
    </div>
  );
}
