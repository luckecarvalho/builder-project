'use client'

import Link from 'next/link'
import { ArrowRight, Grid3X3, Zap, Palette, Code, ChevronDown, BookOpen, UserPlus, GraduationCap, Wrench, Home as HomeIcon, BarChart3, Target, Briefcase, Settings, Plus, Menu, X, Globe, Zap as ZapIcon, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [cursoExpanded, setCursoExpanded] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50 w-full m-0 p-0">
      <div className="flex min-h-screen w-full m-0 p-0">
        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-all duration-300 ease-in-out
          bg-white border-r border-gray-200 shadow-lg
        `}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`${sidebarCollapsed ? 'p-4' : 'p-4'}`}>
              <div className="flex items-center justify-between">
               
                {sidebarCollapsed && (
                  <div className="flex items-center justify-between w-full">
                  
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Menu className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Navegação Principal */}
            <nav className={`flex-1 ${sidebarCollapsed ? 'px-3 py-4 space-y-3' : 'p-4 space-y-1'}`}>
              {/* Home */}
              <Link 
                href="/" 
                className={`flex items-center transition-colors ${
                  sidebarCollapsed 
                    ? 'justify-center w-10 h-10 mx-auto hover:bg-gray-100 rounded-lg' 
                    : 'gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HomeIcon className={`text-gray-600 ${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
                {!sidebarCollapsed && <span>Home</span>}
              </Link>

              {/* Builder - Ativo */}
              <Link 
                href="/page-builder" 
                className={`flex items-center transition-colors bg-green-50 text-green-700 ${
                  sidebarCollapsed 
                    ? 'justify-center w-10 h-10 mx-auto rounded-lg' 
                    : 'gap-3 px-3 py-2 rounded-lg text-sm font-medium'
                }`}
              >
                <Wrench className={`text-green-600 ${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
                {!sidebarCollapsed && <span>Builder</span>}
              </Link>

              {/* Curso - Menu com subitens */}
              <div className={sidebarCollapsed ? 'space-y-3' : 'space-y-1'}>
                <button
                  onClick={() => setCursoExpanded(!cursoExpanded)}
                  className={`flex items-center text-gray-700 hover:bg-gray-100 transition-colors relative ${
                    sidebarCollapsed 
                      ? 'justify-center w-10 h-10 mx-auto rounded-lg' 
                      : 'gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium'
                  }`}
                >
                  <BookOpen className={`text-gray-600 ${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span>Curso</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${cursoExpanded ? 'rotate-180' : ''}`} />
                    </>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></div>
                  )}
                </button>

                {/* Subitens do Curso */}
                {cursoExpanded && !sidebarCollapsed && (
                  <div className="ml-4 space-y-1">
                    {/* Cadastro */}
                    <a 
                      href="#" 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative"
                    >
                      <UserPlus className="w-4 h-4 text-gray-600" />
                      <span>Cadastro</span>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Em breve
                      </span>
                    </a>

                    {/* Matrícula */}
                    <a 
                      href="#" 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative"
                    >
                      <GraduationCap className="w-4 h-4 text-gray-600" />
                      <span>Matrícula</span>
                      <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Em breve
                      </span>
                    </a>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Header com botão de menu mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Conteúdo principal */}
          <div className="h-full w-full">
            {/* Hero/CTA existente */}
            <div className="w-full px-4 py-20">
              {/* CTA Section */}
              <div className="text-center mt-20">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Pronto para Começar?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Experimente o Builder Flexível e crie páginas profissionais em minutos
                  </p>
                  <Link 
                    href="/page-builder"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <span className="mr-2">🎨</span>
                    Acessar Page Builder
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}