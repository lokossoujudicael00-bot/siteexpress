import { activateShop } from "@/lib/activate";
import { sign } from "@/lib/sign";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const f = await req.formData();
  const slug = String(f.get("slug") || "");
  const sig = String(f.get("sig") || "");
  const base = process.env.SITE_URL || new URL(req.url).origin;
  if (sig !== sign(slug)) return NextResponse.json({ error: "lien invalide" }, { status: 403 });
  await activateShop(slug, "Mobile Money / Taptap Send (confirmé à la main)");
  return NextResponse.redirect(`${base}/confirm/${slug}?sig=${sig}&done=1`, 303);
}
