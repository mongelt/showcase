import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const secret = process.env.KEEP_ALIVE_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Keep-alive ping failed:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Keep-alive unexpected error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
