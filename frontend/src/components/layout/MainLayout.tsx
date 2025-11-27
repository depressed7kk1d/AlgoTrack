import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Home, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  Building2,
  GraduationCap,
  FileText,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface MainLayoutProps {
  children: ReactNode
  title?: string
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { user, logout, isSuperAdmin, isAdmin, isTeacher } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleColor = () => {
    if (isSuperAdmin) return 'from-rose-600 to-pink-600'
    if (isAdmin) return 'from-amber-500 to-orange-500'
    return 'from-violet-600 to-purple-600'
  }

  const getRoleBadge = () => {
    if (isSuperAdmin) return { text: 'Super Admin', bg: 'bg-rose-100 text-rose-700' }
    if (isAdmin) return { text: 'Администратор', bg: 'bg-amber-100 text-amber-700' }
    return { text: 'Преподаватель', bg: 'bg-violet-100 text-violet-700' }
  }

  const getNavItems = () => {
    if (isSuperAdmin) {
      return [
        { path: '/super-admin', icon: Home, label: 'Главная' },
        { path: '/super-admin/admins', icon: Building2, label: 'Администраторы' },
        { path: '/super-admin/settings', icon: Settings, label: 'Настройки системы' },
      ]
    }
    if (isAdmin) {
      return [
        { path: '/admin', icon: Home, label: 'Главная' },
        { path: '/admin/teachers', icon: GraduationCap, label: 'Преподаватели' },
        { path: '/admin/classes', icon: BookOpen, label: 'Классы' },
        { path: '/settings', icon: Settings, label: 'Настройки' },
      ]
    }
    return [
      { path: '/teacher', icon: Home, label: 'Мои классы' },
    ]
  }

  const navItems = getNavItems()
  const roleBadge = getRoleBadge()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-center bg-gradient-to-r ${getRoleColor()}`}>
          <h1 className="text-xl font-bold text-white">AlgoTrack</h1>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleColor()} flex items-center justify-center text-white font-bold`}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.bg}`}>
                {roleBadge.text}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            // Для главных страниц (/admin, /super-admin, /teacher) - только точное совпадение
            const isHomePage = ['/admin', '/super-admin', '/teacher'].includes(item.path)
            const isActive = isHomePage 
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? `bg-gradient-to-r ${getRoleColor()} text-white` 
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        {title && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-slate-900 lg:ml-0 ml-12">{title}</h2>
          </header>
        )}
        
        {/* Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

