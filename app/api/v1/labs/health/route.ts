export async function GET() {
  return Response.json({ ok: true, service: 'xplore-labs', timestamp: new Date().toISOString() });
}
