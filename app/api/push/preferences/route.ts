import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '@/types/notifications'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const PreferencesSchema = z.object({
  preferences: z.object({
    taskAssignments: z.boolean().optional(),
    taskUpdates: z.boolean().optional(),
    eventInvites: z.boolean().optional(),
    eventReminders: z.boolean().optional(),
    systemAlerts: z.boolean().optional(),
  }).optional()
}).passthrough()

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
        { status: 200 }
      )
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error obteniendo preferencias:', error)
      return NextResponse.json({ preferences: DEFAULT_NOTIFICATION_PREFERENCES })
    }

    return NextResponse.json({
      preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(data?.preferences || {}),
      },
    })
  } catch (error) {
    console.error('Error inesperado en GET /api/push/preferences:', error)
    return NextResponse.json({ preferences: DEFAULT_NOTIFICATION_PREFERENCES })
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip, 20, 60000)) {
      return NextResponse.json({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }, { status: 429 })
    }

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

    const rawBody = await req.json().catch(() => ({}))
    const parsed = PreferencesSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload de preferencias inválido.' }, { status: 400 })
    }

    const body = parsed.data
    const preferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(body?.preferences || {}),
    }

    const { error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) throw upsertError

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Error guardando preferencias en /api/push/preferences:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor. No se pudieron guardar tus preferencias.' },
      { status: 500 }
    )
  }
}
