// Kept separate from supabase.ts so server code (Netlify Functions) can use it
// without creating the browser client, which depends on import.meta.env
export const supabaseUrl = "https://mysbrkriwelivdpkknbq.supabase.co";
