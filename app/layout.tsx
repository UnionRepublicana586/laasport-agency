import type { Metadata } from 'next'
import "./globals.css"

export const metadata: Metadata = {
  title: 'LAASPORT Agency Management',
  description: 'Plataforma de gestión para representación de jugadores de futsal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-[#0f1115] text-gray-200 antialiased">
        {children}
      </body>
    </html>
  )
}