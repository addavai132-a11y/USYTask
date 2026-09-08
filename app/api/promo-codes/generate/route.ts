import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const GeneratePromoSchema = z.object({
  code: z.string().max(100).nullable().optional(),
  planType: z.enum(['early_access', 'lifetime']).optional(),
  durationDays: z.number().nullable().optional(),
  description: z.string().max(200).optional()
}).passthrough()

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }, { status: 429 })
    }

    const isDev = process.env.NODE_ENV === 'development'
    const host = req.headers.get('host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

    if (!isDev && !isLocalhost) {
      return NextResponse.json(
        { success: false, error: 'Acceso restringido al entorno local de desarrollo.' },
        { status: 403 }
      )
    }

    const rawBody = await req.json().catch(() => ({}))
    const parsed = GeneratePromoSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Payload de generación inválido.' }, { status: 400 })
    }

    const body = parsed.data
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
        { success: false, error: 'Fallo al generar el código en base de datos.' }, // Sanitized error
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, promoCode: data })
  } catch (error: any) {
    console.error('Error en POST /api/promo-codes/generate:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al generar el código.' },
      { status: 500 }
    )
  }
}
