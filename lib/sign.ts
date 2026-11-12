import { createHmac } from "crypto";
export function sign(slug: string): string {
  return createHmac("sha256", process.env.CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "x").update(slug).digest("hex").slice(0, 32);
}
