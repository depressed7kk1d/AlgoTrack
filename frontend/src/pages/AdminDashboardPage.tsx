import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { notify } from '../lib/toast'
import { 
  BookOpen, Users, Settings, FileText, 
  UserPlus, Edit, Trash2, Plus, LogOut, Key, 
  Filter, Search, Eye, ClipboardCopy, Sparkles, Send, Download, PhoneCall, AlertTriangle, Loader2 
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'settings' | 'reports'>('classes')
  const [showCreateTeacher, setShowCreateTeacher] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Загрузка классов
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data
    },
  })

  // Загрузка учителей
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers')
      return response.data
    },
    enabled: activeTab === 'teachers',
  })

  // Загрузка настроек школы
  const { data: school } = useQuery({
    queryKey: ['school', user?.schoolId],
    queryFn: async () => {
      if (user?.schoolId) {
        const response = await api.get(`/schools/${user.schoolId}`)
        return response.data
      }
      // Для SuperAdmin получаем первую школу
      const response = await api.get('/schools')
      const schools = response.data
      return schools?.[0]
    },
    enabled: activeTab === 'settings' && !!user,
  })

  // Создание учителя
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/admin/teachers', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setShowCreateTeacher(false)
      notify.success('Учитель успешно создан!')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Ошибка создания учителя')
    },
  })

  // Обновление настроек
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.patch('/admin/settings', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school'] })
      setShowSettings(false)
      notify.success('Настройки сохранены!')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Ошибка сохранения настроек')
    },
  })

  // Создание класса
  const createClassMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/classes', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      notify.success('Класс успешно создан!')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Ошибка создания класса')
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AlgoTrack</h1>
                <p className="text-xs text-gray-500">Администратор</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowChangePassword(true)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Изменить пароль"
              >
                <Key className="w-5 h-5 text-gray-600" />
              </button>
              
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

      {/* Вкладки */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('classes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Классы
              </div>
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teachers'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Учителя
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Настройки
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Отчёты
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'classes' && (
          <ClassesTab 
            classes={classes} 
            isLoading={classesLoading}
            onCreateClass={(data: any) => createClassMutation.mutate(data)}
            onClassClick={(id: string) => navigate(`/classes/${id}`)}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersTab
            teachers={teachers}
            isLoading={teachersLoading}
            onShowCreate={() => setShowCreateTeacher(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            school={school}
            onShowSettings={() => setShowSettings(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab currentUser={user} />
        )}
      </main>

      {/* Модальные окна */}
      {showCreateTeacher && (
        <CreateTeacherModal
          onClose={() => setShowCreateTeacher(false)}
          onCreate={(data: any) => createTeacherMutation.mutate(data)}
          isLoading={createTeacherMutation.isPending}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {showSettings && school && (
        <SettingsModal
          school={school}
          onClose={() => setShowSettings(false)}
          onSave={(data: any) => updateSettingsMutation.mutate(data)}
          isLoading={updateSettingsMutation.isPending}
        />
      )}
    </div>
  )
}

// Компонент вкладки "Классы"
function ClassesTab({ classes, isLoading, onCreateClass, onClassClick }: any) {
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Классы</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Создать класс
        </button>
      </div>

      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem: any) => (
            <div 
              key={classItem.id} 
              onClick={() => onClassClick(classItem.id)}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{classItem._count?.students || 0}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{classItem.name}</h3>
              <p className="text-gray-500 text-sm">{classItem._count?.students || 0} {classItem._count?.students === 1 ? 'ученик' : classItem._count?.students < 5 ? 'ученика' : 'учеников'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">Нет классов</p>
        </div>
      )}

      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onCreate={onCreateClass}
        />
      )}
    </div>
  )
}

// Компонент вкладки "Учителя"
function TeachersTab({ teachers, isLoading, onShowCreate }: any) {
  const queryClient = useQueryClient()
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/teachers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      notify.success('Учитель удалён')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Ошибка удаления учителя')
    },
  })

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.patch(`/teachers/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setEditingTeacher(null)
      notify.success('Учитель обновлён')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Ошибка обновления учителя')
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого учителя?')) {
      deleteTeacherMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Учителя</h2>
        <button
          onClick={onShowCreate}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <UserPlus className="w-5 h-5" />
          Добавить учителя
        </button>
      </div>

      {teachers && teachers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher: Teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {teacher.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setEditingTeacher(teacher)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">Нет учителей</p>
        </div>
      )}

      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={(data: any) => updateTeacherMutation.mutate({ id: editingTeacher.id, data })}
          isLoading={updateTeacherMutation.isPending}
        />
      )}
    </div>
  )
}

// Компонент вкладки "Настройки"
function SettingsTab({ school, onShowSettings }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Настройки школы</h2>
        <button
          onClick={onShowSettings}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Settings className="w-5 h-5" />
          Редактировать
        </button>
      </div>

      {school && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Название школы</label>
            <p className="text-lg font-semibold text-gray-900">{school.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Город</label>
            <p className="text-lg text-gray-900">{school.city}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">AI Провайдер</label>
            <p className="text-lg text-gray-900">{school.aiProvider || 'Не настроен'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Компонент вкладки "Отчёты"
interface PersonalReport {
  id: string
  status: 'DRAFT' | 'GENERATED' | 'SENT'
  avgCompletion?: number
  content?: string
  pdfUrl?: string
  updatedAt: string
  createdAt: string
  student: {
    id: string
    name: string
    parentName: string
    parentPhone: string
    parentType: string
    classes?: Array<{
      class: {
        id: string
        name: string
        teacher?: { id: string; name: string }
      }
    }>
    lessonCards?: Array<{
      id: string
      completionPercent: number
      lesson?: {
        id: string
        lessonNumber?: number
        lessonDate?: string
        topic?: string
        class?: {
          id: string
          name: string
        }
      }
    }>
  }
}

const parentTypeMap: Record<string, string> = {
  CALM: '🟢 Спокойный',
  ANXIOUS: '🟡 Тревожный',
  DEMANDING: '🔴 Требовательный',
}

const statusMeta: Record<PersonalReport['status'], { label: string; className: string }> = {
  DRAFT: {
    label: 'Нужно сгенерировать',
    className: 'bg-amber-100 text-amber-800',
  },
  GENERATED: {
    label: 'Готово к отправке',
    className: 'bg-blue-100 text-blue-800',
  },
  SENT: {
    label: 'Отправлено',
    className: 'bg-emerald-100 text-emerald-800',
  },
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatPhone = (value?: string) => {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length < 11) return value
  return digits.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5')
}

function ReportsTab({ currentUser }: { currentUser: any }) {
  const queryClient = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [previewReport, setPreviewReport] = useState<PersonalReport | null>(null)
  const [reportToGenerate, setReportToGenerate] = useState<PersonalReport | null>(null)
  const [reportToSend, setReportToSend] = useState<PersonalReport | null>(null)

  const { data: reports, isLoading } = useQuery<PersonalReport[]>({
    queryKey: ['personalReports'],
    queryFn: async () => {
      const response = await api.get('/admin/reports/ready')
      return response.data
    },
  })

  const extractClass = (report: PersonalReport) => {
    const fromLessons = report.student.lessonCards?.find((card) => card.lesson?.class)?.lesson?.class
    if (fromLessons) return fromLessons
    return report.student.classes?.[0]?.class || null
  }

  const classOptions = useMemo(() => {
    if (!reports) return []
    const map = new Map<string, { id: string; name: string }>()
    reports.forEach((report) => {
      const cls = extractClass(report)
      if (cls) {
        map.set(cls.id, cls)
      }
    })
    return Array.from(map.values())
  }, [reports])

  const filteredReports = useMemo(() => {
    if (!reports) return []
    return reports.filter((report) => {
      const cls = extractClass(report)
      const matchesClass = selectedClassId === 'all' ? true : cls?.id === selectedClassId
      const search = searchValue.trim().toLowerCase()
      const matchesSearch = search
        ? report.student.name.toLowerCase().includes(search) ||
          report.student.parentName.toLowerCase().includes(search)
        : true
      return matchesClass && matchesSearch
    })
  }, [reports, selectedClassId, searchValue])

  const stats = useMemo(() => {
    if (!reports) {
      return { total: 0, draft: 0, generated: 0, sent: 0 }
    }
    return {
      total: reports.length,
      draft: reports.filter((r) => r.status === 'DRAFT').length,
      generated: reports.filter((r) => r.status === 'GENERATED').length,
      sent: reports.filter((r) => r.status === 'SENT').length,
    }
  }, [reports])

  const generateReportMutation = useMutation({
    mutationFn: async ({ reportId, managerName }: { reportId: string; managerName: string }) => {
      return api.post(`/admin/reports/${reportId}/generate`, { managerName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalReports'] })
      setReportToGenerate(null)
      notify.success('ОС успешно сгенерирована!')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось сгенерировать ОС')
    },
  })

  const sendReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return api.post(`/admin/reports/${reportId}/send`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalReports'] })
      setReportToSend(null)
      notify.success('Сообщение отправлено родителю!')
    },
    onError: (error: any) => {
      notify.error(error.response?.data?.message || 'Не удалось отправить ОС')
    },
  })

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Персональные отчёты</h2>
          <p className="text-gray-500">
            Сгенерируйте и отправьте ОС родителям после четырёх занятий
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <StatsCard label="Всего" value={stats.total} />
          <StatsCard label="Ждут генерации" value={stats.draft} />
          <StatsCard label="Готовы к отправке" value={stats.generated} />
          <StatsCard label="Отправлено" value={stats.sent} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Все классы</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Поиск по ученику или родителю..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Пока нет учеников с четырьмя заполненными уроками. Как только учитель заполнит четыре
            карточки подряд, здесь появится карточка для генерации отчёта.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const studentClass = extractClass(report)
            const lessonSnapshots = [...(report.student.lessonCards || [])].sort((a, b) => {
              const aDate = a.lesson?.lessonDate ? new Date(a.lesson.lessonDate).getTime() : 0
              const bDate = b.lesson?.lessonDate ? new Date(b.lesson.lessonDate).getTime() : 0
              if (aDate === bDate) {
                return (a.lesson?.lessonNumber || 0) - (b.lesson?.lessonNumber || 0)
              }
              return aDate - bDate
            })
            const status = statusMeta[report.status]
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-purple-100 transition-all"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Класс
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {studentClass?.name || 'Без класса'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ученик: <span className="font-medium text-gray-900">{report.student.name}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs uppercase text-gray-500 mb-1">Родитель</p>
                    <p className="text-sm font-semibold text-gray-900">{report.student.parentName}</p>
                    <a
                      href={`tel:${report.student.parentPhone}`}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-1"
                    >
                      <PhoneCall className="w-4 h-4" />
                      {formatPhone(report.student.parentPhone)}
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                      {parentTypeMap[report.student.parentType] || 'Тип родителя не указан'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs uppercase text-gray-500 mb-1">Средний прогресс</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(report.avgCompletion || 0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Обновлено: {formatDate(report.updatedAt)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs uppercase text-gray-500 mb-1">Статус</p>
                    <p className="text-sm text-gray-900">
                      {report.status === 'DRAFT'
                        ? 'Нужно сгенерировать текст ОС'
                        : report.status === 'GENERATED'
                          ? 'Можно отправлять родителю'
                          : 'Отправлено родителю'}
                    </p>
                    {report.pdfUrl && (
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF отчёт
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs uppercase text-gray-500 mb-2">Последние 4 урока</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {lessonSnapshots.map((card) => (
                      <div
                        key={card.id}
                        className="border border-gray-200 rounded-xl p-3 bg-white"
                      >
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          Урок {card.lesson?.lessonNumber ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {card.lesson?.topic || 'Без темы'}
                        </p>
                        <p className="text-sm font-semibold text-purple-600 mt-2">
                          {card.completionPercent}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setPreviewReport(report)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 disabled:opacity-50"
                    disabled={!report.content}
                  >
                    <Eye className="w-4 h-4" />
                    Предпросмотр
                  </button>
                  <button
                    onClick={() => setReportToGenerate(report)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
                  >
                    <Sparkles className="w-4 h-4" />
                    {report.status === 'DRAFT' ? 'Сгенерировать ОС' : 'Перегенерировать'}
                  </button>
                  <button
                    onClick={() => setReportToSend(report)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                    disabled={report.status !== 'GENERATED'}
                  >
                    <Send className="w-4 h-4" />
                    Отправить в WhatsApp
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reportToGenerate && (
        <GenerateReportModal
          report={reportToGenerate}
          defaultManagerName={currentUser?.name || ''}
          onClose={() => setReportToGenerate(null)}
          onConfirm={(managerName) =>
            generateReportMutation.mutate({ reportId: reportToGenerate.id, managerName })
          }
          isLoading={generateReportMutation.isPending}
        />
      )}

      {previewReport && (
        <PreviewReportModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}

      {reportToSend && (
        <SendReportModal
          report={reportToSend}
          onClose={() => setReportToSend(null)}
          onConfirm={() => sendReportMutation.mutate(reportToSend.id)}
          isLoading={sendReportMutation.isPending}
        />
      )}
    </div>
  )
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function GenerateReportModal({
  report,
  defaultManagerName,
  onClose,
  onConfirm,
  isLoading,
}: {
  report: PersonalReport
  defaultManagerName: string
  onClose: () => void
  onConfirm: (managerName: string) => void
  isLoading: boolean
}) {
  const [managerName, setManagerName] = useState(defaultManagerName)

  useEffect(() => {
    setManagerName(defaultManagerName)
  }, [defaultManagerName])

  const studentClass =
    report.student.lessonCards?.find((card) => card.lesson?.class)?.lesson?.class ||
    report.student.classes?.[0]?.class ||
    null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(managerName)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Сгенерировать отчёт</h3>
        <p className="text-gray-500 mb-6">
          После подтверждения мы попросим нейросеть подготовить персональную ОС по последним четырём
          урокам.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">Ученик</p>
          <p className="text-lg font-semibold text-gray-900">{report.student.name}</p>
          <p className="text-sm text-gray-500">
            Класс: {studentClass?.name || 'Не указан'} • Родитель: {report.student.parentName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя менеджера / администратора
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Например: Оксана"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Имя будет использовано в приветствии письма для родителя.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800 flex gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Как это работает</p>
              <p>
                Мы анализируем четыре последние карточки уроков, подставляем тему каждого занятия и
                формируем готовый текст в едином стиле. Перед отправкой вы сможете посмотреть и при
                необходимости перегенерировать текст.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Генерация...' : 'Сгенерировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PreviewReportModal({ report, onClose }: { report: PersonalReport; onClose: () => void }) {
  const handleCopy = () => {
    if (report.content) {
      navigator.clipboard.writeText(report.content)
      notify.success('Текст скопирован в буфер обмена')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Предпросмотр отчёта</h3>
            <p className="text-gray-500">
              {report.student.name} • {report.student.parentName}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={!report.content}
          >
            <ClipboardCopy className="w-4 h-4" />
            Скопировать
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] whitespace-pre-wrap text-sm text-gray-800">
          {report.content || 'Текст ещё не сгенерирован'}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

function SendReportModal({
  report,
  onClose,
  onConfirm,
  isLoading,
}: {
  report: PersonalReport
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Отправить отчёт</h3>
        <p className="text-gray-500 mb-6">
          Сообщение будет отправлено в WhatsApp родителя через подключённый инстанс GreenAPI.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-500">Получатель</p>
          <p className="text-lg font-semibold text-gray-900">{report.student.parentName}</p>
          <p className="text-sm text-gray-500">{formatPhone(report.student.parentPhone)}</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 flex gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>
            Убедитесь, что текст отчёта вас устраивает. После отправки сообщение сразу уйдёт в чат с
            родителем.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Модальное окно создания учителя
function CreateTeacherModal({ onClose, onCreate, isLoading }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, email, phone, password })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Добавить учителя</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Модальное окно настроек
function SettingsModal({ school, onClose, onSave, isLoading }: any) {
  const [aiProvider, setAiProvider] = useState(school?.aiProvider || '')
  const [greenApiId, setGreenApiId] = useState('')
  const [greenApiToken, setGreenApiToken] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ aiProvider, greenApiInstanceId: greenApiId, greenApiToken })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Настройки школы</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Провайдер</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="openai">OpenAI</option>
              <option value="gigachat">GigaChat</option>
              <option value="yandexgpt">YandexGPT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GreenAPI ID</label>
            <input
              type="text"
              value={greenApiId}
              onChange={(e) => setGreenApiId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="79991234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GreenAPI Token</label>
            <input
              type="password"
              value={greenApiToken}
              onChange={(e) => setGreenApiToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Введите токен"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Модальное окно создания класса
function CreateClassModal({ onClose, onCreate }: any) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ 
      name, 
      description, 
      whatsappGroupLink: whatsappGroupLink || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Создать класс</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ссылка или ID WhatsApp группы
            </label>
            <input
              type="text"
              value={whatsappGroupLink}
              onChange={(e) => setWhatsappGroupLink(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://chat.whatsapp.com/XXXX или 79991234567-1234567890@g.us"
            />
            <p className="text-xs text-gray-500 mt-1">
              Если указать ссылку или ID сразу, система попробует автоматически определить название
              группы и привязать её к классу.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Модальное окно редактирования учителя
function EditTeacherModal({ teacher, onClose, onSave, isLoading }: any) {
  const [name, setName] = useState(teacher.name)
  const [email, setEmail] = useState(teacher.email)
  const [phone, setPhone] = useState(teacher.phone || '')
  const [isActive, setIsActive] = useState(teacher.isActive)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, email, phone, isActive })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Редактировать учителя</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Активен</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Модальное окно смены пароля (из DashboardPage)
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      notify.error('Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      notify.error('Новый пароль должен быть минимум 6 символов')
      return
    }

    setIsLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      onClose()
    } catch (error) {
      // Ошибка уже показана в AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Изменить пароль</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Текущий пароль</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Изменить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

