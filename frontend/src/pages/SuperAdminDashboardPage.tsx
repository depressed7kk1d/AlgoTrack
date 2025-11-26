function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  allowEmpty?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        {allowEmpty && <option value="">Не выбрано</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ModalActions({
  onCancel,
  submitLabel,
  isLoading,
}: {
  onCancel: () => void
  submitLabel: string
  isLoading: boolean
}) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Отмена
      </button>
      <button
        type="submit"
        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Сохранение...' : submitLabel}
      </button>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { notify } from '../lib/toast'
import {
  Shield,
  Building2,
  Users,
  Server,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Settings,
  Activity,
  Database,
  RefreshCw,
  Orbit,
} from 'lucide-react'

const AI_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gigachat', label: 'GigaChat' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'yandexgpt', label: 'YandexGPT' },
]

interface SuperAdminSchool {
  id: string
  name: string
  city: string
  timezone?: string
  aiProvider?: string
  isActive: boolean
  createdAt: string
  maxMessagesPerHour?: number
  maxMessagesPerMinute?: number
  delayBetweenMessages?: number
  greenApiInstanceId?: string | null
  greenApiInstanceId2?: string | null
  hasGreenApiToken: boolean
  hasGreenApiToken2: boolean
  hasAiApiKey: boolean
  _count: {
    admins: number
    teachers: number
    classes: number
    students: number
  }
}

interface SuperAdminAdmin {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
  school: {
    id: string
    name: string
    city?: string
  }
}

interface MonitoringOverview {
  queues: Array<{
    schoolId: string
    schoolName: string
    pending: number
    processing: number
    sent: number
    failed: number
    cancelled: number
  }>
  totals: {
    pending: number
    processing: number
    sent: number
    failed: number
    cancelled: number
  }
  errors: Array<{
    id: string
    schoolId?: string | null
    schoolName: string
    type: string
    error: string
    createdAt: string
  }>
}

type ActiveTab = 'overview' | 'schools' | 'admins' | 'monitoring'

