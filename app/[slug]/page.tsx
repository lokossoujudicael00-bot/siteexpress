import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { THEMES, hueFor } from "@/lib/themes";
import { UI, PRICES } from "@/lib/i18n";
import "./site.css";
export const dynamic = "force-dynamic";

function intl(p: string): string {
  const d = (p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  return "";
}

export default async function Shop({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();
  const c: any = s.config || {};
  const lang: string = UI[c.lang] ? c.lang : "fr";
  const t: any = UI[lang];
  const theme: any = THEMES[c.theme] || THEMES.generic;
  const hue = hueFor(c.theme || "generic", slug);
  const preview = s.status === "preview";
  const price: any = PRICES[c.currency] || PRICES.EUR;
  const shopWa = intl(c.phone || "");
  const myWa = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  const payLink = process.env.NEXT_PUBLIC_PAY_LINK || "";
  const payHref = payLink || (myWa ? `https://wa.me/${myWa}?text=${encodeURIComponent(t.payMsg + " : " + s.name + " (" + slug + ")")}` : "#");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + (c.address || ""))}`;
  const services: any[] = c.services || [];
  const faq: any[] = c.faq || [];
  const photos: string[] = c.photos || [];
  return (
    <div className="sx" style={{ ["--h" as any]: hue }}>
      <nav className="sx-nav">
        <div className="sx-wrap">
          <span className="sx-brand">{s.name}</span>
          <div className="sx-links">
            <a className="l" href="#services">{t.navServices}</a>
            <a className="l" href="#apropos">{t.navAbout}</a>
            <a className="l" href="#contact">{t.navContact}</a>
            <a className="sx-btn sm" href="#reserver">{t.book}</a>
          </div>
        </div>
      </nav>

      <header className="sx-hero">
        <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
        <span className="sx-emoji">{theme.emojis[0]}</span>
        <div className="sx-wrap" style={{ position: "relative" }}>
          <h1 className="sx-up">{s.name}</h1>
          <p className="sx-up d1">{c.tagline}</p>
          <div className="cta sx-up d2">
            <a className="sx-btn alt" href="#reserver">{t.book}</a>
            {c.phone ? <a className="sx-btn ghost" href={`tel:${c.phone.replace(/\s/g, "")}`}>{t.call}</a> : null}
            {shopWa ? <a className="sx-btn ghost" href={`https://wa.me/${shopWa}`}>{t.wa}</a> : null}
          </div>
        </div>
      </header>

      {c.about ? (
        <section className="sx-sec" id="apropos">
          <div className="sx-wrap sx-reveal">
            <h2>{t.aboutTitle}</h2>
            <p className="lead">{c.about}</p>
          </div>
        </section>
      ) : null}

      <section className="sx-sec soft" id="services">
        <div className="sx-wrap">
          <h2 className="sx-reveal">{c.servicesTitle || t.servicesTitle}</h2>
          <div className="sx-grid">
            {services.map((x: any, i: number) => (
              <div className="sx-card sx-reveal" key={i}>
                <div className="ic">{theme.emojis[i % theme.emojis.length]}</div>
                <h3>{x.name}</h3>
                {x.desc ? <p>{x.desc}</p> : null}
                {x.price ? <b>{x.price}</b> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {photos.length > 0 ? (
        <section className="sx-sec">
          <div className="sx-wrap">
            <div className="sx-gal">
              {photos.map((u: string) => (<img key={u} src={u} alt={s.name} />))}
            </div>
          </div>
        </section>
      ) : null}

      {faq.length > 0 ? (
        <section className="sx-sec">
          <div className="sx-wrap sx-faq">
            <h2 className="sx-reveal">{t.faqTitle}</h2>
            {faq.map((f: any, i: number) => (
              <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sx-sec soft" id="contact">
        <div className="sx-wrap">
          <h2 className="sx-reveal">{t.contactTitle}</h2>
          <div className="sx-info">
            {c.address ? (<div className="box"><small>{t.address}</small>{c.address}<br /><a href={mapHref} style={{ color: "var(--a)", fontWeight: 700 }}>{t.map} →</a></div>) : (<div className="box"><small>{t.address}</small><a href={mapHref} style={{ color: "var(--a)", fontWeight: 700 }}>{t.map} →</a></div>)}
            {c.hours ? (<div className="box"><small>{t.hours}</small>{c.hours}</div>) : null}
            {c.phone ? (<div className="box"><small>{t.phone}</small><a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></div>) : null}
          </div>
        </div>
      </section>

      <section className="sx-sec" id="reserver">
        <div className="sx-wrap">
          <h2 className="sx-reveal">{t.bookTitle}</h2>
          {sp.ok ? <div className="sx-ok">{t.bOk}</div> : null}
          <form action="/api/book" method="post" className="sx-form">
            <input type="hidden" name="slug" value={s.slug} />
            <input name="name" placeholder={t.bName} required />
            <input name="contact" placeholder={t.bContact} required />
            <input name="when" placeholder={t.bWhen} required />
            <textarea name="note" placeholder={t.bNote} rows={3} />
            <button type="submit" className="sx-btn">{t.bSend}</button>
          </form>
        </div>
      </section>

      {preview ? (
        <section className="sx-sec sx-offer" id="offre">
          <div className="sx-wrap">
            <span className="sx-badge">{t.launch}</span>
            <h2>{t.offerTitle}</h2>
            <h3 style={{ marginTop: 26, fontSize: 20 }}>{t.howTitle}</h3>
            <div className="sx-steps">
              <div className="sx-step"><b>1</b><p style={{ margin: 0 }}>{t.s1}</p></div>
              <div className="sx-step"><b>2</b><p style={{ margin: 0 }}>{t.s2}</p></div>
              <div className="sx-step"><b>3</b><p style={{ margin: 0 }}>{t.s3}</p></div>
            </div>
            <div className="sx-price">
              <div className="big">{price.setup}<s>{price.old}</s></div>
              <div style={{ color: "var(--mute)" }}>{t.setup}</div>
              <div style={{ marginTop: 10, fontWeight: 700 }}>+ {price.month} <span style={{ fontWeight: 400, color: "var(--mute)" }}>{t.monthly}</span></div>
              <ul>{t.inc.map((x: string, i: number) => (<li key={i}>{x}</li>))}</ul>
              <a className="sx-btn" href={payHref}>{t.pay}</a>
              {myWa ? (<p style={{ marginTop: 14 }}><a href={`https://wa.me/${myWa}`} style={{ color: "var(--a)", fontWeight: 700 }}>{t.ask} →</a></p>) : null}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="sx-foot" style={preview ? { paddingBottom: 90 } : undefined}>
        <div className="sx-wrap">
          <div className="row">
            <div>© {new Date().getFullYear()} {s.name} — {t.rights}</div>
            <div>
              <a href={`/${slug}/confidentialite`}>{t.privacy}</a>
              <a href={`/${slug}/conditions`}>{t.terms}</a>
              <a href={`/${slug}/mentions-legales`}>{t.notice}</a>
            </div>
          </div>
          <div style={{ marginTop: 10, opacity: 0.7 }}>{t.built}</div>
        </div>
      </footer>

      {preview ? (
        <div className="sx-bar">
          <span>{t.bar}</span>
          <a className="sx-btn sm" href="#offre">{t.barBtn}</a>
        </div>
      ) : null}
    </div>
  );
}
