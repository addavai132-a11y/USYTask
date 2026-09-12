'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

export interface JoinHouseholdResult {
  success: boolean
  error?: string
  errorCode?: string
  errorMessage?: string
  errorDetails?: string
  errorHint?: string
  message?: string
  alreadyMember?: boolean
  requiresAuth?: boolean
  householdName?: string
  householdId?: string
}

export interface HouseholdDetailsResult {
  success: boolean
  error?: string
  errorCode?: string
  errorMessage?: string
  errorDetails?: string
  errorHint?: string
  household?: {
    id: string
    name: string
  }
  isMember?: boolean
}

export interface UserHouseholdResult {
  success: boolean
  error?: string
  errorCode?: string
  errorMessage?: string
  householdId?: string
  householdName?: string
}

/**
 * Obtiene el cliente Supabase adecuado:
 * 1. Si se proporciona accessToken, crea cliente autenticado con Bearer token.
 * 2. Si hay SUPABASE_SERVICE_ROLE_KEY, crea cliente privilegiado.
 * 3. En su defecto, utiliza createClient() basado en cookies de next/headers.
 */
async function resolveSupabaseClient(accessToken?: string) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()

  // 1. Si viene accessToken del cliente, usarlo directamente para que auth.uid() en Postgres sea exacto
  if (accessToken && typeof accessToken === 'string' && accessToken.length > 20) {
    try {
      const userClient = createSupabaseJsClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })
      const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
      if (!userError && userData?.user) {
        return { client: userClient, user: userData.user, authMethod: 'bearer' as const }
      }
    } catch (e) {
      console.warn('[resolveSupabaseClient] Fallo al autenticar con Bearer token:', e)
    }
  }

  // 2. Cliente de servidor basado en cookies
  const serverClient = await createClient()
  const {
    data: { user: cookieUser },
  } = await serverClient.auth.getUser()

  // 3. Si hay service role key configurada, podemos usarla para operaciones seguras
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminClient()
      return {
        client: adminClient,
        user: cookieUser || null,
        authMethod: 'admin' as const,
        serverClient,
      }
    } catch {
      // Fallback a cliente autenticado
    }
  }

  return {
    client: serverClient,
    user: cookieUser || null,
    authMethod: 'cookie' as const,
    serverClient,
  }
}

/**
 * Formatea un error de Supabase/Postgrest con código, mensaje, detalles y sugerencias.
 */
function formatSupabaseError(error: any): {
  formatted: string
  code: string
  message: string
  details?: string
  hint?: string
} {
  const code = String(error?.code || 'UNKNOWN')
  const message = String(error?.message || 'Error desconocido de Supabase')
  const details = error?.details ? String(error.details) : undefined
  const hint = error?.hint ? String(error.hint) : undefined

  let formatted = `[${code}] ${message}`
  if (details) formatted += ` — Detalles: ${details}`
  if (hint) formatted += ` — Sugerencia: ${hint}`

  return { formatted, code, message, details, hint }
}

/**
 * Retorna el cliente Admin (service_role) si SUPABASE_SERVICE_ROLE_KEY está configurada,
 * permitiendo saltarse RLS de forma segura en operaciones del servidor.
 */
function getAdminClientSafe() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!key || key === 'tu_clave_service_role_aqui') {
    return null
  }
  try {
    return createAdminClient()
  } catch (e) {
    console.warn('[getAdminClientSafe] Error instanciando cliente admin:', e)
    return null
  }
}

/**
 * OPCIÓN A (Recomendada): Obtiene los datos públicos básicos de una familia (id y nombre)
 * para la pantalla de invitación usando el Admin Client (service_role) del lado del servidor.
 *
 * Esto garantiza que un usuario invitado (que todavía no está en household_members)
 * pueda visualizar la tarjeta de invitación sin ser bloqueado por las políticas RLS.
 */
