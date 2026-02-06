import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aplicação de Acessibilidade',
  description: 'Uma aplicação moderna construída com Next.js 15 e Tailwind CSS 4',
  keywords: ['acessibilidade', 'next.js', 'react', 'tailwind'],
  authors: [{ name: 'Desenvolvedor' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen m-0 p-0">
        {children}
      </body>
    </html>
  )
} 