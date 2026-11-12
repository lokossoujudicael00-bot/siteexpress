import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sign } from "@/lib/sign";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug") || "");
  const email = String(f.get("payer_email") || "").trim();
  const base = process.env.SITE_URL || new URL(req.url).origin;
  const { data: s } = await db.from("shops").select("*").eq("slug", slug).single();
  if (!s || !email.includes("@")) return NextResponse.redirect(`${base}/${slug}/payer?err=1`, 303);
  const payment = { name: String(f.get("payer_name") || ""), email, ref: String(f.get("payer_ref") || ""), at: new Date().toISOString() };
  const status = s.status === "live" ? "live" : "payment_declared";
  await db.from("shops").update({ status, owner_email: email, config: { ...(s.config || {}), payment } }).eq("id", s.id);
  try {
    if (process.env.GMAIL_USER) {
      await sendMail(process.env.GMAIL_USER, `Paiement déclaré – ${s.name}`,
        `${payment.name} dit avoir payé le site ${s.name}.\nE-mail : ${email}\nRéférence : ${payment.ref}\n\nVérifie dans ton application Mobile Money / Taptap Send, puis confirme ici (livraison automatique) :\n${base}/confirm/${slug}?sig=${sign(slug)}`);
    }
  } catch (e) { console.log("mail declare", e); }
  return NextResponse.redirect(`${base}/${slug}/payer?sent=1`, 303);
}
