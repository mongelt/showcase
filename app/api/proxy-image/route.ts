import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
const MAX_BYTES = 10 * 1024 * 1024

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })

  const h = parsed.hostname
  if (h === 'localhost' || h.startsWith('127.') || h.startsWith('10.') ||
      h.startsWith('192.168.') || h === '::1')
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 })

  const ct = res.headers.get('content-type')?.split(';')[0].trim() ?? ''
  if (!ALLOWED_TYPES.includes(ct))
    return NextResponse.json({ error: 'Not an image' }, { status: 415 })

  const buffer = await res.arrayBuffer()
  if (buffer.byteLength > MAX_BYTES)
    return NextResponse.json({ error: 'Too large' }, { status: 413 })

  return new NextResponse(buffer, {
    headers: { 'Content-Type': ct, 'Cache-Control': 'no-store' },
  })
}
