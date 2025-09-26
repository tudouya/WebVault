import type { ReactNode } from "react"

import { AdminHeader } from "@/components/layout/admin/admin-header"
import { AdminSidebar } from "@/components/layout/admin/admin-sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
