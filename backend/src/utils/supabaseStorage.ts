import { createClient } from '@supabase/supabase-js';

// Personal cloud storage (Work Suite "Files") lives in this bucket, one
// object per UserFile row, keyed by storageKey. Uses the service-role key
// server-side only — the bucket is private, so end users never get direct
// access without going through our download route (which mints a
// short-lived signed URL scoped to a file they actually own).
export const FILES_BUCKET = 'user-files';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('File storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  return supabaseAdmin;
}
