import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug"));
  const { data: s } = await db.from("shops").select("id,name,owner_email,status").eq("slug", slug).single();
  if (!s) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  await db.from("bookings").insert({ shop_id: s.id, customer_name: f.get("name"), customer_contact: f.get("contact"), requested_at: f.get("when"), note: f.get("note") });
  // Les alertes ne partent qu'une fois le site en ligne : pas de messages au commerçant pendant l'aperçu
  if (s.owner_email && s.status === "live") {
    try { await sendMail(s.owner_email, `Nouvelle réservation – ${s.name}`, `${f.get("name")} (${f.get("contact")})\n${f.get("when")}\n${f.get("note") || ""}`); } catch (e) { console.log("mail réservation", e); }
  }
  return NextResponse.redirect(new URL(`/${slug}?ok=1#reserver`, req.url), 303);
}
