import { db } from "@/lib/db";
import { createCheckout } from "@/lib/fedapay";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug") || "");
  const email = String(f.get("email") || "").trim();
  const base = process.env.SITE_URL || new URL(req.url).origin;
  const { data: s } = await db.from("shops").select("id,name,status").eq("slug", slug).single();
  if (!s || !email.includes("@")) return NextResponse.redirect(`${base}/${slug}/payer?err=1`, 303);
  await db.from("shops").update({ owner_email: email }).eq("id", s.id);
  const url = await createCheckout({ slug, name: s.name, email, callbackUrl: `${base}/${slug}/payer` });
  return NextResponse.redirect(url || `${base}/${slug}/payer?err=1`, 303);
}
