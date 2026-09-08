import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const RedeemSchema = z.object({
  code: z.string().max(100)
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip, 5, 60000)) { // Strict rate limit for redeem (5/min)
      return NextResponse.json({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }, { status: 429 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para canjear un código.' },
        { status: 401 }
      )
    }

    const rawBody = await req.json().catch(() => ({}))
    const parsed = RedeemSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Por favor, proporciona un código promocional válido.' },
        { status: 400 }
      )
    }

    const cleanCode = parsed.data.code.trim().toUpperCase()

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: 'Por favor, proporciona un código promocional.' },
        { status: 400 }
      )
    }

    // Llamar a la función PostgreSQL con SECURITY DEFINER
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      input_code: cleanCode,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Código inválido o ya canjeado.' }, // Safe error message
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error en POST /api/promo-codes/redeem:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al procesar el canje.' },
      { status: 500 }
    )
  }
}
