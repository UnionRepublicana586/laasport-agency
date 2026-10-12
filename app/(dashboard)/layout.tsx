import type { Metadata } from 'next'
import Link from 'next/link'
import SidebarLogout from './components/SidebarLogout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#0f1115] text-gray-200 flex min-h-screen overflow-hidden w-full">
      
      {/* Menú Lateral (Sidebar) con Íconos */}
      <aside className="w-52 bg-[#15181f] border-r border-[#2a2d35] flex flex-col flex-shrink-0 justify-between">
        <div className="p-5">
          <div className="flex justify-center mb-8 px-1">
            <img 
              src="https://czpufvwxiqdymxjunpej.supabase.co/storage/v1/object/public/laasport-media/75b5e7bd-2429-416c-9c17-b2b93ce726e9/logo/logoblanco.png" 
              alt="LAASPORT Logo" 
              className="w-[85%] h-auto object-contain" 
            />
          </div>

          <nav className="flex flex-col gap-1">
            <div className="text-[9px] font-bold text-gray-600 mb-2 mt-3 px-3 tracking-widest uppercase">Workspace</div>
            
            <Link href="/" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </Link>

            <Link href="/jugadores" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Jugadores
            </Link>

            <Link href="/clubes" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Clubes
            </Link>

            <Link href="/contactos" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Contactos
            </Link>

            <Link href="/oportunidades" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Oportunidades
            </Link>

            <Link href="/tareas" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Tareas
            </Link>

            <Link href="/finanzas" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Finanzas
            </Link>

            <Link href="/configuracion" className="px-3.5 py-2.5 rounded-lg text-gray-300 hover:bg-[#1a1d24] hover:text-white transition font-bold text-sm flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Configuración
            </Link>
          </nav>
        </div>

        <SidebarLogout />
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        {children}
      </main>

    </div>
  )
}