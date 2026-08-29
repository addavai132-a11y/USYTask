import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json()

    if (!subscription) {
      return NextResponse.json({ error: 'Falta la suscripción' }, { status: 400 })
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@usyatask.com'

    if (!publicKey || !privateKey) {
      console.warn('Faltan claves VAPID en el entorno del servidor. Solicitud test completada con fallback local.')
      return NextResponse.json({
        success: true,
        localFallback: true,
        message: 'Claves VAPID no configuradas en el servidor. Modo fallback local activado.',
      })
    }

    webpush.setVapidDetails(
      subject,
      publicKey,
      privateKey
    )

    const payload = JSON.stringify({
      title: 'USYTask 🚀',
      body: '¡Enhorabuena! Notificación Push recibida correctamente.',
      url: '/app',
    })

    await webpush.sendNotification(subscription, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviando push:', error)
    return NextResponse.json({ error: 'Fallo al enviar notificación push.' }, { status: 500 })
  }
}