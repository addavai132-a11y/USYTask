'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase'
import { getStoredSession, setStoredSession } from './user-session'
import { getAllMembers, saveAllMembers } from './data-store'

/**
 * Fetches the real accumulated points for the authenticated user from Supabase database
 * (profiles table, group_members table, and cloud backup) with graceful fallback and reconciliation.
 */
export async function fetchRealUserPoints(userId?: string): Promise<number> {
  try {
    const supabase = createClient()
    let uid = userId

    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      uid = user?.id
    }

    const storedSession = getStoredSession()
    let maxPoints = 0

    // Check local members first as instant baseline
    const localMembers = getAllMembers()
    const matchingLocalMember = localMembers.find(
      (m) =>
        m.isOwner ||
        (uid && (m as any).userId === uid) ||
        (storedSession?.username && m.name.toLowerCase() === storedSession.username.toLowerCase()) ||
        (storedSession?.fullName && m.name.toLowerCase() === storedSession.fullName.toLowerCase())
    ) || localMembers[0]

    if (matchingLocalMember && typeof matchingLocalMember.points === 'number') {
      maxPoints = Math.max(maxPoints, matchingLocalMember.points)
    }

    if (storedSession?.points && typeof storedSession.points === 'number') {
      maxPoints = Math.max(maxPoints, storedSession.points)
    }

    // If no authenticated user ID, return local points
    if (!uid) {
      return maxPoints
    }

    // 1. Query Supabase public.profiles
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points, usytask_cloud_backup')
        .eq('id', uid)
        .maybeSingle()

      if (!error && profile) {
        if (typeof profile.points === 'number') {
          maxPoints = Math.max(maxPoints, profile.points)
        }

        // Check usytask_cloud_backup if points were recorded in cloud JSON
        if (profile.usytask_cloud_backup && typeof profile.usytask_cloud_backup === 'object') {
          const backup = profile.usytask_cloud_backup as any
          if (Array.isArray(backup.members)) {
            const mem = backup.members.find(
              (m: any) =>
                m.isOwner ||
                m.userId === uid ||
                (storedSession?.fullName && m.name?.toLowerCase() === storedSession.fullName.toLowerCase())
            ) || backup.members[0]

            if (mem && typeof mem.points === 'number') {
              maxPoints = Math.max(maxPoints, mem.points)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[points-service] profiles query warning:', err)
    }

    // 2. Query Supabase public.group_members
    try {
      const { data: gmData, error: gmError } = await supabase
        .from('group_members')
        .select('points')
        .eq('user_id', uid)

      if (!gmError && gmData && gmData.length > 0) {
        const sumGm = gmData.reduce((acc, gm) => acc + (Number(gm.points) || 0), 0)
        maxPoints = Math.max(maxPoints, sumGm)
      }
    } catch (err) {
      console.warn('[points-service] group_members query warning:', err)
    }

    // 3. Query Supabase public.tasks (completed tasks created by or assigned to user)
    try {
      const { data: completedTasks, error: taskError } = await supabase
        .from('tasks')
        .select('points')
        .eq('completed', true)
        .eq('created_by', uid)

      if (!taskError && completedTasks && completedTasks.length > 0) {
        const sumTasks = completedTasks.reduce((acc, t) => acc + (Number(t.points) || 0), 0)
        maxPoints = Math.max(maxPoints, sumTasks)
      }
    } catch (err) {
      console.warn('[points-service] tasks query warning:', err)
    }

    // 4. If local points are higher than remote, or if remote had higher, reconcile both
    if (matchingLocalMember && matchingLocalMember.points < maxPoints) {
      matchingLocalMember.points = maxPoints
      saveAllMembers(localMembers)
    }

    // If remote profile has lower points than local maxPoints, sync up to profiles table
    try {
      await supabase
        .from('profiles')
        .update({ points: maxPoints, updated_at: new Date().toISOString() })
        .eq('id', uid)
    } catch {
      // Ignored if column not added yet or offline
    }

    // Update stored session cache
    if (storedSession) {
      setStoredSession({ ...storedSession, points: maxPoints })
    }

    return maxPoints
  } catch (err) {
    console.error('[points-service] fetchRealUserPoints error:', err)
    return 0
  }
}

/**
 * Updates user points in Supabase database and local store, triggering real-time UI refresh.
 */
export async function syncUserPointsToDatabase(
  pointsDelta: number,
  memberId?: string
): Promise<number> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Update local member store
    const localMembers = getAllMembers()
    let currentLocalPoints = 0

    const idx = memberId
      ? localMembers.findIndex((m) => m.id === memberId)
      : localMembers.findIndex(
          (m) =>
            m.isOwner ||
            (user?.id && (m as any).userId === user.id) ||
            m.name.toLowerCase() === user?.user_metadata?.name?.toLowerCase()
        )

    if (idx >= 0) {
      currentLocalPoints = Math.max(0, (localMembers[idx].points || 0) + pointsDelta)
      localMembers[idx] = { ...localMembers[idx], points: currentLocalPoints }
      saveAllMembers(localMembers)
    }

    // 2. Determine target points
    const storedSession = getStoredSession()
    const basePoints = storedSession?.points || currentLocalPoints
    const newTotalPoints = Math.max(0, basePoints + (idx < 0 ? pointsDelta : 0))
    const finalPoints = Math.max(currentLocalPoints, newTotalPoints)

    if (storedSession) {
      setStoredSession({ ...storedSession, points: finalPoints })
    }

    // 3. Dispatch local event for instant zero-latency UI reaction
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('usytask_points_updated', {
          detail: { points: finalPoints, pointsDelta },
        })
      )
    }

    // 4. Persist to Supabase if authenticated
    if (user?.id) {
      // Update public.profiles
      try {
        await supabase
          .from('profiles')
          .update({
            points: finalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      } catch (err) {
        console.warn('[points-service] Error updating profiles.points:', err)
      }

      // Update public.group_members
      try {
        await supabase
          .from('group_members')
          .update({
            points: finalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
      } catch (err) {
        console.warn('[points-service] Error updating group_members.points:', err)
      }
    }

    return finalPoints
  } catch (err) {
    console.error('[points-service] syncUserPointsToDatabase error:', err)
    return 0
  }
}

/**
 * React hook that connects the Profile screen (and other gamified views)
 * to real-time points data from Supabase and local app actions.
 */
export function useUserPoints(initialFallback = 0) {
  const [points, setPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredSession()
      if (s?.points && typeof s.points === 'number') return s.points
      const mems = getAllMembers()
      const myMem = mems.find((m) => m.isOwner) || mems[0]
      if (myMem?.points) return myMem.points
    }
    return initialFallback
  })

  const [loading, setLoading] = useState(true)

  const reloadPoints = useCallback(async () => {
    try {
      const realPoints = await fetchRealUserPoints()
      setPoints(realPoints)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Initial load
    reloadPoints()

    // Listen for local real-time app events (task completed, challenge finished, rewards claimed)
    const handleLocalPointsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ points?: number; pointsDelta?: number }>
      if (!isMounted) return

      if (typeof customEvent.detail?.points === 'number') {
        setPoints(customEvent.detail.points)
      } else if (typeof customEvent.detail?.pointsDelta === 'number') {
        setPoints((prev) => Math.max(0, prev + customEvent.detail.pointsDelta!))
      } else {
        reloadPoints()
      }
    }

    window.addEventListener('usytask_points_updated', handleLocalPointsUpdate)

    // Listen for Supabase Realtime postgres_changes
    const supabase = createClient()
    let channel: any = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted) return

      channel = supabase
        .channel(`realtime-points-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload: any) => {
            if (isMounted && payload.new && typeof payload.new.points === 'number') {
              setPoints((prev) => Math.max(prev, payload.new.points))
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` },
          (payload: any) => {
            if (isMounted && payload.new && typeof payload.new.points === 'number') {
              setPoints((prev) => Math.max(prev, payload.new.points))
            }
          }
        )
        .subscribe()
    })

    return () => {
      isMounted = false
      window.removeEventListener('usytask_points_updated', handleLocalPointsUpdate)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [reloadPoints])

  return { points, loading, refreshPoints: reloadPoints }
}
