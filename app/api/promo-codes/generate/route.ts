import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const host = req.headers.get('host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

    if (!isDev && !isLocalhost) {
      return NextResponse.json(
        { success: false, error: 'Acceso restringido al entorno local de desarrollo.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { code, planType = 'lifetime', durationDays = null, description = 'Generado en entorno dev' } = body

    const cleanCode =
      (code ? String(code).trim().toUpperCase() : null) ||
      `USY-${planType === 'early_access' ? 'BETA' : 'VIP'}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: cleanCode,
        plan_type: planType,
        duration_days: durationDays,
        description,
        is_used: false,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, promoCode: data })
  } catch (error: any) {
    console.error('Error en POST /api/promo-codes/generate:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al generar el código.' },
      { status: 500 }
    )
  }
}