export async function getHouseholdForInvitation(
  householdId: string
): Promise<HouseholdDetailsResult> {
  if (!householdId || typeof householdId !== 'string') {
    return {
      success: false,
      error: '[INVALID_ID] ID de familia no proporcionado o vacío.',
      errorCode: 'INVALID_ID',
      errorMessage: 'ID de familia no válido.',
    }
  }

  const cleanId = householdId.trim()
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUuid = UUID_REGEX.test(cleanId)

  let adminClient: any = null
  try {
    adminClient = getAdminClientSafe()
  } catch (e) {
    console.warn('[getHouseholdForInvitation] Error instanciando admin client:', e)
  }

  let serverClient: any = null
  if (!adminClient) {
    try {
      serverClient = await createClient()
    } catch (e) {
      console.warn('[getHouseholdForInvitation] Error instanciando server client:', e)
    }
  }

  const queryClient = adminClient || serverClient
  if (!queryClient) {
    return {
      success: false,
      error: '[CLIENT_INIT_FAILED] No se pudo inicializar la conexión con Supabase.',
      errorCode: 'CLIENT_INIT_FAILED',
      errorMessage: 'Error al conectar con la base de datos.',
    }
  }

  try {
    // 1. Si es un UUID válido, buscar en tabla 'households' (solo id y name)
    if (isUuid) {
      const { data: hData, error: hErr } = await queryClient
        .from('households')
        .select('id, name')
        .eq('id', cleanId)
        .maybeSingle()

      if (!hErr && hData) {
        return {
          success: true,
          household: {
            id: hData.id,
            name: hData.name,
          },
        }
      }

      if (hErr && hErr.code === '42501' && !adminClient) {
        return {
          success: false,
          error: `[42501] RLS bloquea la lectura en households. Configura SUPABASE_SERVICE_ROLE_KEY en .env.local (Opción A) o ejecuta la política SQL en Supabase (Opción B).`,
          errorCode: '42501',
          errorMessage: 'Permiso denegado por RLS en Supabase.',
          errorDetails: hErr.details || undefined,
          errorHint: hErr.hint || undefined,
        }
      }
    }

    // 2. Buscar en tabla 'groups' (compatibilidad)
    const { data: gData, error: gErr } = await queryClient
      .from('groups')
      .select('id, name')
      .eq('id', cleanId)
      .maybeSingle()

    if (!gErr && gData) {
      return {
        success: true,
        household: {
          id: gData.id,
          name: gData.name,
        },
      }
    }

    // 3. Buscar por invite_code
    const { data: gCode } = await queryClient
      .from('groups')
      .select('id, name')
      .eq('invite_code', cleanId)
      .maybeSingle()

    if (gCode) {
      return {
        success: true,
        household: {
          id: gCode.id,
          name: gCode.name,
        },
      }
    }


    return {
      success: false,
      error: `[PGRST116] No se encontró ninguna familia con el identificador "${cleanId}".`,
      errorCode: 'PGRST116',
      errorMessage: 'Familia no encontrada',
    }
  } catch (err: any) {
    const errFmt = formatSupabaseError(err)
    return {
      success: false,
      error: errFmt.formatted,
      errorCode: errFmt.code,
      errorMessage: errFmt.message,
    }
  }
}

/**
 * Obtiene los detalles de un hogar / familia dado su ID.
 * Utiliza el cliente Admin si está disponible para el SELECT de households (Opción A),
 * evitando errores de "Familia no encontrada" por RLS.
 */
