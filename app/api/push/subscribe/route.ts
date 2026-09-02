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
    const { data: profile } = await supabase.from('profiles').select('notifications_enabled').eq('id', user.id).single()
    const notificationsEnabled = profile?.notifications_enabled !== false && isSubscribed

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
      // En modo local o sin sesión de Supabase Auth aún activa
      return NextResponse.json({
        success: true,
        localOnly: true,
        message: 'Modo local activo. La suscripción se gestiona directamente en el navegador.',
      })
    }

    // 2. Extraer objeto subscription del payload
    const body = await req.json().catch(() => ({}))
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Objeto de suscripción Push inválido o faltante.' },
        { status: 400 }
      )
    }

    const endpoint = subscription.endpoint

    // 3. Upsert en la tabla push_subscriptions
    try {
      const { data: existing, error: findError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .filter('subscription->>endpoint', 'eq', endpoint)
        .maybeSingle()

      if (findError) {
        console.warn('Nota: Consulta a push_subscriptions:', findError.message)
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            subscription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          console.warn('Advertencia actualizando suscripción en base de datos:', updateError.message)
          return NextResponse.json({
            success: true,
            savedInDb: false,
            warning: updateError.message,
            message: 'Notificaciones activadas localmente.',
          })
        }
      } else {
        const { error: insertError } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user.id,
            subscription,
          })

        if (insertError) {
          console.warn('Advertencia guardando suscripción en Supabase (ejecuta la migración SQL si aún no existe la tabla):', insertError.message)
          return NextResponse.json({
            success: true,
            savedInDb: false,
            warning: insertError.message,
            message: 'Notificaciones activadas en este dispositivo (pendiente ejecutar SQL de push_subscriptions en Supabase).',
          })
        }
      }

      // 4. Actualizar notifications_enabled en la tabla profiles
      await supabase.from('profiles').update({
        notifications_enabled: true,
      }).eq('id', user.id).catch(() => ({}))

      return NextResponse.json({
        success: true,
        savedInDb: true,
        message: 'Suscripción Push guardada correctamente en Supabase.',
      })
    } catch (dbErr: any) {
      console.warn('Advertencia interactuando con tabla push_subscriptions:', dbErr?.message)
      return NextResponse.json({
        success: true,
        savedInDb: false,
        warning: dbErr?.message,
        message: 'Notificaciones activadas en el navegador.',
      })
    }
  } catch (error: any) {
    console.error('Error inesperado en /api/push/subscribe:', error)
    return NextResponse.json(
      { success: true, localOnly: true, error: error?.message || 'Error procesando suscripción remota' },
      { status: 200 }
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

    // Actualizar notifications_enabled a false en la tabla profiles
    await supabase.from('profiles').update({
      notifications_enabled: false,
    }).eq('id', user.id)

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

