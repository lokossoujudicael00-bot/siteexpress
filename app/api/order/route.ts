import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug"));
  const { data: s } = await db.from("shops").select("id,name,owner_email").eq("slug", slug).single();
  if (!s) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const item = String(f.get("item") || "");
  const qty = String(f.get("qty") || "1");
  await db.from("bookings").insert({ shop_id: s.id, customer_name: f.get("name"), customer_contact: f.get("contact"), requested_at: `Commande : ${item} × ${qty}`, note: f.get("note") });
  // E-mail automatique au commerçant (sans validation), avec copie pour l'administrateur
  const to = [s.owner_email, process.env.GMAIL_USER].filter(Boolean).join(",");
  try { if (to) await sendMail(to, `Nouvelle commande – ${s.name}`, `${f.get("name")} (${f.get("contact")})\nCommande : ${item} × ${qty}\n${f.get("note") || ""}${s.owner_email ? "" : "\n\n(Ce commerce n'a pas d'e-mail enregistré.)"}`); } catch (e) { console.log("mail commande", e); }
  return NextResponse.redirect(new URL(`/${slug}?ok=order#commander`, req.url), 303);
}
