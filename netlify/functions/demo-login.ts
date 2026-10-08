import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { subHours } from "date-fns";
import { supabaseUrl } from "../../src/services/supabaseUrl";
import { resetAllTestData } from "../../src/test-data/resetTestData";

// Runs on Netlify's servers so demo login doesn't reach client, only resulting session tokens

const DEMO_DATA_MAX_AGE_HOURS = 6;

async function resetDemoDataIfStale(supabase: SupabaseClient) {
  const now = new Date();
  const cutoff = subHours(now, DEMO_DATA_MAX_AGE_HOURS).toISOString();

  // Claim the reset by moving the timestamp forward, but only if it's stale.
  // Postgres applies this update to the row one request at a time, so when
  // two demo logins arrive together, only one of them gets the row back.
  const { data: claimed, error } = await supabase
    .from("settings")
    .update({ lastDemoReset: now.toISOString() })
    .eq("id", 1)
    .or(`lastDemoReset.is.null,lastDemoReset.lt."${cutoff}"`)
    .select("id");

  if (error) throw new Error(`Checking demo data age: ${error.message}`);
  if (!claimed?.length) return;

  try {
    await resetAllTestData(supabase);
  } catch (err) {
    // Release the claim so the next demo login tries again
    await supabase.from("settings").update({ lastDemoReset: null }).eq("id", 1);
    throw err;
  }
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { VITE_API_KEY, DEMO_MAIL, DEMO_PASS } = process.env;

  if (!VITE_API_KEY || !DEMO_MAIL || !DEMO_PASS) {
    return Response.json(
      { error: "Demo login is not configured" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, VITE_API_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEMO_MAIL,
    password: DEMO_PASS,
  });

  if (error || !data.session) {
    return Response.json({ error: "Demo login failed" }, { status: 500 });
  }

  // Stale data is better than no login, so a failed reset is logged
  // (visible in Netlify's function logs) rather than blocking the demo user
  try {
    await resetDemoDataIfStale(supabase);
  } catch (err) {
    console.error("Demo data reset failed:", err);
  }

  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
};