export default function SuperAdminDashboardPage() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [showCreateSchool, setShowCreateSchool] = useState(false)
  const [editingSchool, setEditingSchool] = useState<SuperAdminSchool | null>(null)
  const [integrationsSchool, setIntegrationsSchool] = useState<SuperAdminSchool | null>(null)
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<SuperAdminAdmin | null>(null)

  const { data: schools, isLoading: schoolsLoading } = useQuery<SuperAdminSchool[]>({
    queryKey: ['super-admin', 'schools'],
    queryFn: async () => {
      const response = await api.get('/super-admin/schools')
      return response.data
    },
  })

  const { data: admins, isLoading: adminsLoading } = useQuery<SuperAdminAdmin[]>({
    queryKey: ['super-admin', 'admins'],
    queryFn: async () => {
      const response = await api.get('/super-admin/admins')
      return response.data
    },
  })

  const { data: monitoringOverview, isLoading: monitoringLoading } = useQuery<MonitoringOverview>({
    queryKey: ['super-admin', 'monitoring'],
    queryFn: async () => {
      const response = await api.get('/super-admin/monitoring/overview')
      return response.data
    },
    refetchInterval: 1000 * 60,
  })

  const createSchoolMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/super-admin/schools', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      setShowCreateSchool(false)
      notify.success('Школа создана')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось создать школу')
    },
  })

  const updateSchoolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/super-admin/schools/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      setEditingSchool(null)
      notify.success('Школа обновлена')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось обновить школу')
    },
  })

  const updateIntegrationsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/super-admin/schools/${id}/integrations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      setIntegrationsSchool(null)
      notify.success('Интеграции обновлены')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось обновить интеграции')
    },
  })

  const createAdminMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/super-admin/admins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      setShowCreateAdmin(false)
      notify.success('Администратор создан')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось создать администратора')
    },
  })

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/super-admin/admins/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      setEditingAdmin(null)
      notify.success('Администратор обновлён')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось обновить администратора')
    },
  })

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/super-admin/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      notify.success('Администратор удалён')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось удалить администратора')
    },
  })

  const overviewStats = useMemo(() => {
    if (!schools || !admins) {
      return {
        totalSchools: 0,
        totalAdmins: 0,
        totalTeachers: 0,
        totalStudents: 0,
      }
    }

    const totals = schools.reduce(
      (acc, school) => {
        acc.totalTeachers += school._count.teachers
        acc.totalStudents += school._count.students
        return acc
      },
      { totalTeachers: 0, totalStudents: 0 },
    )

    return {
      totalSchools: schools.length,
      totalAdmins: admins.length,
      totalTeachers: totals.totalTeachers,
      totalStudents: totals.totalStudents,
    }
  }, [schools, admins])

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<any> }> = [
    { id: 'overview', label: 'Обзор', icon: Shield },
    { id: 'schools', label: 'Школы', icon: Building2 },
    { id: 'admins', label: 'Администраторы', icon: Users },
    { id: 'monitoring', label: 'Мониторинг', icon: Server },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AlgoTrack</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={overviewStats}
            schools={schools}
            monitoring={monitoringOverview}
            isLoading={schoolsLoading || monitoringLoading}
          />
        )}
        {activeTab === 'schools' && (
          <SchoolsTab
            schools={schools}
            isLoading={schoolsLoading}
            onCreate={() => setShowCreateSchool(true)}
            onEdit={setEditingSchool}
            onIntegrations={setIntegrationsSchool}
          />
        )}
        {activeTab === 'admins' && (
          <AdminsTab
            admins={admins}
            isLoading={adminsLoading || schoolsLoading}
            onCreate={() => setShowCreateAdmin(true)}
            onEdit={setEditingAdmin}
            onDelete={(id) => {
              if (confirm('Удалить администратора?')) {
                deleteAdminMutation.mutate(id)
              }
            }}
          />
        )}
        {activeTab === 'monitoring' && (
          <MonitoringTab data={monitoringOverview} isLoading={monitoringLoading} />
        )}
      </main>

      {showCreateSchool && (
        <CreateSchoolModal
          onClose={() => setShowCreateSchool(false)}
          onSubmit={(data) => createSchoolMutation.mutate(data)}
          isLoading={createSchoolMutation.isPending}
        />
      )}

      {editingSchool && (
        <EditSchoolModal
          school={editingSchool}
          onClose={() => setEditingSchool(null)}
          onSubmit={(data) => updateSchoolMutation.mutate({ id: editingSchool.id, data })}
          isLoading={updateSchoolMutation.isPending}
        />
      )}

      {integrationsSchool && (
        <IntegrationsModal
          school={integrationsSchool}
          onClose={() => setIntegrationsSchool(null)}
          onSubmit={(data) => updateIntegrationsMutation.mutate({ id: integrationsSchool.id, data })}
          isLoading={updateIntegrationsMutation.isPending}
        />
      )}

      {showCreateAdmin && (
        <CreateAdminModal
          schools={schools || []}
          onClose={() => setShowCreateAdmin(false)}
          onSubmit={(data) => createAdminMutation.mutate(data)}
          isLoading={createAdminMutation.isPending}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          schools={schools || []}
          onClose={() => setEditingAdmin(null)}
          onSubmit={(data) => updateAdminMutation.mutate({ id: editingAdmin.id, data })}
          isLoading={updateAdminMutation.isPending}
        />
      )}
    </div>
  )
}

