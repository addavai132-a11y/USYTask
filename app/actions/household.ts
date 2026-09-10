'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export interface JoinHouseholdResult {
  success: boolean
  error?: string
  message?: string
  alreadyMember?: boolean
  requiresAuth?: boolean
  householdName?: string
  householdId?: string
}

export interface HouseholdDetailsResult {
  success: boolean
  error?: string
  household?: {
    id: string
    name: string
  }
  isMember?: boolean
}

export interface UserHouseholdResult {
  success: boolean
  error?: string
  householdId?: string
  householdName?: string
}

/**
 * Obtiene el cliente Supabase adecuado:
 * Utiliza service_role si está configurado para evitar bloqueos por RLS,
 * o el cliente de servidor autenticado en su defecto.
 */
async function getDbClient() {
  const serverClient = await createClient()
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient()
      return { client: admin, isPrivileged: true, serverClient }
    } catch {
      // Fallback a cliente autenticado
    }
  }
  return { client: serverClient, isPrivileged: false, serverClient }
}

/**
 * Obtiene los detalles de un hogar / familia dado su ID.
 */
export async function getHouseholdDetails(householdId: string): Promise<HouseholdDetailsResult> {
  if (!householdId || typeof householdId !== 'string') {
    return { success: false, error: 'ID de familia no válido o ausente' }
  }

  try {
    const { client, serverClient } = await getDbClient()
    const { data: authData } = await serverClient.auth.getUser()
    const currentUserId = authData?.user?.id

    let householdName: string | null = null
    let targetId: string = householdId
    let isMember = false

    // 1. Intentar buscar en tabla 'households'
    const { data: hData, error: hErr } = await client
      .from('households')
      .select('id, name')
      .eq('id', householdId)
      .maybeSingle()

    if (!hErr && hData) {
      householdName = hData.name
      targetId = hData.id

      if (currentUserId) {
        const { data: member } = await client
          .from('household_members')
          .select('id')
          .eq('household_id', targetId)
          .eq('user_id', currentUserId)
          .maybeSingle()
        if (member) isMember = true
      }
    } else {
      // 2. Intentar buscar en tabla 'groups' (compatibilidad con esquema groups)
      const { data: gData, error: gErr } = await client
        .from('groups')
        .select('id, name')
        .eq('id', householdId)
        .maybeSingle()

      if (!gErr && gData) {
        householdName = gData.name
        targetId = gData.id

        if (currentUserId) {
          const { data: member } = await client
            .from('group_members')
            .select('id')
            .eq('group_id', targetId)
            .eq('user_id', currentUserId)
            .maybeSingle()
          if (member) isMember = true
        }
      } else {
        // 3. Intentar buscar por invite_code si el ID pasado fuese un código
        const { data: gCode } = await client
          .from('groups')
          .select('id, name')
          .eq('invite_code', householdId)
          .maybeSingle()

        if (gCode) {
          householdName = gCode.name
          targetId = gCode.id

          if (currentUserId) {
            const { data: member } = await client
              .from('group_members')
              .select('id')
              .eq('group_id', targetId)
              .eq('user_id', currentUserId)
              .maybeSingle()
            if (member) isMember = true
          }
        }
      }
    }

    if (!householdName) {
      return { success: false, error: 'No se encontró la familia con el identificador proporcionado.' }
    }

    return {
      success: true,
      household: {
        id: targetId,
        name: householdName,
      },
      isMember,
    }
  } catch (err: any) {
    console.error('Error al obtener detalles del hogar:', err)
    return { success: false, error: err?.message || 'Error al conectar con la base de datos' }
  }
}

/**
 * Obtiene el household_id al que pertenece el usuario actualmente autenticado.
 * Si el usuario no tiene ningún hogar en la base de datos, crea uno automáticamente.
 */
