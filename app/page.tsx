import "./[slug]/site.css";
import { PRICES } from "@/lib/i18n";

export default function Home() {
  const myWa = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");
  const p = PRICES.EUR;
  const contact = myWa ? `https://wa.me/${myWa}` : "#";
  return (
    <div className="sx" style={{ ["--h" as any]: 205 }}>
      <header className="sx-hero">
        <span className="sx-blob b1" /><span className="sx-blob b2" />
        <div className="sx-wrap" style={{ position: "relative" }}>
          <h1 className="sx-up">Votre site web professionnel, prêt en 24 h</h1>
          <p className="sx-up d1">SiteExpress crée le site de votre commerce : services, horaires, réservations, pages légales. Vous le voyez avant de payer.</p>
          <div className="cta sx-up d2"><a className="sx-btn alt" href={contact}>Nous écrire sur WhatsApp</a></div>
        </div>
      </header>
      <section className="sx-sec">
        <div className="sx-wrap">
          <h2>Comment ça marche</h2>
          <div className="sx-grid">
            <div className="sx-card"><div className="ic">🔎</div><h3>1. Nous préparons votre aperçu</h3><p>Gratuit, à votre nom, avec vos informations.</p></div>
            <div className="sx-card"><div className="ic">👀</div><h3>2. Vous le regardez</h3><p>Il est déjà en ligne : vous voyez le résultat.</p></div>
            <div className="sx-card"><div className="ic">🚀</div><h3>3. Vous le mettez en ligne</h3><p>Paiement une seule fois, puis un petit abonnement mensuel.</p></div>
          </div>
        </div>
      </section>
      <section className="sx-sec soft">
        <div className="sx-wrap">
          <h2>Tarif</h2>
          <p className="lead">{p.setup} une seule fois (au lieu de {p.old}), puis {p.month} par mois : hébergement, sécurité et modifications.</p>
        </div>
      </section>
      <footer className="sx-foot"><div className="sx-wrap">© {new Date().getFullYear()} SiteExpress</div></footer>
    </div>
  );
}
