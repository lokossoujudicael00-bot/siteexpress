// Usage : node --env-file=.env.local scripts/activate.mjs slug-du-commerce
// A lancer APRES avoir reçu le paiement.
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
const slug = process.argv[2];
if (!slug) { console.log("Donne le slug du commerce."); process.exit(1); }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: s, error } = await db.from("shops").update({ status: "live" }).eq("slug", slug).select().single();
if (error || !s) { console.log("Introuvable :", error?.message); process.exit(1); }
console.log("Site en ligne :", `${process.env.SITE_URL}/${s.slug}`);
if (s.owner_email) {
  const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  await t.sendMail({
    from: `Rufin – SiteExpress <${process.env.GMAIL_USER}>`, to: s.owner_email,
    subject: `Votre site ${s.name} est en ligne`,
    text: `Bonjour,\n\nMerci ! Votre site est en ligne : ${process.env.SITE_URL}/${s.slug}\n\nPour ajouter vos photos, vos produits ou changer vos prix, utilisez ce lien personnel (gardez-le pour vous) :\n${process.env.SITE_URL}/edit/${s.edit_token}\n\nLes demandes de réservation arriveront par e-mail.\n\nCordialement,\nRufin – SiteExpress`,
  });
  console.log("E-mail envoyé au commerçant.");
}