export async function getHouseholdDetails(
  householdId: string,
  accessToken?: string
): Promise<HouseholdDetailsResult> {
  if (!householdId || typeof householdId !== 'string') {
    return {
      success: false,
      error: '[INVALID_ID] ID de familia no proporcionado o vacío.',
      errorCode: 'INVALID_ID',
      errorMessage: 'ID de familia no válido.',
    }
  }

  const cleanId = householdId.trim()

  try {
    const { client, user } = await resolveSupabaseClient(accessToken)
    const adminClient = getAdminClientSafe()
    const readClient = adminClient || client
    const currentUserId = user?.id

    let householdName: string | null = null
    let targetId: string = cleanId
    let isMember = false

    // 1. Intentar buscar en tabla 'households' usando readClient para evitar bloqueo RLS
    const { data: hData, error: hErr } = await readClient
      .from('households')
      .select('id, name')
      .eq('id', cleanId)
      .maybeSingle()

    if (!hErr && hData) {
      householdName = hData.name
      targetId = hData.id

      if (currentUserId) {
        const checkClient = adminClient || client
        const { data: member } = await checkClient
          .from('household_members')
          .select('id')
          .eq('household_id', targetId)
          .eq('user_id', currentUserId)
          .maybeSingle()
        if (member) isMember = true
      }
    } else {
      // Si el error es de permisos RLS y no tenemos adminClient, informar con claridad
      if (hErr && hErr.code === '42501' && !adminClient) {
        const errFmt = formatSupabaseError(hErr)
        console.error('[getHouseholdDetails] Error RLS en tabla households:', errFmt)
        return {
          success: false,
          error: `[42501] Permiso denegado por políticas RLS en tabla 'households': ${hErr.message}. Configura SUPABASE_SERVICE_ROLE_KEY en .env.local o aplica la política RLS en Supabase.`,
          errorCode: '42501',
          errorMessage: hErr.message,
          errorDetails: hErr.details || undefined,
          errorHint: hErr.hint || undefined,
        }
      }

      // 2. Intentar buscar en tabla 'groups' (compatibilidad con esquema groups)
      const { data: gData, error: gErr } = await readClient
        .from('groups')
        .select('id, name')
        .eq('id', cleanId)
        .maybeSingle()

      if (!gErr && gData) {
        householdName = gData.name
        targetId = gData.id

        if (currentUserId) {
          const checkClient = adminClient || client
          const { data: member } = await checkClient
            .from('group_members')
            .select('id')
            .eq('group_id', targetId)
            .eq('user_id', currentUserId)
            .maybeSingle()
          if (member) isMember = true
        }
      } else {
        if (gErr && gErr.code === '42501' && !adminClient) {
          return {
            success: false,
            error: `[42501] Permiso denegado por políticas RLS en tabla 'groups': ${gErr.message}`,
            errorCode: '42501',
            errorMessage: gErr.message,
            errorDetails: gErr.details || undefined,
            errorHint: gErr.hint || undefined,
          }
        }

        // 3. Intentar buscar por invite_code si el ID pasado fuese un código
        const { data: gCode } = await readClient
          .from('groups')
          .select('id, name')
          .eq('invite_code', cleanId)
          .maybeSingle()

        if (gCode) {
          householdName = gCode.name
          targetId = gCode.id

          if (currentUserId) {
            const checkClient = adminClient || client
            const { data: member } = await checkClient
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
      return {
        success: false,
        error: `[PGRST116] No se encontró ninguna familia con el identificador "${cleanId}". Verifica que el enlace sea correcto y que las políticas RLS permitan lectura.`,
        errorCode: 'PGRST116',
        errorMessage: 'Familia no encontrada',
      }
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
    const errFmt = formatSupabaseError(err)
    console.error('Error al obtener detalles del hogar:', err)
    return {
      success: false,
      error: errFmt.formatted,
      errorCode: errFmt.code,
      errorMessage: errFmt.message,
      errorDetails: errFmt.details,
      errorHint: errFmt.hint,
    }
  }
}

/**
 * Obtiene el household_id al que pertenece el usuario actualmente autenticado.
 * Si el usuario no tiene ningún hogar en la base de datos, crea uno automáticamente.
 */
export async function getCurrentUserHousehold(accessToken?: string): Promise<UserHouseholdResult> {
  try {
    const { client, user } = await resolveSupabaseClient(accessToken)

    if (!user) {
      return {
        success: false,
        error: '[AUTH_REQUIRED] Usuario no autenticado en Supabase.',
        errorCode: 'AUTH_REQUIRED',
        errorMessage: 'Usuario no autenticado.',
      }
    }

    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Mi Familia'

    // 1. Comprobar en household_members
    const { data: hmData, error: hmErr } = await client
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
    const { data: gmData, error: gmErr } = await client
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
    const { data: createdH, error: chErr } = await client
      .from('households')
      .select('id, name')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle()

    if (createdH?.id) {
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

    // 5. Crear dinámicamente si no existe ningún hogar
    const defaultName = `Familia de ${userName}`
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

    // Si households falla (ej. tabla no creada), intentar con groups
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

    const firstErr = insertHErr || insertGErr
    const errFmt = formatSupabaseError(firstErr)
    return {
      success: false,
      error: `Error al crear hogar en Supabase: ${errFmt.formatted}`,
      errorCode: errFmt.code,
      errorMessage: errFmt.message,
    }
  } catch (err: any) {
    const errFmt = formatSupabaseError(err)
    return {
      success: false,
      error: errFmt.formatted,
      errorCode: errFmt.code,
      errorMessage: errFmt.message,
    }
  }
}

/**
 * Server Action para procesar la unión de un usuario a un hogar / familia.
 * Devuelve el código y mensaje EXACTOS de Supabase en caso de error.
 */
export async function joinHousehold(
  householdId: string,
  accessToken?: string
): Promise<JoinHouseholdResult> {
  if (!householdId || typeof householdId !== 'string') {
    return {
      success: false,
      error: '[INVALID_ID] ID de invitación no válido o no proporcionado.',
      errorCode: 'INVALID_ID',
      errorMessage: 'ID de invitación no proporcionado.',
    }
  }

  const cleanId = householdId.trim()

  try {
    const { client, user, authMethod } = await resolveSupabaseClient(accessToken)

    if (!user) {
      return {
        success: false,
        error: '[AUTH_REQUIRED] No se encontró una sesión activa de Supabase Auth en el servidor. Inicia sesión para unirte.',
        errorCode: 'AUTH_REQUIRED',
        errorMessage: 'Debes iniciar sesión para unirte a esta familia.',
        requiresAuth: true,
      }
    }

    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Nuevo Integrante'

    let householdName = 'la familia'
    let resolvedId = cleanId
    let isHouseholdTable = true

    const adminClient = getAdminClientSafe()
    const readClient = adminClient || client

    // 1. Identificar si corresponde a 'households' o a 'groups' usando readClient para evitar bloqueo RLS
    const { data: hData, error: hErr } = await readClient
      .from('households')
      .select('id, name')
      .eq('id', cleanId)
      .maybeSingle()

    if (!hErr && hData) {
      householdName = hData.name
      resolvedId = hData.id
      isHouseholdTable = true
    } else {
      if (hErr && hErr.code === '42501' && !adminClient) {
        const errFmt = formatSupabaseError(hErr)
        console.error('[joinHousehold] RLS error en households:', errFmt)
        return {
          success: false,
          error: `[42501] RLS Error en 'households': ${hErr.message}. Verifica que la tabla permita SELECT o configura SUPABASE_SERVICE_ROLE_KEY en .env.local.`,
          errorCode: '42501',
          errorMessage: hErr.message,
          errorDetails: hErr.details || undefined,
          errorHint: hErr.hint || undefined,
        }
      }

      // Buscar en groups
      const { data: gData, error: gErr } = await readClient
        .from('groups')
        .select('id, name')
        .eq('id', cleanId)
        .maybeSingle()

      if (!gErr && gData) {
        householdName = gData.name
        resolvedId = gData.id
        isHouseholdTable = false
      } else {
        if (gErr && gErr.code === '42501' && !adminClient) {
          return {
            success: false,
            error: `[42501] RLS Error en 'groups': ${gErr.message}.`,
            errorCode: '42501',
            errorMessage: gErr.message,
            errorDetails: gErr.details || undefined,
            errorHint: gErr.hint || undefined,
          }
        }

        // Buscar por invite_code
        const { data: gCode } = await readClient
          .from('groups')
          .select('id, name')
          .eq('invite_code', cleanId)
          .maybeSingle()

        if (gCode) {
          householdName = gCode.name
          resolvedId = gCode.id
          isHouseholdTable = false
        } else {
          return {
            success: false,
            error: `[NOT_FOUND] No se encontró ninguna familia asociada al ID "${cleanId}". Asegúrate de que las políticas RLS permitan SELECT a usuarios autenticados o usa SUPABASE_SERVICE_ROLE_KEY.`,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Familia no encontrada en Supabase.',
          }
        }
      }
    }

    // 2. Verificar si el usuario ya es miembro
    if (isHouseholdTable) {
      const checkClient = adminClient || client
      const { data: existingMember, error: checkErr } = await checkClient
        .from('household_members')
        .select('id')
        .eq('household_id', resolvedId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        return {
          success: false,
          error: `[ALREADY_MEMBER] Ya perteneces a "${householdName}".`,
          errorCode: 'ALREADY_MEMBER',
          errorMessage: 'Ya perteneces a esta familia.',
          alreadyMember: true,
          householdName,
          householdId: resolvedId,
        }
      }

      // 3. INSERT en household_members vinculando user.id con household_id
      let { data: insertData, error: insertError } = await client
        .from('household_members')
        .insert({
          household_id: resolvedId,
          user_id: user.id,
          name: userName,
          role: 'member',
        })
        .select('id')
        .single()

      // Fallback a adminClient si RLS 42501 bloquea la inserción
      if (insertError && insertError.code === '42501' && adminClient) {
        console.warn('[joinHousehold] RLS 42501 en insert de miembro. Reintentando con adminClient...')
        const { data: adminData, error: adminErr } = await adminClient
          .from('household_members')
          .insert({
            household_id: resolvedId,
            user_id: user.id,
            name: userName,
            role: 'member',
          })
          .select('id')
          .single()

        if (!adminErr) {
          insertError = null
          insertData = adminData
        } else {
          insertError = adminErr
        }
      }

      if (insertError) {
        const errFmt = formatSupabaseError(insertError)
        console.error('[joinHousehold] Error exacto de Supabase al insertar miembro:', errFmt)

        if (insertError.code === '23505') {
          return {
            success: false,
            error: `[23505] Ya perteneces a "${householdName}".`,
            errorCode: '23505',
            errorMessage: 'Ya perteneces a esta familia (registro duplicado).',
            alreadyMember: true,
            householdName,
            householdId: resolvedId,
          }
        }

        if (insertError.code === '42501') {
          return {
            success: false,
            error: `[42501] Error de políticas RLS: Tu usuario autenticado (${user.id}) no tiene permisos para insertar en 'household_members'. Revisa la política INSERT WITH CHECK (auth.uid() = user_id) o configura SUPABASE_SERVICE_ROLE_KEY. Mensaje: ${insertError.message}`,
            errorCode: '42501',
            errorMessage: insertError.message,
            errorDetails: insertError.details || undefined,
            errorHint: insertError.hint || undefined,
          }
        }

        return {
          success: false,
          error: `[${errFmt.code}] ${errFmt.message}${errFmt.details ? ' — ' + errFmt.details : ''}`,
          errorCode: errFmt.code,
          errorMessage: errFmt.message,
          errorDetails: errFmt.details,
          errorHint: errFmt.hint,
        }
      }
    } else {
      // Esquema alternativo: groups / group_members
      const { data: existingMember } = await client
        .from('group_members')
        .select('id')
        .eq('group_id', resolvedId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        return {
          success: false,
          error: `[ALREADY_MEMBER] Ya perteneces a "${householdName}".`,
          errorCode: 'ALREADY_MEMBER',
          errorMessage: 'Ya perteneces a esta familia.',
          alreadyMember: true,
          householdName,
          householdId: resolvedId,
        }
      }

      // 3. INSERT en group_members
      let { data: insertData, error: insertError } = await client
        .from('group_members')
        .insert({
          group_id: resolvedId,
          user_id: user.id,
          name: userName,
          role: 'adult',
          is_admin: false,
          is_owner: false,
          points: 0,
          streak: 0,
        })
        .select('id')
        .single()

      if (insertError && insertError.code === '42501' && adminClient) {
        console.warn('[joinHousehold] RLS 42501 en insert de group_members. Reintentando con adminClient...')
        const { data: adminData, error: adminErr } = await adminClient
          .from('group_members')
          .insert({
            group_id: resolvedId,
            user_id: user.id,
            name: userName,
            role: 'adult',
            is_admin: false,
            is_owner: false,
            points: 0,
            streak: 0,
          })
          .select('id')
          .single()

        if (!adminErr) {
          insertError = null
          insertData = adminData
        } else {
          insertError = adminErr
        }
      }

      if (insertError) {
        const errFmt = formatSupabaseError(insertError)
        console.error('[joinHousehold] Error exacto de Supabase en group_members:', errFmt)

        if (insertError.code === '23505') {
          return {
            success: false,
            error: `[23505] Ya perteneces a "${householdName}".`,
            errorCode: '23505',
            errorMessage: 'Ya perteneces a esta familia.',
            alreadyMember: true,
            householdName,
            householdId: resolvedId,
          }
        }

        if (insertError.code === '42501') {
          return {
            success: false,
            error: `[42501] Error de políticas RLS: Permiso denegado para insertar en 'group_members': ${insertError.message}`,
            errorCode: '42501',
            errorMessage: insertError.message,
            errorDetails: insertError.details || undefined,
            errorHint: insertError.hint || undefined,
          }
        }

        return {
          success: false,
          error: `[${errFmt.code}] ${errFmt.message}`,
          errorCode: errFmt.code,
          errorMessage: errFmt.message,
          errorDetails: errFmt.details,
          errorHint: errFmt.hint,
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
    const errFmt = formatSupabaseError(err)
    console.error('Error inesperado en Server Action joinHousehold:', err)
    return {
      success: false,
      error: `[EXCEPTION] ${errFmt.message}`,
      errorCode: 'EXCEPTION',
      errorMessage: errFmt.message,
      errorDetails: errFmt.details,
    }
  }
}
