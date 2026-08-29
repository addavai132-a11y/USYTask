import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const subscription = body.subscription

    if (!subscription || !subscription.endpoint) {
      console.error('[/api/test-push] Falta objeto subscription o endpoint válido:', subscription)
      return NextResponse.json({ error: 'Falta la suscripción o endpoint inválido.' }, { status: 400 })
    }

    const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
    const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()
    const subject = (process.env.VAPID_SUBJECT || 'mailto:soporte@usyatask.com').trim()

    if (!publicKey || !privateKey) {
      console.warn('[/api/test-push] Claves VAPID no configuradas en variables de entorno.')
      return NextResponse.json({
        success: true,
        localFallback: true,
        message: 'Claves VAPID no configuradas en el servidor. Modo fallback local activado.',
      })
    }

    // Configuración explícita de VAPID
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey)
    } catch (vapidErr: any) {
      console.error('[/api/test-push] Error configurando webpush.setVapidDetails:', vapidErr)
      return NextResponse.json({
        error: `Error en configuración VAPID: ${vapidErr?.message || 'Claves inválidas'}`,
        details: vapidErr?.message,
      }, { status: 500 })
    }

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

    const sendOptions = {
      TTL: 60,
      urgency: 'high' as const,
    }

    console.info('[/api/test-push] Enviando notificación push a:', subscription.endpoint.slice(0, 45) + '...')
    const pushResponse = await webpush.sendNotification(subscription, payload, sendOptions)
    console.info('[/api/test-push] Notificación push enviada con éxito. Status:', pushResponse.statusCode)

    return NextResponse.json({
      success: true,
      statusCode: pushResponse.statusCode,
      message: 'Notificación Push enviada correctamente.',
    })
  } catch (error: any) {
    console.error('[/api/test-push] Error detallado enviando web-push:', {
      message: error?.message,
      statusCode: error?.statusCode,
      headers: error?.headers,
      body: error?.body,
      stack: error?.stack,
    })

    const errorMessage = error?.body || error?.message || 'Fallo al enviar notificación push.'
    return NextResponse.json(
      {
        error: errorMessage,
        statusCode: error?.statusCode,
        details: error?.message,
      },
      { status: 500 }
    )
  }
}