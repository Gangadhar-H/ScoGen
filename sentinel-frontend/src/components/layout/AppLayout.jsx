import React from 'react'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { Footer } from './Footer.jsx'

export function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-dark-text">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none" />

        <Topbar />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-8 max-w-screen-2xl mx-auto animate-fade-in w-full">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}