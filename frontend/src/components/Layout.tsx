import { Outlet } from "react-router-dom"
import { SiteHeader } from "./SiteHeader"

export function Layout() {
  return (
    <div className="min-h-screen bg-background iron-bg-pattern flex flex-col">
      <SiteHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

