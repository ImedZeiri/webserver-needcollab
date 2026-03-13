/**
 * @file supabase/functions/backup-runner/index
 * @description Edge Function — Backup d'UNE seule table à la fois
 *
 * Appelée avec { "table": "needs" } → backup uniquement cette table
 * n8n appelle chaque table séquentiellement → pas de timeout
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SOURCE_URL = Deno.env.get("SUPABASE_URL")!;
const SOURCE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEST_URL = Deno.env.get("BACKUP_SUPABASE_URL") || "https://mlldfqhftuvqixeoixcj.supabase.co";

const DEST_KEY =
  Deno.env.get("BACKUP_SUPABASE_SERVICE_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGRmcWhmdHV2cWl4ZW9peGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjUwOTcsImV4cCI6MjA4NzU0MTA5N30.r8emYMK8w8bymHKw8z5TsEAWeB9dVQmM0nYIlUFPeqE";

const TABLE_MAP: Record<string, string> = {
  needs: "bk_needs",
  profiles: "bk_profiles",
  collaborations: "bk_collaborations",
  offers: "bk_offers",
  messages: "bk_messages",
  notifications: "bk_notifications",
  user_roles: "bk_user_roles",
};

const BATCH_SIZE = 200;

serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const table: string = body.table;

  if (!table || !TABLE_MAP[table]) {
    return json({ error: `Table inconnue: "${table}". Tables valides: ${Object.keys(TABLE_MAP).join(", ")}` }, 400);
  }

  const destTable = TABLE_MAP[table];
  const source = createClient(SOURCE_URL, SOURCE_KEY);
  const dest = createClient(DEST_URL, DEST_KEY);

  let page = 0;
  let total = 0;
  const errors: string[] = [];

  while (true) {
    const from = page * BATCH_SIZE;
    const to = from + BATCH_SIZE - 1;

    const { data: rows, error: readErr } = await source.from(table).select("*").range(from, to);

    if (readErr) {
      errors.push(`lecture page ${page}: ${readErr.message}`);
      break;
    }

    if (!rows || rows.length === 0) break;

    const { error: writeErr } = await dest.from(destTable).insert(rows);

    if (writeErr) {
      errors.push(`écriture page ${page}: ${writeErr.message}`);
      break;
    }

    total += rows.length;
    page++;
    if (rows.length < BATCH_SIZE) break;
  }

  const status = errors.length === 0 ? "success" : "error";
  console.log(`[backup] ${table} → ${destTable} : ${status} (${total} rows)`);

  return json({ status, table, dest_table: destTable, rows: total, errors: errors.length ? errors : undefined });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
