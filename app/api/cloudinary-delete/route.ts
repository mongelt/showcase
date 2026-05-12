import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/cloudinary-delete
 * Body: { public_id: string }
 *
 * Signs the destroy request with the server-side API secret and calls
 * Cloudinary's image/destroy endpoint. Must run server-side — the API
 * secret must never be exposed to the browser.
 *
 * Required env vars (server-side, not NEXT_PUBLIC_):
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { public_id } = await req.json()
  if (!public_id || typeof public_id !== 'string') {
    return NextResponse.json({ error: 'Missing public_id' }, { status: 400 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary env vars not configured' }, { status: 500 })
  }

  const timestamp = Math.round(Date.now() / 1000).toString()

  // Signature: SHA1 of "public_id={id}&timestamp={ts}{secret}"
  const signature = createHash('sha1')
    .update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  const body = new URLSearchParams({
    public_id,
    api_key: apiKey,
    timestamp,
    signature,
  })

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Cloudinary delete request failed:', error)
    return NextResponse.json({ error: 'Failed to contact Cloudinary' }, { status: 502 })
  }
}
