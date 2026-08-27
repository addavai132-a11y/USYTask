import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ isSubscribed: false, notificationsEnabled: false })
    }

    const { count } = await supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const isSubscribed = (count || 0) > 0
    const notificationsEnabled = user.user_metadata?.notifications_enabled !== false && isSubscribed

    return NextResponse.json({
      isSubscribed,
      notificationsEnabled,
    })
  } catch (error) {
    console.error('Error en GET /api/push/subscribe:', error)
    return NextResponse.json({ isSubscribed: false, notificationsEnabled: false })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para registrar notificaciones.' },
        { status: 401 }
      )
    }

    // 2. Extraer objeto subscription del payload
    const body = await req.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Objeto de suscripción Push inválido o faltante.' },
        { status: 400 }
      )
    }

    const endpoint = subscription.endpoint

    // 3. Upsert en la tabla push_subscriptions
    const { data: existing, error: findError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .filter('subscription->>endpoint', 'eq', endpoint)
      .maybeSingle()

    if (findError) {
      console.error('Error buscando suscripción existente:', findError)
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          subscription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error actualizando suscripción:', updateError)
        return NextResponse.json(
          { error: 'Fallo al actualizar suscripción Push en base de datos.' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription,
        })

      if (insertError) {
        console.error('Error insertando suscripción:', insertError)
        return NextResponse.json(
          { error: 'Fallo al guardar suscripción Push en base de datos.' },
          { status: 500 }
        )
      }
    }

    // 4. Actualizar notifications_enabled en user metadata
    await supabase.auth.updateUser({
      data: {
        notifications_enabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción Push guardada correctamente.',
    })
  } catch (error) {
    console.error('Error inesperado en /api/push/subscribe:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor procesando suscripción.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const endpoint = body?.endpoint || body?.subscription?.endpoint

    let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id)

    if (endpoint) {
      query = query.filter('subscription->>endpoint', 'eq', endpoint)
    }

    const { error: deleteError } = await query

    if (deleteError) {
      console.error('Error eliminando suscripción Push:', deleteError)
      return NextResponse.json(
        { error: 'Fallo al eliminar suscripción Push.' },
        { status: 500 }
      )
    }

    // Actualizar notifications_enabled a false en user metadata
    await supabase.auth.updateUser({
      data: {
        notifications_enabled: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Suscripción eliminada con éxito.',
    })
  } catch (error) {
    console.error('Error inesperado eliminando suscripción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}

