import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug"));
  const { data: s } = await db.from("shops").select("id,name,owner_email").eq("slug", slug).single();
  if (!s) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  await db.from("bookings").insert({ shop_id: s.id, customer_name: f.get("name"), customer_contact: f.get("contact"), requested_at: f.get("when"), note: f.get("note") });
  if (s.owner_email) {
    try {
      const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
      await t.sendMail({
        from: `SiteExpress <${process.env.GMAIL_USER}>`, to: s.owner_email,
        subject: `Nouvelle réservation – ${s.name}`,
        text: `${f.get("name")} (${f.get("contact")})\n${f.get("when")}\n${f.get("note") || ""}`,
      });
    } catch (e) { console.log("Email non envoyé", e); }
  }
  return NextResponse.redirect(new URL(`/${slug}?ok=1#reserver`, req.url), 303);
}
