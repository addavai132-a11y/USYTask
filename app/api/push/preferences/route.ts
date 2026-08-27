import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '@/types/notifications'

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

    const body = await req.json()
    const preferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(body?.preferences || {}),
    }

    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          preferences,
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Error guardando preferencias en /api/push/preferences:', error)
    return NextResponse.json(
      { error: 'Error guardando preferencias en el servidor.' },
      { status: 500 }
    )
  }
}