function OverviewTab({
  stats,
  schools,
  monitoring,
  isLoading,
}: {
  stats: { totalSchools: number; totalAdmins: number; totalTeachers: number; totalStudents: number }
  schools?: SuperAdminSchool[]
  monitoring?: MonitoringOverview
  isLoading: boolean
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Общий обзор</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OverviewCard label="Школ" value={stats.totalSchools} icon={Building2} accent="from-blue-500 to-cyan-500" />
        <OverviewCard label="Админов" value={stats.totalAdmins} icon={Shield} accent="from-purple-500 to-pink-500" />
        <OverviewCard label="Преподавателей" value={stats.totalTeachers} icon={Users} accent="from-indigo-500 to-purple-500" />
        <OverviewCard label="Учеников" value={stats.totalStudents} icon={Users} accent="from-emerald-500 to-lime-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Школы</h3>
              <p className="text-sm text-gray-500">Активные подключения</p>
            </div>
            <Database className="w-5 h-5 text-purple-500" />
          </div>
          {isLoading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : (
            <div className="space-y-3">
              {schools?.slice(0, 5).map((school) => (
                <div key={school.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{school.name}</p>
                    <p className="text-xs text-gray-500">{school.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Преподавателей</p>
                    <p className="font-semibold text-gray-900">{school._count.teachers}</p>
                  </div>
                </div>
              ))}
              {schools && schools.length === 0 && (
                <p className="text-gray-500 text-sm">Пока нет школ. Создайте первую!</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Очередь WhatsApp</h3>
              <p className="text-sm text-gray-500">Состояние сообщений</p>
            </div>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          {monitoring ? (
            <div className="grid grid-cols-2 gap-4">
              <QueueStat label="В ожидании" value={monitoring.totals.pending} color="text-amber-600 bg-amber-50" />
              <QueueStat label="В процессе" value={monitoring.totals.processing} color="text-blue-600 bg-blue-50" />
              <QueueStat label="Отправлено" value={monitoring.totals.sent} color="text-emerald-600 bg-emerald-50" />
              <QueueStat label="Ошибки" value={monitoring.totals.failed} color="text-red-600 bg-red-50" />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Данные мониторинга ещё не загружены.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ComponentType<any>
  accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function QueueStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-gray-100 ${color} p-4`}>
      <p className="text-xs uppercase">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function SchoolsTab({
  schools,
  isLoading,
  onCreate,
  onEdit,
  onIntegrations,
}: {
  schools?: SuperAdminSchool[]
  isLoading: boolean
  onCreate: () => void
  onEdit: (school: SuperAdminSchool) => void
  onIntegrations: (school: SuperAdminSchool) => void
}) {
  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Школы</h2>
          <p className="text-gray-500 text-sm">Управление всеми подключенными школами</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Новая школа
        </button>
      </div>

      {schools && schools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schools.map((school) => (
            <div key={school.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-500">{school.city}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                  <p className="text-sm text-gray-500">Часовой пояс: {school.timezone || '—'}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {school.aiProvider || 'AI не задан'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <StatBlock label="Админы" value={school._count.admins} />
                <StatBlock label="Преподаватели" value={school._count.teachers} />
                <StatBlock label="Классы" value={school._count.classes} />
                <StatBlock label="Ученики" value={school._count.students} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <TokenBadge label="Green API" active={school.hasGreenApiToken} />
                <TokenBadge label="Green API резерв" active={school.hasGreenApiToken2} />
                <TokenBadge label="AI ключ" active={school.hasAiApiKey} />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => onEdit(school)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={() => onIntegrations(school)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
                >
                  <Settings className="w-4 h-4" />
                  Интеграции
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500">Школ пока нет. Создайте первую школу, чтобы продолжить.</p>
        </div>
      )}
    </div>
  )
}

function TokenBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full border ${
        active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
      }`}
    >
      {label}: {active ? 'настроено' : 'нет'}
    </span>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function AdminsTab({
  admins,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
}: {
  admins?: SuperAdminAdmin[]
  isLoading: boolean
  onCreate: () => void
  onEdit: (admin: SuperAdminAdmin) => void
  onDelete: (id: string) => void
}) {
  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Администраторы</h2>
          <p className="text-gray-500 text-sm">Управление доступом администраторов по всем школам</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Добавить админа
        </button>
      </div>

      {admins && admins.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Школа</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.school?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        admin.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {admin.isActive ? 'Активен' : 'Отключен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-3">
                    <button onClick={() => onEdit(admin)} className="text-purple-600 hover:text-purple-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(admin.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500">Администраторы ещё не созданы.</p>
        </div>
      )}
    </div>
  )
}

function MonitoringTab({ data, isLoading }: { data?: MonitoringOverview; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Мониторинг очереди</h2>
        <p className="text-sm text-gray-500">Статусы WhatsApp сообщений по школам</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data?.queues.map((queue) => (
          <div key={queue.schoolId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Школа</p>
                <p className="font-semibold text-gray-900">{queue.schoolName}</p>
              </div>
              <Orbit className="w-5 h-5 text-purple-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <QueueChip label="В ожидании" value={queue.pending} color="text-amber-600 bg-amber-50" />
              <QueueChip label="В процессе" value={queue.processing} color="text-blue-600 bg-blue-50" />
              <QueueChip label="Отправлено" value={queue.sent} color="text-emerald-700 bg-emerald-50" />
              <QueueChip label="Ошибки" value={queue.failed} color="text-red-600 bg-red-50" />
            </div>
          </div>
        ))}
        {!data?.queues?.length && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-500">Очередь пуста.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Последние ошибки</h3>
            <p className="text-sm text-gray-500">Помогает увидеть проблемы с интеграциями</p>
          </div>
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Время</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Школа</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сообщение</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.errors?.map((err) => (
                <tr key={err.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(err.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{err.schoolName}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{err.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{err.error}</td>
                </tr>
              ))}
              {!data?.errors?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500 text-sm">
                    Ошибок не зарегистрировано
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function QueueChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl px-3 py-2 border border-gray-100 ${color}`}>
      <p className="text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function CreateSchoolModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    city: '',
    timezone: '',
    aiProvider: 'openai',
    maxMessagesPerHour: 100,
    maxMessagesPerMinute: 5,
    delayBetweenMessages: 20,
  })

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal title="Новая школа" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form)
        }}
      >
        <InputField label="Название" value={form.name} onChange={(v) => handleChange('name', v)} required />
        <InputField label="Город" value={form.city} onChange={(v) => handleChange('city', v)} required />
        <InputField label="Таймзона" value={form.timezone} onChange={(v) => handleChange('timezone', v)} placeholder="Europe/Moscow" />
        <SelectField
          label="AI провайдер"
          value={form.aiProvider}
          onChange={(v) => handleChange('aiProvider', v)}
          options={AI_PROVIDER_OPTIONS}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField label="Лимит/час" value={form.maxMessagesPerHour} onChange={(v) => handleChange('maxMessagesPerHour', v)} />
          <NumberField label="Лимит/мин" value={form.maxMessagesPerMinute} onChange={(v) => handleChange('maxMessagesPerMinute', v)} />
          <NumberField label="Пауза (сек)" value={form.delayBetweenMessages} onChange={(v) => handleChange('delayBetweenMessages', v)} />
        </div>
        <ModalActions onCancel={onClose} submitLabel="Создать" isLoading={isLoading} />
      </form>
    </Modal>
  )
}

function EditSchoolModal({
  school,
  onClose,
  onSubmit,
  isLoading,
}: {
  school: SuperAdminSchool
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({
    name: school.name,
    city: school.city,
    timezone: school.timezone || '',
    aiProvider: school.aiProvider || '',
    maxMessagesPerHour: school.maxMessagesPerHour || 100,
    maxMessagesPerMinute: school.maxMessagesPerMinute || 5,
    delayBetweenMessages: school.delayBetweenMessages || 20,
  })

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal title="Редактировать школу" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form)
        }}
      >
        <InputField label="Название" value={form.name} onChange={(v) => handleChange('name', v)} required />
        <InputField label="Город" value={form.city} onChange={(v) => handleChange('city', v)} required />
        <InputField label="Таймзона" value={form.timezone} onChange={(v) => handleChange('timezone', v)} placeholder="Europe/Moscow" />
        <SelectField
          label="AI провайдер"
          value={form.aiProvider}
          onChange={(v) => handleChange('aiProvider', v)}
          allowEmpty
          options={AI_PROVIDER_OPTIONS}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField label="Лимит/час" value={form.maxMessagesPerHour} onChange={(v) => handleChange('maxMessagesPerHour', v)} />
          <NumberField label="Лимит/мин" value={form.maxMessagesPerMinute} onChange={(v) => handleChange('maxMessagesPerMinute', v)} />
          <NumberField label="Пауза (сек)" value={form.delayBetweenMessages} onChange={(v) => handleChange('delayBetweenMessages', v)} />
        </div>
        <ModalActions onCancel={onClose} submitLabel="Сохранить" isLoading={isLoading} />
      </form>
    </Modal>
  )
}

function IntegrationsModal({
  school,
  onClose,
  onSubmit,
  isLoading,
}: {
  school: SuperAdminSchool
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  type SensitiveField = 'greenApiToken' | 'greenApiToken2' | 'aiApiKey' | 'yandexFolderId'

  const [form, setForm] = useState({
    greenApiInstanceId: school.greenApiInstanceId || '',
    greenApiToken: '',
    greenApiInstanceId2: school.greenApiInstanceId2 || '',
    greenApiToken2: '',
    aiProvider: school.aiProvider || '',
    aiApiKey: '',
    yandexFolderId: '',
  })

  const [touched, setTouched] = useState<Record<SensitiveField, boolean>>({
    greenApiToken: false,
    greenApiToken2: false,
    aiApiKey: false,
    yandexFolderId: false,
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const markTouched = (field: SensitiveField) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const providerMeta = (() => {
    switch (form.aiProvider) {
      case 'gigachat':
        return {
          label: 'GigaChat Authorization key (Basic ...)',
          helper: 'Используйте Authorization key из кабинета Сбера (формат Base64).',
        }
      case 'openrouter':
        return {
          label: 'OpenRouter API Key',
          helper: 'Ключ из https://openrouter.ai. Мы добавим заголовки Referer и X-Title автоматически.',
        }
      case 'yandexgpt':
        return {
          label: 'Yandex API Key',
          helper: 'Укажите API‑ключ сервисного аккаунта. Ниже впишите Folder ID (каталог).',
        }
      case 'openai':
      default:
        return {
          label: 'OpenAI API Key',
          helper: 'Формат sk-.... Ключ хранится в зашифрованном виде.',
        }
    }
  })()

  const buildAiPayload = () => {
    if (form.aiProvider === 'yandexgpt') {
      if (!form.aiApiKey && !form.yandexFolderId) {
        return null
      }
      return JSON.stringify({
        apiKey: form.aiApiKey,
        folderId: form.yandexFolderId,
      })
    }

    if (!form.aiApiKey) {
      return null
    }

    return form.aiApiKey
  }

  const normalizedOrNull = (value: string) => (value && value.trim().length > 0 ? value : null)

  return (
    <Modal title="Интеграции школы" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const payload: Record<string, any> = {}

          if (form.greenApiInstanceId !== (school.greenApiInstanceId || '')) {
            payload.greenApiInstanceId = normalizedOrNull(form.greenApiInstanceId)
          }
          if (touched.greenApiToken) {
            payload.greenApiToken = normalizedOrNull(form.greenApiToken)
          }
          if (form.greenApiInstanceId2 !== (school.greenApiInstanceId2 || '')) {
            payload.greenApiInstanceId2 = normalizedOrNull(form.greenApiInstanceId2)
          }
          if (touched.greenApiToken2) {
            payload.greenApiToken2 = normalizedOrNull(form.greenApiToken2)
          }
          if (form.aiProvider !== (school.aiProvider || '')) {
            payload.aiProvider = form.aiProvider || null
          }

          const aiKeyTouched = touched.aiApiKey || touched.yandexFolderId
          if (aiKeyTouched) {
            payload.aiApiKey = buildAiPayload()
          }

          onSubmit(payload)
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Green API Instance ID" value={form.greenApiInstanceId} onChange={(v) => handleChange('greenApiInstanceId', v)} />
          <InputField
            label="Green API Token"
            value={form.greenApiToken}
            onChange={(v) => {
              handleChange('greenApiToken', v)
              markTouched('greenApiToken')
            }}
            placeholder={school.hasGreenApiToken ? '••••••••' : ''}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Green API Instance ID (резерв)" value={form.greenApiInstanceId2} onChange={(v) => handleChange('greenApiInstanceId2', v)} />
          <InputField
            label="Green API Token (резерв)"
            value={form.greenApiToken2}
            onChange={(v) => {
              handleChange('greenApiToken2', v)
              markTouched('greenApiToken2')
            }}
            placeholder={school.hasGreenApiToken2 ? '••••••••' : ''}
          />
        </div>
        <SelectField
          label="AI провайдер"
          value={form.aiProvider}
          onChange={(v) => handleChange('aiProvider', v)}
          allowEmpty
          options={AI_PROVIDER_OPTIONS}
        />
        <InputField
          label={providerMeta.label}
          value={form.aiApiKey}
          onChange={(v) => {
            handleChange('aiApiKey', v)
            markTouched('aiApiKey')
          }}
          placeholder={school.hasAiApiKey ? '••••••••' : ''}
        />
        {providerMeta.helper && <p className="text-xs text-gray-500 -mt-2">{providerMeta.helper}</p>}
        {form.aiProvider === 'yandexgpt' && (
          <InputField
            label="Yandex Folder ID (каталог)"
            value={form.yandexFolderId}
            onChange={(v) => {
              handleChange('yandexFolderId', v)
              markTouched('yandexFolderId')
            }}
            placeholder="b1gxxxxxxxxxxxxxxxx"
          />
        )}
        <ModalActions onCancel={onClose} submitLabel="Сохранить" isLoading={isLoading} />
      </form>
    </Modal>
  )
}

function CreateAdminModal({
  schools,
  onClose,
  onSubmit,
  isLoading,
}: {
  schools: SuperAdminSchool[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({
    schoolId: schools[0]?.id || '',
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal title="Новый администратор" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form)
        }}
      >
        <SelectField
          label="Школа"
          value={form.schoolId}
          onChange={(v) => handleChange('schoolId', v)}
          options={schools.map((school) => ({ value: school.id, label: school.name }))}
        />
        <InputField label="Имя" value={form.name} onChange={(v) => handleChange('name', v)} required />
        <InputField label="Email" value={form.email} onChange={(v) => handleChange('email', v)} required type="email" />
        <InputField label="Пароль" value={form.password} onChange={(v) => handleChange('password', v)} required type="password" />
        <InputField label="Телефон" value={form.phone} onChange={(v) => handleChange('phone', v)} />
        <ModalActions onCancel={onClose} submitLabel="Создать" isLoading={isLoading} />
      </form>
    </Modal>
  )
}

function EditAdminModal({
  admin,
  schools,
  onClose,
  onSubmit,
  isLoading,
}: {
  admin: SuperAdminAdmin
  schools: SuperAdminSchool[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({
    schoolId: admin.school?.id || '',
    name: admin.name,
    email: admin.email,
    phone: admin.phone || '',
    password: '',
    isActive: admin.isActive,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal title="Редактировать администратора" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form)
        }}
      >
        <SelectField
          label="Школа"
          value={form.schoolId}
          onChange={(v) => handleChange('schoolId', v)}
          options={schools.map((school) => ({ value: school.id, label: school.name }))}
        />
        <InputField label="Имя" value={form.name} onChange={(v) => handleChange('name', v)} required />
        <InputField label="Email" value={form.email} onChange={(v) => handleChange('email', v)} required type="email" />
        <InputField label="Телефон" value={form.phone} onChange={(v) => handleChange('phone', v)} />
        <InputField label="Новый пароль (опционально)" value={form.password} onChange={(v) => handleChange('password', v)} type="password" />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            checked={form.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
          />
          Активен
        </label>
        <ModalActions onCancel={onClose} submitLabel="Сохранить" isLoading={isLoading} />
      </form>
    </Modal>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}


