'use client'

import { AppShell } from '@/components/app/app-shell'
import { HistoryLock } from '@/components/app/history-lock'

export default function AppDashboardPage() {
  return (
    <>
      <HistoryLock />
      <AppShell />
    </>
  )
}


