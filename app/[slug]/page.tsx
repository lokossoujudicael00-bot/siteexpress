import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { THEMES, styleFor } from "@/lib/themes";
import { UI, PRICES } from "@/lib/i18n";
import "./site.css";
export const dynamic = "force-dynamic";

function intl(p: string): string {
  const d = (p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  return "";
}

export default async function Shop({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string; item?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();
  const c: any = s.config || {};
  const lang: string = UI[c.lang] ? c.lang : "fr";
  const t: any = UI[lang];
  const theme: any = THEMES[c.theme] || THEMES.generic;
  const st = styleFor(c.theme || "generic", slug);
  const live = s.status === "live";
  const pending = s.status === "payment_declared";
  const price: any = PRICES[c.currency] || PRICES.EUR;
  const shopWa = intl(c.phone || "");
  const myWa = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + (c.address || ""))}`;
  const services: any[] = c.services || [];
  const faq: any[] = c.faq || [];
  const why: any[] = c.highlights || [];
  const photos: string[] = c.photos || [];
  const hero: string = c.hero || "";
  const itemTarget = theme.orders ? "commander" : "reserver";
  return (
    <div className="sx" data-v={st.variant} data-f={st.font} data-r={st.radius} style={{ ["--h" as any]: st.hue }}>
      <nav className="sx-nav">
        <div className="sx-wrap">
          <span className="sx-brand">{s.name}</span>
          <div className="sx-links">
            {services.length > 0 ? <a className="l" href="#services">{t.navServices}</a> : null}
            {c.about ? <a className="l" href="#apropos">{t.navAbout}</a> : null}
            <a className="l" href="#contact">{t.navContact}</a>
            <a className="sx-btn sm" href={`#${itemTarget}`}>{theme.orders ? t.order : t.book}</a>
          </div>
        </div>
      </nav>

      <header className={"sx-hero" + (hero ? " photo" : "")} style={hero ? { backgroundImage: `url(${hero})` } : undefined}>
        <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
        <span className="sx-emoji">{st.emoji}</span>
        <div className="sx-wrap" style={{ position: "relative", zIndex: 1 }}>
          <h1 className="sx-up">{s.name}</h1>
          <p className="sx-up d1">{c.tagline}</p>
          <div className="cta sx-up d2">
            <a className="sx-btn alt" href={`#${itemTarget}`}>{theme.orders ? t.order : t.book}</a>
            {services.length > 0 ? <a className="sx-btn ghost" href="#services">{t.seeMenu}</a> : null}
            {c.phone ? <a className="sx-btn ghost" href={`tel:${c.phone.replace(/\s/g, "")}`}>{t.call}</a> : null}
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

      {why.length > 0 ? (
        <section className="sx-sec" style={{ paddingTop: 0 }}>
          <div className="sx-wrap">
            <h2 className="sx-reveal">{t.why}</h2>
            <div className="sx-why">
              {why.map((w: any, i: number) => (<div key={i} className="sx-reveal"><h3>{w.title}</h3><p>{w.text}</p></div>))}
            </div>
          </div>
        </section>
      ) : null}

      {services.length > 0 ? (
        <section className="sx-sec soft" id="services">
          <div className="sx-wrap">
            <h2 className="sx-reveal">{c.servicesTitle || t.servicesTitle}</h2>
            <div className="sx-grid">
              {services.map((x: any, i: number) => (
                <div className="sx-card sx-reveal" key={i}>
                  {x.img ? <img className="pic" src={x.img} alt={x.name} loading="lazy" /> : <div className="ic">{theme.emojis[i % theme.emojis.length]}</div>}
                  <h3>{x.name}</h3>
                  {x.desc ? <p>{x.desc}</p> : null}
                  <div className="row">
                    {x.price ? <b>{x.price}</b> : <span />}
                    <a className="sx-btn sm" href={`/${slug}?item=${encodeURIComponent(x.name)}#${itemTarget}`}>{theme.orders ? t.order : t.pick}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {photos.length > 0 ? (
        <section className="sx-sec">
          <div className="sx-wrap">
            <div className="sx-gal">
              {photos.map((u: string) => (<img key={u} src={u} alt={s.name} loading="lazy" />))}
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
            <div className="box"><small>{t.address}</small>{c.address ? <>{c.address}<br /></> : null}<a href={mapHref} style={{ color: "var(--a)", fontWeight: 700 }}>{t.map} →</a><br /><a href={mapHref} style={{ color: "var(--a)" }}>{t.reviews} →</a></div>
            {c.hours ? (<div className="box"><small>{t.hours}</small>{c.hours}</div>) : null}
            {c.phone ? (<div className="box"><small>{t.phone}</small><a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></div>) : null}
          </div>
        </div>
      </section>

      {theme.orders ? (
        <section className="sx-sec" id="commander">
          <div className="sx-wrap">
            <h2 className="sx-reveal">{t.orderTitle}</h2>
            {sp.ok === "order" ? <div className="sx-ok">{t.orderOk}</div> : null}
            <form action="/api/order" method="post" className="sx-form">
              <input type="hidden" name="slug" value={s.slug} />
              <input name="item" defaultValue={sp.item || ""} placeholder={t.orderItem} required />
              <input name="qty" type="number" min="1" defaultValue="1" placeholder={t.qty} />
              <input name="name" placeholder={t.bName} required />
              <input name="contact" placeholder={t.bContact} required />
              <textarea name="note" placeholder={t.bNote} rows={2} />
              <button type="submit" className="sx-btn">{t.orderSend}</button>
            </form>
          </div>
        </section>
      ) : null}

      <section className={"sx-sec" + (theme.orders ? " soft" : "")} id="reserver">
        <div className="sx-wrap">
          <h2 className="sx-reveal">{t.bookTitle}</h2>
          {sp.ok === "1" ? <div className="sx-ok">{t.bOk}</div> : null}
          <form action="/api/book" method="post" className="sx-form">
            <input type="hidden" name="slug" value={s.slug} />
            <input name="name" placeholder={t.bName} required />
            <input name="contact" placeholder={t.bContact} required />
            <input name="when" placeholder={t.bWhen} required />
            <textarea name="note" defaultValue={!theme.orders ? sp.item || "" : ""} placeholder={t.bNote} rows={3} />
            <button type="submit" className="sx-btn">{t.bSend}</button>
          </form>
        </div>
      </section>

      {!live ? (
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
              {pending ? <div className="sx-ok" style={{ marginTop: 0 }}>{t.pending}</div> : <a className="sx-btn" href={`/${slug}/payer`}>{t.pay}</a>}
              {myWa ? (<p style={{ marginTop: 14 }}><a href={`https://wa.me/${myWa}`} style={{ color: "var(--a)", fontWeight: 700 }}>{t.ask} →</a></p>) : null}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="sx-foot" style={!live ? { paddingBottom: 90 } : undefined}>
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
          {c.photoCredit ? <div className="sx-credit">Photos : <a href={c.photoCredit === "Unsplash" ? "https://unsplash.com/?utm_source=siteexpress&utm_medium=referral" : "https://www.pexels.com"} style={{ marginRight: 0 }}>{typeof c.photoCredit === "string" ? c.photoCredit : "Pexels"}</a></div> : null}
        </div>
      </footer>

      {shopWa ? <a className="sx-wa" href={`https://wa.me/${shopWa}`} aria-label="WhatsApp">💬</a> : null}

      {!live ? (
        <div className="sx-bar">
          <span>{t.bar}</span>
          <a className="sx-btn sm" href="#offre">{t.barBtn}</a>
        </div>
      ) : null}
    </div>
  );
}
