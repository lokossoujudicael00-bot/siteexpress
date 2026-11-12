import { db } from "@/lib/db";
import { NextResponse } from "next/server";

async function upload(slug: string, file: any, tag: string): Promise<string | null> {
  if (!file || typeof file === "string" || !file.size) return null;
  try {
    const path = `${slug}/${Date.now()}-${tag}.jpg`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await db.storage.from("photos").upload(path, buf, { contentType: file.type || "image/jpeg", upsert: false });
    if (error) { console.log("upload", error.message); return null; }
    return db.storage.from("photos").getPublicUrl(path).data.publicUrl;
  } catch (e) { console.log("upload", e); return null; }
}

export async function POST(req: Request) {
  const f = await req.formData();
  const token = String(f.get("token"));
  const { data: s } = await db.from("shops").select("*").eq("edit_token", token).single();
  if (!s) return NextResponse.json({ error: "accès refusé" }, { status: 401 });
  const c: any = { ...(s.config || {}) };
  for (const k of ["tagline", "about", "hours", "address", "phone"]) c[k] = String(f.get(k) ?? "");
  const rows = Math.min(Number(f.get("rows") || 0), 40);
  const services: any[] = [];
  for (let i = 0; i < rows; i++) {
    const name = String(f.get(`name_${i}`) || "").trim();
    if (!name || f.get(`del_${i}`)) continue;
    let img = String(f.get(`img_${i}`) || "");
    const up = await upload(s.slug, f.get(`file_${i}`), `s${i}`);
    if (up) img = up;
    services.push({ name, desc: String(f.get(`desc_${i}`) || ""), price: String(f.get(`price_${i}`) || ""), img });
  }
  c.services = services;
  if (f.get("hero_del")) c.hero = "";
  const hero = await upload(s.slug, f.get("hero_file"), "hero");
  if (hero) c.hero = hero;
  const g = await upload(s.slug, f.get("gallery_file"), "gal");
  if (g) c.photos = [...(c.photos || []), g];
  await db.from("shops").update({ config: c }).eq("id", s.id);
  return NextResponse.redirect(new URL(`/edit/${token}?saved=1`, req.url), 303);
}
