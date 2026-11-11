import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const token = String(f.get("token"));
  const { data: s } = await db.from("shops").select("*").eq("edit_token", token).single();
  if (!s) return NextResponse.json({ error: "accès refusé" }, { status: 401 });
  const c = { ...(s.config || {}) };
  for (const k of ["tagline", "hours", "address", "phone"]) c[k] = String(f.get(k) ?? "");
  c.services = String(f.get("services") || "").split("\n").filter(Boolean).map((l) => {
    const [name, price] = l.split("|").map((t) => t.trim());
    return { name, price: price || "" };
  });
  const file = f.get("photo") as File | null;
  if (file && file.size > 0) {
    const path = `${s.slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    await db.storage.from("photos").upload(path, file);
    c.photos = [...(c.photos || []), db.storage.from("photos").getPublicUrl(path).data.publicUrl];
  }
  await db.from("shops").update({ config: c }).eq("id", s.id);
  return NextResponse.redirect(new URL(`/edit/${token}`, req.url), 303);
}
