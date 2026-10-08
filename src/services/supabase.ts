import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./supabaseUrl";

export { supabaseUrl };
const supabaseKey = import.meta.env.VITE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
