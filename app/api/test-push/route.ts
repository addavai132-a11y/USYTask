import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
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
          error: 'No se encontró ninguna suscripción Push válida (ni en el cuerpo de la petición ni en la base de datos).',
        },
        { status: 400 }
      )
    }

    // 3. Obtener y verificar variables VAPID
    const subject = (process.env.VAPID_SUBJECT || 'mailto:soporte@usyatask.com').trim()
    const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
    const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()

    if (!publicKey || !privateKey) {
      console.error('[/api/test-push] Error: Claves VAPID no configuradas en variables de entorno.')
      return NextResponse.json(
        {
          success: false,
          error: 'Claves VAPID no configuradas en las variables de entorno (NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY faltan).',
        },
        { status: 500 }
      )
    }

    // 4. Configurar web-push
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey)
    } catch (vapidError: any) {
      console.error('[/api/test-push] Error en webpush.setVapidDetails():', vapidError)
      return NextResponse.json(
        {
          success: false,
          error: `Error configurando VAPID: ${vapidError?.message || 'Par de claves no válido.'}`,
        },
        { status: 500 }
      )
    }

    // 5. Preparar payload y enviar notificación
    const payload = JSON.stringify({
      title: 'USYTask 🚀',
      body: '¡Enhorabuena! Notificación Push recibida correctamente.',
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

    console.info('[/api/test-push] Despachando notificación push a:', targetSubscription.endpoint.slice(0, 45) + '...')
    const pushResult = await webpush.sendNotification(targetSubscription, payload, options)
    console.info('[/api/test-push] Push enviado con éxito. Status code:', pushResult.statusCode)

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
        error: error?.body || error?.message || 'Fallo al enviar notificación push.',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}