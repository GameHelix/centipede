import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Header  from '@/components/layout/Header'

export const metadata: Metadata = {
  title:       'GazMonitor — Industrial Gas Monitoring',
  description: 'Real-time gas distribution monitoring, prediction and analytics system',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-scada-bg text-scada-text font-sans antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-scada-bg bg-grid-scada bg-grid-scada">
              <div className="p-4 md:p-6 animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
