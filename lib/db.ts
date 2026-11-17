import { createClient } from "@supabase/supabase-js";
// Protection : si SITE_URL a été collée avec "SITE_URL=" devant, on l'enlève
process.env.SITE_URL = (process.env.SITE_URL || "").replace(/^SITE_URL=/, "").trim().replace(/\/+$/, "");
export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
