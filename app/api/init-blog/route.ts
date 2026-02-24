// Table is created via SQL migration (RUN_IN_SUPABASE.sql).
// This route is kept as a no-op so existing callers don't 404.
export async function POST() {
  return Response.json({ success: true, message: 'Blog table managed via SQL migration' })
}