// Usage : node --env-file=.env.local scripts/send.mjs 10
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
const n = Number(process.argv[2] || 10);
if (!process.env.SITE_URL || process.env.SITE_URL.includes("localhost")) { console.log("SITE_URL doit etre ton adresse Vercel (pas localhost). Arret."); process.exit(1); }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
const TXT = {
  fr: { sub: (n) => `Votre site web pour ${n} : aperçu gratuit`, body: (n, l) => `Bonjour,\n\nEn cherchant ${n} sur Google Maps, j'ai vu que vous n'avez pas encore de site web. J'ai donc préparé un aperçu gratuit, à votre nom :\n\n${l}\n\nIl comprend vos services, un formulaire de réservation et les pages légales. Le tarif et le bouton pour le mettre en ligne sont en bas de la page.\n\nSi vous ne voulez plus recevoir de message de ma part, répondez « STOP ».\n\nCordialement,\nRufin LOKOSSOU\nSiteExpress` },
  en: { sub: (n) => `A free website preview for ${n}`, body: (n, l) => `Hello,\n\nWhile looking for ${n} on Google Maps, I noticed you don't have a website yet. So I prepared a free preview in your name:\n\n${l}\n\nIt includes your services, a booking form and legal pages. The price and the button to put it online are at the bottom of the page.\n\nIf you do not want to receive messages from me, reply "STOP".\n\nBest regards,\nRufin LOKOSSOU\nSiteExpress` },
  es: { sub: (n) => `Vista previa gratuita del sitio web de ${n}`, body: (n, l) => `Hola,\n\nBuscando ${n} en Google Maps vi que aún no tiene sitio web. Por eso preparé una vista previa gratuita a su nombre:\n\n${l}\n\nIncluye sus servicios, un formulario de reservas y las páginas legales. El precio y el botón para publicarlo están al final de la página.\n\nSi no desea recibir más mensajes míos, responda "STOP".\n\nSaludos,\nRufin LOKOSSOU\nSiteExpress` },
  pt: { sub: (n) => `Pré-visualização gratuita do site de ${n}`, body: (n, l) => `Olá,\n\nAo procurar ${n} no Google Maps, vi que ainda não tem site. Por isso preparei uma pré-visualização gratuita em seu nome:\n\n${l}\n\nInclui os seus serviços, um formulário de reservas e as páginas legais. O preço e o botão para o publicar estão no fim da página.\n\nSe não quiser receber mais mensagens minhas, responda "STOP".\n\nCumprimentos,\nRufin LOKOSSOU\nSiteExpress` },
};
const { data: shops } = await db.from("shops").select("*").eq("status", "preview").is("contacted_at", null).not("owner_email", "is", null).limit(n);
console.log((shops || []).length + " commerces à contacter");
for (const s of shops || []) {
  const lang = TXT[s.config?.lang] ? s.config.lang : "fr";
  const link = `${process.env.SITE_URL}/${s.slug}`;
  try {
    await t.sendMail({ from: `Rufin – SiteExpress <${process.env.GMAIL_USER}>`, to: s.owner_email, subject: TXT[lang].sub(s.name), text: TXT[lang].body(s.name, link) });
    await db.from("shops").update({ contacted_at: new Date().toISOString() }).eq("id", s.id);
    console.log("Envoyé à", s.name, s.owner_email);
  } catch (e) { console.log("Échec", s.name, e.message); }
  await new Promise((r) => setTimeout(r, 45000 + Math.random() * 45000));
}
