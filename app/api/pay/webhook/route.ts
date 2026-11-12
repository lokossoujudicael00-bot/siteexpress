import { verifyTransaction } from "@/lib/fedapay";
import { activateShop } from "@/lib/activate";
import { NextResponse } from "next/server";
// À renseigner dans FedaPay : https://TON-SITE/api/pay/webhook
// On ne fait jamais confiance au contenu reçu : on redemande la transaction à FedaPay avant de livrer.
export async function POST(req: Request) {
  try {
    const body: any = await req.json();
    const id = body?.entity?.id || body?.object?.id || body?.id;
    if (id) {
      const slug = await verifyTransaction(String(id));
      if (slug) await activateShop(slug, "FedaPay (webhook)");
    }
  } catch (e) { console.log("webhook", e); }
  return NextResponse.json({ ok: true });
}
