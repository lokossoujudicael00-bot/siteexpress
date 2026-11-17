import "./[slug]/site.css";
import { PRICES } from "@/lib/i18n";
import { CATEGORIES, COUNTRIES } from "@/lib/countries";
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const myWa = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  const p = PRICES.EUR;
  const inp: any = { padding: 14, fontSize: 16, border: "1.5px solid #dfe3ec", borderRadius: 12, width: "100%", fontFamily: "inherit" };
  return (
    <div className="sx" style={{ ["--h" as any]: 205 }}>
      <header className="sx-hero">
        <span className="sx-blob b1" /><span className="sx-blob b2" />
        <div className="sx-wrap" style={{ position: "relative" }}>
          <h1 className="sx-up">Votre site web professionnel, créé en quelques secondes</h1>
          <p className="sx-up d1">SiteExpress crée le site de votre commerce : services, photos, horaires, réservations et commandes, pages légales. Vous le voyez avant de payer.</p>
          <div className="cta sx-up d2">
            <a className="sx-btn alt" href="#creer">Créer mon site maintenant</a>
            {myWa ? <a className="sx-btn ghost" href={`https://wa.me/${myWa}`}>WhatsApp</a> : null}
          </div>
        </div>
      </header>

      <section className="sx-sec" id="creer">
        <div className="sx-wrap">
          <h2>Créez votre site maintenant</h2>
          <p className="lead">Remplissez ces informations : votre site est créé tout de suite (20 à 40 secondes) et vous recevez son lien par e-mail.</p>
          {sp.err === "wait" ? <div className="sx-ok" style={{ background: "#fff6e0", color: "#7a5200" }}>Beaucoup de demandes en ce moment. Réessayez dans une heure.</div> : null}
          {sp.err === "1" ? <div className="sx-ok" style={{ background: "#fdeaea", color: "#8a1f1f" }}>Un champ obligatoire manque ou la création a échoué. Vérifiez et réessayez.</div> : null}
          <form action="/api/signup" method="post" className="sx-form" style={{ maxWidth: 640 }}>
            <input name="company" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} aria-hidden="true" />
            <input name="name" placeholder="Nom de votre commerce *" required style={inp} />
            <select name="tag" style={inp}>{CATEGORIES.map(([label, tag]) => (<option key={tag} value={tag}>{label}</option>))}</select>
            <input name="city" placeholder="Ville *" required style={inp} />
            <input name="country" list="pays" placeholder="Pays (code : BJ, FR, US...)" defaultValue="BJ" required style={inp} />
            <datalist id="pays">{Object.keys(COUNTRIES).map((c) => (<option key={c} value={c} />))}</datalist>
            <input name="email" type="email" placeholder="Votre e-mail * (pour recevoir votre site)" required style={inp} />
            <input name="phone" placeholder="Téléphone avec indicatif (ex. +229 ...)" style={inp} />
            <input name="address" placeholder="Adresse (facultatif)" style={inp} />
            <input name="hours" placeholder="Horaires (facultatif)" style={inp} />
            <button type="submit" className="sx-btn" style={{ padding: 16 }}>Créer mon site</button>
          </form>
        </div>
      </section>

      <section className="sx-sec soft">
        <div className="sx-wrap">
          <h2>Comment ça marche</h2>
          <div className="sx-grid">
            <div className="sx-card"><div className="ic" style={{ fontWeight: 800, fontSize: 22, color: "var(--a)" }}>1</div><h3>Vous donnez vos informations</h3><p>Nom, ville, téléphone, e-mail : deux minutes.</p></div>
            <div className="sx-card"><div className="ic" style={{ fontWeight: 800, fontSize: 22, color: "var(--a)" }}>2</div><h3>Votre site est créé</h3><p>Textes, photos, services, réservations et commandes.</p></div>
            <div className="sx-card"><div className="ic" style={{ fontWeight: 800, fontSize: 22, color: "var(--a)" }}>3</div><h3>Vous le mettez en ligne</h3><p>Paiement une seule fois, puis vous modifiez tout vous-même.</p></div>
          </div>
        </div>
      </section>

      <section className="sx-sec">
        <div className="sx-wrap">
          <h2>Tarif</h2>
          <p className="lead">{p.setup} une seule fois (au lieu de {p.old}), puis {p.month} par mois : hébergement, sécurité et modifications.</p>
        </div>
      </section>
      <footer className="sx-foot"><div className="sx-wrap">© {new Date().getFullYear()} SiteExpress</div></footer>
    </div>
  );
}
