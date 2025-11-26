import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  FileText,
  ArrowRight,
  Bell,
  Loader2,
  MessageSquare,
  Send
} from 'lucide-react'

interface DashboardData {
  stats: {
    teachers: number
    classes: number
    students: number
    lessonsThisWeek: number
    pendingReports: number
    pendingMessages: number
  }
  modulesReadyForOS: Array<{
    moduleId: string
    moduleTitle: string
    className: string
    teacherName: string
    lessonsCompleted: number
    totalLessons: number
    isFullyCompleted: boolean
  }>
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard')
      return response.data
    },
  })

  const stats = [
    { label: 'Преподавателей', value: data?.stats.teachers || 0, icon: GraduationCap, color: 'bg-amber-500', path: '/admin/teachers' },
    { label: 'Классов', value: data?.stats.classes || 0, icon: BookOpen, color: 'bg-emerald-500', path: '/admin/classes' },
    { label: 'Учеников', value: data?.stats.students || 0, icon: Users, color: 'bg-violet-500', path: '/admin/classes' },
    { label: 'Готово ОС', value: data?.modulesReadyForOS?.length || 0, icon: FileText, color: 'bg-rose-500', path: null },
  ]

  if (isLoading) {
    return (
      <MainLayout title="Панель администратора">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Панель администратора">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Привет, {user?.name}! 👋
        </h2>
        <p className="text-slate-600">
          {user?.schoolName || 'Школа программирования "Алгоритмика"'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => stat.path && navigate(stat.path)}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modules Ready for OS */}
      {data?.modulesReadyForOS && data.modulesReadyForOS.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6" />
            <h3 className="text-lg font-semibold">
              🔔 Модули готовы к генерации персональных ОС!
            </h3>
          </div>
          
          <div className="space-y-3">
            {data.modulesReadyForOS.map((module) => (
              <div 
                key={module.moduleId}
                className="bg-white/10 backdrop-blur rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{module.moduleTitle}</p>
                    {module.isFullyCompleted ? (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">✓ Все заполнено</span>
                    ) : (
                      <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                        {module.lessonsCompleted}/{module.totalLessons} заполнено
                      </span>
                    )}
                  </div>
                  <p className="text-rose-100 text-sm">
                    {module.className} • {module.teacherName}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/reports/${module.moduleId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 rounded-lg font-medium hover:bg-rose-50 hover:shadow-lg transition-all"
                >
                  Генерировать ОС
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/admin/teachers')}
          className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:shadow-md transition-shadow"
        >
          <GraduationCap className="w-8 h-8 text-amber-500 mb-3" />
          <h4 className="font-semibold text-slate-900">Преподаватели</h4>
          <p className="text-slate-500 text-sm mt-1">Управление преподавателями школы</p>
        </button>

        <button
          onClick={() => navigate('/admin/classes')}
          className="p-6 bg-white rounded-xl border border-slate-200 text-left hover:shadow-md transition-shadow"
        >
          <BookOpen className="w-8 h-8 text-emerald-500 mb-3" />
          <h4 className="font-semibold text-slate-900">Классы</h4>
          <p className="text-slate-500 text-sm mt-1">Управление группами и учениками</p>
        </button>

        <button
          onClick={() => navigate('/admin/os-template')}
          className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200 text-left hover:shadow-md transition-shadow"
        >
          <FileText className="w-8 h-8 text-rose-500 mb-3" />
          <h4 className="font-semibold text-slate-900">Шаблон ОС</h4>
          <p className="text-slate-500 text-sm mt-1">Настроить свой стиль обратной связи</p>
        </button>

        <button
          onClick={() => navigate('/admin/whatsapp')}
          className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 text-left hover:shadow-md transition-shadow"
        >
          <MessageSquare className="w-8 h-8 text-green-500 mb-3" />
          <h4 className="font-semibold text-slate-900">WhatsApp</h4>
          <p className="text-slate-500 text-sm mt-1">Настроить бота для вашей школы</p>
        </button>

        <button
          onClick={() => navigate('/admin/broadcast')}
          className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 text-left hover:shadow-md transition-shadow"
        >
          <Send className="w-8 h-8 text-violet-500 mb-3" />
          <h4 className="font-semibold text-slate-900">Рассылки</h4>
          <p className="text-slate-500 text-sm mt-1">Массовая отправка в группы</p>
        </button>
      </div>
    </MainLayout>
  )
}

