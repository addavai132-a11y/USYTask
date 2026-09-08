import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }, { status: 429 })
    }

    // 1. Extraer subscription del body si viene en la petición
    const body = await req.json().catch(() => ({}))
    let targetSubscription = body?.subscription

    // 2. Si no viene en el body, buscar la suscripción activa en Supabase
    if (!targetSubscription || !targetSubscription.endpoint) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: subRow } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (subRow?.subscription) {
            targetSubscription = subRow.subscription
          }
        }
      } catch (dbError) {
        console.warn('[/api/test-push] Advertencia buscando suscripción en Supabase:', dbError)
      }
    }

    if (!targetSubscription || !targetSubscription.endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se encontró ninguna suscripción Push válida.',
        },
        { status: 400 }
      )
    }

    // 3. Obtener y verificar variables VAPID (evitando undefined o vacías)
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@usyatask.com'

    if (!publicKey || !privateKey || publicKey === 'undefined' || privateKey === 'undefined' || publicKey.trim() === '' || privateKey.trim() === '') {
      console.error('[/api/test-push] Error: Claves VAPID no configuradas o undefined en el servidor.')
      return NextResponse.json(
        {
          success: false,
          error: 'Error de configuración interna del servidor (VAPID).',
        },
        { status: 500 }
      )
    }

    // 4. Configurar web-push
    webpush.setVapidDetails(subject.trim(), publicKey.trim(), privateKey.trim())

    // 5. Preparar payload y enviar notificación
    const payload = JSON.stringify({
      title: 'USYTask 🚀',
      body: '¡Notificaciones activadas con éxito! Ahora estarás al tanto de todo.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: '/app',
      data: {
        url: '/app',
        timestamp: Date.now(),
      },
    })

    const options = {
      TTL: 60,
      urgency: 'high' as const,
    }

    const pushResult = await webpush.sendNotification(targetSubscription, payload, options)

    return NextResponse.json({
      success: true,
      statusCode: pushResult.statusCode,
      message: 'Notificación Push de prueba enviada con éxito.',
    })
  } catch (error: any) {
    console.error('[/api/test-push] Error en handler:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al enviar la notificación de prueba.',
      },
      { status: 500 }
    )
  }
}