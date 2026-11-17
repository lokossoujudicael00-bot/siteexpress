import { createShop } from "@/lib/generate";
import { sendMail } from "@/lib/mail";
import { MAIL_TXT } from "@/lib/countries";
import { NextResponse } from "next/server";
export const maxDuration = 60;

export async function POST(req: Request) {
  const f = await req.formData();
  const key = String(f.get("key") || "");
  const base = process.env.SITE_URL || new URL(req.url).origin;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return NextResponse.json({ error: "accès refusé" }, { status: 401 });
  const name = String(f.get("name") || "").trim();
  if (!name) return NextResponse.redirect(`${base}/admin?key=${encodeURIComponent(key)}&err=1`, 303);
  const r = await createShop({
    name, tag: String(f.get("tag") || "shop=yes"), city: String(f.get("city") || ""), country: String(f.get("country") || "FR"),
    phone: String(f.get("phone") || ""), email: String(f.get("email") || "").trim(), address: String(f.get("address") || ""), hours: String(f.get("hours") || ""),
  });
  if (!r) return NextResponse.redirect(`${base}/admin?key=${encodeURIComponent(key)}&err=1`, 303);
  const email = String(f.get("email") || "").trim();
  if (f.get("sendmail") && email.includes("@")) {
    const txt = MAIL_TXT[r.lang] || MAIL_TXT.fr;
    try { await sendMail(email, txt.sub(name), txt.body(name, `${base}/${r.slug}`)); } catch (e) { console.log("mail admin", e); }
  }
  return NextResponse.redirect(`${base}/admin?key=${encodeURIComponent(key)}&created=${r.slug}`, 303);
}
