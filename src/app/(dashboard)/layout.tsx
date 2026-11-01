'use client'

import RequireAdmin from '@/components/RequireAdmin'
import Layout from '@/components/Layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <Layout>{children}</Layout>
    </RequireAdmin>
  )
}
