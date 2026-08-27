import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: Request) {
    try {
        const { subscription } = await req.json();

        if (!subscription) {
            return NextResponse.json({ error: 'Falta la suscripción' }, { status: 400 });
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.error('Faltan claves VAPID en el entorno');
            return NextResponse.json({ error: 'Claves no configuradas' }, { status: 500 });
        }

        webpush.setVapidDetails(
            'mailto:test@usyatask.com',
            publicKey,
            privateKey
        );

        const payload = JSON.stringify({
            title: 'UsyaTask 🚀',
            body: '¡Enhorabuena! Notificación Push recibida correctamente.',
            url: '/'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error enviando push:', error);
        return NextResponse.json({ error: 'Fallo al enviar notificación' }, { status: 500 });
    }
}