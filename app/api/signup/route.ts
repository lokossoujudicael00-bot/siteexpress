import { db } from "@/lib/db";
import { createShop } from "@/lib/generate";
import { sendMail } from "@/lib/mail";
import { NextResponse } from "next/server";
export const maxDuration = 60;

export async function POST(req: Request) {
  const f = await req.formData();
  const base = process.env.SITE_URL || new URL(req.url).origin;
  if (f.get("company")) return NextResponse.redirect(`${base}/`, 303); // piège anti-robots
  const name = String(f.get("name") || "").trim();
  const email = String(f.get("email") || "").trim();
  const city = String(f.get("city") || "").trim();
  if (!name || !city || !email.includes("@")) return NextResponse.redirect(`${base}/?err=1#creer`, 303);
  // Limite : 20 créations automatiques par heure pour protéger les quotas gratuits
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await db.from("shops").select("id", { count: "exact", head: true }).eq("config->>selfServe", "true").gte("created_at", since);
  if ((count || 0) >= 20) return NextResponse.redirect(`${base}/?err=wait#creer`, 303);
  const r = await createShop({
    name, tag: String(f.get("tag") || "shop=yes"), city, country: String(f.get("country") || "FR"),
    phone: String(f.get("phone") || ""), email, address: String(f.get("address") || ""), hours: String(f.get("hours") || ""), extra: { selfServe: true },
  });
  if (!r) return NextResponse.redirect(`${base}/?err=1#creer`, 303);
  const link = `${base}/${r.slug}`;
  const fr = r.lang === "fr";
  try {
    await sendMail(email, fr ? `Votre site ${name} est prêt` : `Your website ${name} is ready`,
      fr ? `Bonjour,\n\nMerci ! Votre site est prêt :\n${link}\n\nPour modifier vos textes, vos prix et vos photos :\n${base}/edit/${r.editToken}\n\nPour le mettre en ligne :\n${link}/payer\n\nCordialement,\nRufin – SiteExpress`
         : `Hello,\n\nThank you! Your website is ready:\n${link}\n\nTo edit your texts, prices and photos:\n${base}/edit/${r.editToken}\n\nTo put it online:\n${link}/payer\n\nBest regards,\nRufin – SiteExpress`);
  } catch (e) { console.log("mail client", e); }
  try { if (process.env.GMAIL_USER) await sendMail(process.env.GMAIL_USER, `Nouvelle inscription : ${name}`, `${name} (${city}, ${f.get("country")})\nE-mail : ${email}\nTéléphone : ${f.get("phone") || "—"}\nSite : ${link}`); } catch {}
  return NextResponse.redirect(`${link}?new=1`, 303);
}
