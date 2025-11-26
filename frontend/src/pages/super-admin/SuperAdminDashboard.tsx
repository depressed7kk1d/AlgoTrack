import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Users, 
  MessageSquare,
  Activity,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MonitoringData {
  admins: number
  teachers: number
  classes: number
  students: number
  lessonsThisWeek: number
  pendingReports: number
  pendingMessages: number
  messagesSentToday: number
}

interface School {
  id: string
  name: string
  city: string
  schoolName: string
  _count: {
    teachers: number
    classes: number
  }
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  const { data: monitoring, isLoading } = useQuery<MonitoringData>({
    queryKey: ['super-admin-monitoring'],
    queryFn: async () => {
      const response = await api.get('/super-admin/monitoring/overview')
      return response.data
    },
  })

  const { data: schools } = useQuery<School[]>({
    queryKey: ['super-admin-schools'],
    queryFn: async () => {
      const response = await api.get('/super-admin/schools')
      return response.data
    },
  })

  const stats = [
    { label: 'Администраторов', value: monitoring?.admins || 0, icon: Building2, color: 'bg-rose-500' },
    { label: 'Преподавателей', value: monitoring?.teachers || 0, icon: GraduationCap, color: 'bg-amber-500' },
    { label: 'Классов', value: monitoring?.classes || 0, icon: BookOpen, color: 'bg-emerald-500' },
    { label: 'Учеников', value: monitoring?.students || 0, icon: Users, color: 'bg-violet-500' },
  ]

  const activityStats = [
    { label: 'Уроков за неделю', value: monitoring?.lessonsThisWeek || 0, icon: Activity },
    { label: 'Ожидают отчётов', value: monitoring?.pendingReports || 0, icon: TrendingUp },
    { label: 'В очереди сообщений', value: monitoring?.pendingMessages || 0, icon: MessageSquare },
  ]

  return (
    <MainLayout title="Панель управления">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Активность</h3>
          <div className="space-y-4">
            {activityStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-5 h-5 text-slate-600" />
                  <span className="text-slate-700">{stat.label}</span>
                </div>
                <span className="text-xl font-bold text-slate-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Школы / Филиалы</h3>
            <button
              onClick={() => navigate('/super-admin/admins')}
              className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Все администраторы
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {schools?.length === 0 && (
              <p className="text-slate-500 text-center py-8">Нет данных</p>
            )}
            {schools?.map((school) => (
              <div 
                key={school.id} 
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate('/super-admin/admins')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{school.name}</p>
                    <p className="text-sm text-slate-500">
                      {school.city} • {school.schoolName || 'Не указано'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">
                      {school._count.teachers} преп. / {school._count.classes} классов
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/super-admin/admins')}
          className="p-6 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl text-white text-left hover:shadow-lg transition-shadow"
        >
          <Building2 className="w-8 h-8 mb-3" />
          <h4 className="font-semibold text-lg">Администраторы</h4>
          <p className="text-rose-100 text-sm mt-1">Создание и редактирование админов</p>
        </button>

        <button
          onClick={() => navigate('/super-admin/whatsapp')}
          className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white text-left hover:shadow-lg transition-shadow"
        >
          <MessageSquare className="w-8 h-8 mb-3" />
          <h4 className="font-semibold text-lg">WhatsApp</h4>
          <p className="text-green-100 text-sm mt-1">Настройка GREEN-API</p>
        </button>

        <button
          onClick={() => navigate('/super-admin/settings')}
          className="p-6 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white text-left hover:shadow-lg transition-shadow"
        >
          <Activity className="w-8 h-8 mb-3" />
          <h4 className="font-semibold text-lg">Настройки AI</h4>
          <p className="text-violet-100 text-sm mt-1">Нейросети и генерация ОС</p>
        </button>

        <button
          onClick={() => navigate('/super-admin/settings')}
          className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-left hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="w-8 h-8 mb-3" />
          <h4 className="font-semibold text-lg">Антибан</h4>
          <p className="text-amber-100 text-sm mt-1">Настройки защиты от бана</p>
        </button>
      </div>
    </MainLayout>
  )
}

