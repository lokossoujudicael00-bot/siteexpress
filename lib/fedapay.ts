const BASE = () => (process.env.FEDAPAY_ENV === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1");
const headers = () => ({ Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" });

export const SETUP_XOF = Number(process.env.PRICE_XOF_SETUP || 98000);

// Crée un paiement et renvoie l'adresse de la page de paiement FedaPay
export async function createCheckout(opts: { slug: string; name: string; email: string; callbackUrl: string }): Promise<string | null> {
  const r = await fetch(`${BASE()}/transactions`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({
      description: `Site web ${opts.name}`,
      amount: SETUP_XOF,
      currency: { iso: "XOF" },
      callback_url: opts.callbackUrl,
      customer: { email: opts.email, firstname: opts.name.slice(0, 40) },
      custom_metadata: { slug: opts.slug },
    }),
  });
  const j: any = await r.json().catch(() => ({}));
  const tx: any = j["v1/transaction"] || j.transaction || j;
  const id = tx?.id;
  if (!id) { console.log("FedaPay create", r.status, JSON.stringify(j).slice(0, 300)); return null; }
  const r2 = await fetch(`${BASE()}/transactions/${id}/token`, { method: "POST", headers: headers() });
  const j2: any = await r2.json().catch(() => ({}));
  return j2?.url || (j2?.token ? `https://process.fedapay.com/${j2.token}` : null);
}

// Vérifie auprès de FedaPay qu'une transaction est bien payée. Renvoie le slug du commerce, sinon null.
export async function verifyTransaction(id: string): Promise<string | null> {
  const r = await fetch(`${BASE()}/transactions/${encodeURIComponent(id)}`, { headers: headers() });
  const j: any = await r.json().catch(() => ({}));
  const tx: any = j["v1/transaction"] || j.transaction || j;
  if (!tx || tx.status !== "approved") return null;
  if (Number(tx.amount) < SETUP_XOF) return null;
  const meta: any = tx.custom_metadata || {};
  return meta.slug ? String(meta.slug) : null;
}
