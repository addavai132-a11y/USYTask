import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
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

    const body = await req.json()
    const rawCode = body?.code || ''
    const cleanCode = String(rawCode).trim().toUpperCase()

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
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error en POST /api/promo-codes/redeem:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno al procesar el canje.' },
      { status: 500 }
    )
  }
}