export async function getCurrentUserHousehold(): Promise<UserHouseholdResult> {
  try {
    const serverClient = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await serverClient.auth.getUser()

    if (authErr || !user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    const { client } = await getDbClient()
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Mi Familia'

    // 1. Comprobar en household_members
    const { data: hmData } = await client
      .from('household_members')
      .select('household_id, households(id, name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (hmData?.household_id) {
      const hName = (hmData.households as any)?.name || `Familia de ${userName}`
      return { success: true, householdId: hmData.household_id, householdName: hName }
    }

    // 2. Comprobar en group_members
    const { data: gmData } = await client
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (gmData?.group_id) {
      const gName = (gmData.groups as any)?.name || `Familia de ${userName}`
      return { success: true, householdId: gmData.group_id, householdName: gName }
    }

    // 3. Comprobar si el usuario ha creado un household
    const { data: createdH } = await client
      .from('households')
      .select('id, name')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle()

    if (createdH?.id) {
      // Asegurar que también está como miembro
      await client.from('household_members').upsert(
        {
          household_id: createdH.id,
          user_id: user.id,
          name: userName,
          role: 'owner',
        },
        { onConflict: 'household_id,user_id' }
      )
      return { success: true, householdId: createdH.id, householdName: createdH.name }
    }

    // 4. Comprobar si el usuario ha creado un group
    const { data: createdG } = await client
      .from('groups')
      .select('id, name')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle()

    if (createdG?.id) {
      await client.from('group_members').upsert(
        {
          group_id: createdG.id,
          user_id: user.id,
          name: userName,
          role: 'adult',
          is_admin: true,
          is_owner: true,
        },
        { onConflict: 'group_id,user_id' }
      )
      return { success: true, householdId: createdG.id, householdName: createdG.name }
    }

    // 5. Si no tiene hogar en la base de datos, crearlo dinámicamente
    const defaultName = `Familia de ${userName}`
    
    // Probar insertar en households
    const { data: newHousehold, error: insertHErr } = await client
      .from('households')
      .insert({
        name: defaultName,
        created_by: user.id,
      })
      .select('id, name')
      .single()

    if (!insertHErr && newHousehold) {
      await client.from('household_members').insert({
        household_id: newHousehold.id,
        user_id: user.id,
        name: userName,
        role: 'owner',
      })
      return { success: true, householdId: newHousehold.id, householdName: newHousehold.name }
    }

    // Si la tabla households no existe, intentar en groups
    const { data: newGroup, error: insertGErr } = await client
      .from('groups')
      .insert({
        name: defaultName,
        type: 'family',
        invite_code: `HOG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        created_by: user.id,
      })
      .select('id, name')
      .single()

    if (!insertGErr && newGroup) {
      await client.from('group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        name: userName,
        role: 'adult',
        is_admin: true,
        is_owner: true,
      })
      return { success: true, householdId: newGroup.id, householdName: newGroup.name }
    }

    // Si ninguna tabla existe en la BD aún, retornar un UUID determinista o error explicativo
    return {
      success: false,
      error: 'No se pudo crear o recuperar el hogar en la base de datos de Supabase.',
    }
  } catch (err: any) {
    console.error('Error al recuperar o crear el hogar del usuario:', err)
    return { success: false, error: err?.message || 'Error de conexión' }
  }
}

/**
 * Server Action para procesar la unión de un usuario a un hogar / familia.
 * - Verifica autenticación
 * - Verifica si el usuario ya es miembro
 * - Inserta el nuevo miembro en la base de datos
 */
export async function joinHousehold(householdId: string): Promise<JoinHouseholdResult> {
  if (!householdId || typeof householdId !== 'string') {
    return {
      success: false,
      error: 'ID de invitación no válido o no proporcionado.',
    }
  }

  try {
    const serverClient = await createClient()
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para unirte a esta familia.',
        requiresAuth: true,
      }
    }

    const { client } = await getDbClient()
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Nuevo Integrante'

    let householdName = 'la familia'
    let resolvedId = householdId
    let isHouseholdTable = true

    // 1. Identificar si corresponde a 'households' o a 'groups'
    const { data: hData, error: hErr } = await client
      .from('households')
      .select('id, name')
      .eq('id', householdId)
      .maybeSingle()

    if (!hErr && hData) {
      householdName = hData.name
      resolvedId = hData.id
      isHouseholdTable = true
    } else {
      // Buscar en groups
      const { data: gData, error: gErr } = await client
        .from('groups')
        .select('id, name')
        .eq('id', householdId)
        .maybeSingle()

      if (!gErr && gData) {
        householdName = gData.name
        resolvedId = gData.id
        isHouseholdTable = false
      } else {
        // Buscar por invite_code
        const { data: gCode } = await client
          .from('groups')
          .select('id, name')
          .eq('invite_code', householdId)
          .maybeSingle()

        if (gCode) {
          householdName = gCode.name
          resolvedId = gCode.id
          isHouseholdTable = false
        } else {
          return {
            success: false,
            error: 'No se encontró ninguna familia asociada a este enlace de invitación.',
          }
        }
      }
    }

    // 2. Verificar si el usuario ya es miembro
    if (isHouseholdTable) {
      const { data: existingMember } = await client
        .from('household_members')
        .select('id')
        .eq('household_id', resolvedId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        return {
          success: false,
          error: 'Ya perteneces a esta familia.',
          alreadyMember: true,
          householdName,
          householdId: resolvedId,
        }
      }

      // 3. Insertar en household_members
      const { error: insertError } = await client.from('household_members').insert({
        household_id: resolvedId,
        user_id: user.id,
        name: userName,
        role: 'member',
      })

      if (insertError) {
        // Error de clave única (duplicado)
        if (insertError.code === '23505') {
          return {
            success: false,
            error: 'Ya perteneces a esta familia.',
            alreadyMember: true,
            householdName,
            householdId: resolvedId,
          }
        }
        console.error('Error al insertar en household_members:', insertError)
        return {
          success: false,
          error: `Error al unirse a la familia: ${insertError.message}`,
        }
      }
    } else {
      // Tabla groups / group_members
      const { data: existingMember } = await client
        .from('group_members')
        .select('id')
        .eq('group_id', resolvedId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        return {
          success: false,
          error: 'Ya perteneces a esta familia.',
          alreadyMember: true,
          householdName,
          householdId: resolvedId,
        }
      }

      // 3. Insertar en group_members
      const { error: insertError } = await client.from('group_members').insert({
        group_id: resolvedId,
        user_id: user.id,
        name: userName,
        role: 'adult',
        is_admin: false,
        is_owner: false,
        points: 0,
        streak: 0,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: false,
            error: 'Ya perteneces a esta familia.',
            alreadyMember: true,
            householdName,
            householdId: resolvedId,
          }
        }
        console.error('Error al insertar en group_members:', insertError)
        return {
          success: false,
          error: `Error al unirse a la familia: ${insertError.message}`,
        }
      }
    }

    return {
      success: true,
      message: `¡Te has unido con éxito a ${householdName}!`,
      householdName,
      householdId: resolvedId,
    }
  } catch (err: any) {
    console.error('Error en Server Action joinHousehold:', err)
    return {
      success: false,
      error: err?.message || 'Error inesperado al procesar la solicitud.',
    }
  }
}
