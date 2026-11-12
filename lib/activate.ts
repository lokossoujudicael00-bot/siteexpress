import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

// Met un site en ligne et envoie au client son lien de modification. Sans effet s'il est déjà en ligne.
export async function activateShop(slug: string, method: string): Promise<{ ok: boolean; already?: boolean }> {
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s) return { ok: false };
  if (s.status === "live") return { ok: true, already: true };
  const config = { ...(s.config || {}), paidWith: method, paidAt: new Date().toISOString() };
  await db.from("shops").update({ status: "live", config }).eq("id", s.id);
  const base = process.env.SITE_URL || "";
  const text = `Bonjour,\n\nMerci pour votre paiement ! Votre site est maintenant en ligne :\n${base}/${s.slug}\n\nPour ajouter vos photos, vos produits, vos prix ou changer vos textes, utilisez ce lien personnel (gardez-le pour vous) :\n${base}/edit/${s.edit_token}\n\nLes réservations et commandes arriveront par e-mail à cette adresse.\n\nCordialement,\nRufin – SiteExpress`;
  try { if (s.owner_email) await sendMail(s.owner_email, `Votre site ${s.name} est en ligne`, text); } catch (e) { console.log("mail client", e); }
  try { if (process.env.GMAIL_USER) await sendMail(process.env.GMAIL_USER, `Paiement reçu – ${s.name}`, `Site livré automatiquement : ${base}/${s.slug}\nMoyen : ${method}\nE-mail client : ${s.owner_email || "inconnu"}`); } catch (e) { console.log("mail admin", e); }
  return { ok: true };
}
