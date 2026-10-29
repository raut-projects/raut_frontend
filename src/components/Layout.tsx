import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Header from './Header'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
