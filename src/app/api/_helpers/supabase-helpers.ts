import { createClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase service client without strict DB type generics.
 * This avoids TypeScript inference issues with the generated Database types
 * (missing Relationships field) while keeping runtime behavior correct.
 */
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
