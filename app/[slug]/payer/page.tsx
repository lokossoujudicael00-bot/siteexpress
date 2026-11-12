import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { styleFor } from "@/lib/themes";
import { UI, PRICES, TP } from "@/lib/i18n";
import { verifyTransaction, SETUP_XOF } from "@/lib/fedapay";
import { activateShop } from "@/lib/activate";
import "../site.css";
export const dynamic = "force-dynamic";

export default async function Pay({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ id?: string; transaction_id?: string; sent?: string; err?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  let { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) notFound();

  // Retour de la page de paiement : on vérifie auprès de FedaPay, puis on livre le site
  const txId = sp.id || sp.transaction_id;
  if (txId && s.status !== "live") {
    const paidSlug = await verifyTransaction(String(txId));
    if (paidSlug === slug) {
      await activateShop(slug, "FedaPay (carte / Mobile Money)");
      const r = await db.from("shops").select("*").eq("slug", slug).single();
      s = r.data || s;
    }
  }

  const c: any = s.config || {};
  const lang: string = UI[c.lang] ? c.lang : "fr";
  const tp: any = TP[lang] || TP.en;
  const t: any = UI[lang];
  const st = styleFor(c.theme || "generic", slug);
  const price: any = PRICES[c.currency] || PRICES.EUR;
  const xof = `${SETUP_XOF.toLocaleString("fr-FR")} F CFA`;
  const online = !!process.env.FEDAPAY_SECRET_KEY;
  const payPhone = process.env.PAY_PHONE || "";
  const payName = process.env.PAY_NAME || "";
  const payCountry = process.env.PAY_COUNTRY || "Bénin";
  const tapUrl = process.env.PAY_TAPTAP_URL || "";
  const live = s.status === "live";

  return (
    <div className="sx" data-f={st.font} style={{ ["--h" as any]: st.hue }}>
      <nav className="sx-nav"><div className="sx-wrap"><a className="sx-brand" href={`/${slug}`}>{tp.back}</a></div></nav>
      <main className="sx-pay">
        <h1 style={{ fontSize: 30 }}>{tp.title}</h1>
        <p style={{ color: "var(--mute)" }}>{tp.intro}</p>

        {live ? <div className="panel"><div className="ok">{tp.paid}</div><p><a className="sx-btn" href={`/${slug}`}>{s.name}</a></p></div> : null}
        {!live && txId ? <div className="panel"><div className="warn">{tp.notPaid}</div></div> : null}
        {sp.sent ? <div className="panel"><div className="ok">{tp.sent}</div></div> : null}

        {!live ? (
          <>
            <div className="panel">
              <div className="kv"><span>{tp.amount}</span><b className="big">{online ? xof : price.setup}</b></div>
              {online && c.currency !== "XOF" && c.currency !== "XAF" ? <div style={{ color: "var(--mute)", fontSize: 14 }}>≈ {price.setup}</div> : null}
            </div>

            {online ? (
              <div className="panel">
                <h2>{tp.online}</h2>
                <p style={{ color: "var(--mute)" }}>{tp.onlineHelp}</p>
                {sp.err ? <div className="warn" style={{ marginBottom: 12 }}>⚠️</div> : null}
                <form action="/api/pay/start" method="post" className="sx-form">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="email" name="email" placeholder={tp.email} required />
                  <button type="submit" className="sx-btn">{tp.go}</button>
                </form>
              </div>
            ) : null}

            {payPhone ? (
              <div className="panel">
                <h2>{tp.manualTitle}</h2>
                <h3 style={{ fontSize: 17, marginTop: 14 }}>{tp.momo}</h3>
                <p style={{ color: "var(--mute)" }}>{tp.momoText}</p>
                <div className="kv"><span>{tp.name}</span><b>{payName}</b></div>
                <div className="kv"><span>{tp.phone}</span><b>{payPhone}</b></div>
                <div className="kv"><span>{tp.country}</span><b>{payCountry}</b></div>
                <div className="kv"><span>{tp.amount}</span><b>{xof}</b></div>
                {tapUrl ? (
                  <>
                    <h3 style={{ fontSize: 17, marginTop: 20 }}>{tp.tap}</h3>
                    <p style={{ color: "var(--mute)" }}>{tp.tapText}</p>
                    <div className="kv"><span>{tp.amount}</span><b>{PRICES.EUR.setup}</b></div>
                    <p><a className="sx-btn sm" href={tapUrl}>{tp.tapOpen}</a></p>
                  </>
                ) : null}
                <h3 style={{ fontSize: 17, marginTop: 22 }}>{tp.declare}</h3>
                <form action="/api/pay/declare" method="post" className="sx-form">
                  <input type="hidden" name="slug" value={slug} />
                  <input name="payer_name" placeholder={tp.payerName} required />
                  <input type="email" name="payer_email" placeholder={tp.email} required />
                  <input name="payer_ref" placeholder={tp.payerRef} required />
                  <button type="submit" className="sx-btn">{tp.send}</button>
                </form>
              </div>
            ) : null}
          </>
        ) : null}
        <p style={{ marginTop: 30, fontSize: 13, color: "var(--mute)" }}>{t.built}</p>
      </main>
    </div>
  );
}
