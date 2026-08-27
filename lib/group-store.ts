// USYTask — Group persistence layer (localStorage)
// No demo data. Groups start empty.

import type { Group, GroupType } from '@/types'
import { groupTypeLabels } from '@/types'
import { generateInvitationToken } from './invitation'

const GROUPS_KEY = 'usytask_groups'
const ACTIVE_GROUP_KEY = 'usytask_active_group_id'

export function getAllGroups(): Group[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    if (raw) {
      const parsed: Group[] = JSON.parse(raw)
      if (parsed.length > 0) return parsed
    }
  } catch (err) {
    console.error('Error loading groups', err)
  }
  return []
}

export function saveAllGroups(groups: Group[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
  } catch (err) {
    console.error('Error saving groups', err)
  }
}

export function getActiveGroupId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(ACTIVE_GROUP_KEY)
    if (saved) {
      const groups = getAllGroups()
      if (groups.some((g) => g.id === saved)) return saved
    }
    // Fallback to first group
    const groups = getAllGroups()
    if (groups.length > 0) return groups[0].id
  } catch {}
  return null
}

export function setActiveGroupId(groupId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_GROUP_KEY, groupId)
    window.dispatchEvent(new CustomEvent('usytask_group_change', { detail: { groupId } }))
  } catch (err) {
    console.error('Error setting active group ID', err)
  }
}

export function getActiveGroup(): Group | null {
  const groups = getAllGroups()
  const activeId = getActiveGroupId()
  if (!activeId) return groups[0] || null
  return groups.find((g) => g.id === activeId) || groups[0] || null
}

export function generateHouseholdCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let part = ''
  for (let i = 0; i < 4; i++) {
    part += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `HOG-${part}`
}

export function createGroup(name: string, type: GroupType, customCode?: string): Group {
  const groups = getAllGroups()
  const typeMeta = groupTypeLabels[type] || groupTypeLabels.other
  const newId = `group_${Math.random().toString(36).substring(2, 10)}`
  const token = customCode || generateHouseholdCode()

  const newGroup: Group = {
    id: newId,
    name: name.trim(),
    type,
    icon: typeMeta.icon,
    createdAt: new Date().toISOString().split('T')[0],
    inviteToken: token,
    isOwner: true,
  }

  const updated = [newGroup, ...groups]
  saveAllGroups(updated)
  setActiveGroupId(newId)
  return newGroup
}

export function ensureDefaultGroup(userName: string): Group {
  const groups = getAllGroups()
  if (groups.length > 0) return groups.find((g) => g.id === getActiveGroupId()) || groups[0]

  // Create default group
  const group = createGroup(`Grupo de ${userName}`, 'family')
  return group
}

export function updateGroupName(groupId: string, newName: string): void {
  const groups = getAllGroups()
  const updated = groups.map((g) => (g.id === groupId ? { ...g, name: newName.trim() } : g))
  saveAllGroups(updated)
  window.dispatchEvent(new CustomEvent('usytask_group_change', { detail: { groupId } }))
}

export function deleteGroup(groupId: string): Group[] {
  const groups = getAllGroups()
  const filtered = groups.filter((g) => g.id !== groupId)
  saveAllGroups(filtered)
  if (getActiveGroupId() === groupId && filtered.length > 0) {
    setActiveGroupId(filtered[0].id)
  }
  return filtered
}
