import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { ArrowLeft, Users, BookOpen, FileText, Bell, Calendar, Loader2, Bot, Check, AlertCircle, Plus, Upload, Trash2, X } from 'lucide-react'
import { useState } from 'react'

interface StudentFormData {
  studentName: string
  parentName: string
  parentPhone?: string
  parentType?: 'CALM' | 'ANXIOUS' | 'DEMANDING'
}

interface ImportedStudent {
  lastName: string
  firstName: string
  parentName: string
}

export default function ClassDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>({
    studentName: '',
    parentName: '',
    parentPhone: '',
    parentType: 'CALM'
  })
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([])
  const [importStep, setImportStep] = useState(1)

  const { data: classData, isLoading } = useQuery({
    queryKey: ['admin-class', id],
    queryFn: async () => (await api.get(`/admin/classes/${id}`)).data,
    enabled: !!id,
  })

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      return (await api.post(`/admin/classes/${id}/students`, data)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class', id] })
      setShowAddModal(false)
      setFormData({ studentName: '', parentName: '', parentPhone: '', parentType: 'CALM' })
    },
  })

  // Delete student mutation  
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return (await api.delete(`/admin/classes/${id}/students/${studentId}`)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class', id] })
    },
  })

  // Bulk add students mutation
  const bulkAddMutation = useMutation({
    mutationFn: async (students: ImportedStudent[]) => {
      const results = []
      for (const student of students) {
        const res = await api.post(`/admin/classes/${id}/students`, {
          studentName: `${student.lastName} ${student.firstName}`,
          parentName: student.parentName || 'Родитель',
          parentType: 'CALM'
        })
        results.push(res.data)
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class', id] })
      setShowImportModal(false)
      setImportedStudents([])
      setImportStep(1)
    },
  })

  // Parse HTML file from Algoritmika backoffice
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const html = event.target?.result as string
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Parse table rows - looking for student data
      const students: ImportedStudent[] = []
      const rows = doc.querySelectorAll('tr')
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 2) {
          // Try to extract name - format might be "Фамилия Имя" or separate cells
          const text = cells[0]?.textContent?.trim() || ''
          const parts = text.split(/\s+/)
          
          if (parts.length >= 2) {
            students.push({
              lastName: parts[0],
              firstName: parts.slice(1).join(' '),
              parentName: ''
            })
          } else if (cells.length >= 2 && cells[1]?.textContent?.trim()) {
            students.push({
              lastName: cells[0]?.textContent?.trim() || '',
              firstName: cells[1]?.textContent?.trim() || '',
              parentName: ''
            })
          }
        }
      })

      // Filter out header rows and empty entries
      const validStudents = students.filter(s => 
        s.lastName && 
        s.firstName && 
        !s.lastName.toLowerCase().includes('фамилия') &&
        !s.firstName.toLowerCase().includes('имя')
      )

      if (validStudents.length > 0) {
        setImportedStudents(validStudents)
        setImportStep(2)
      } else {
        alert('Не удалось найти учеников в файле. Проверьте формат HTML.')
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleAddStudent = () => {
    if (!formData.studentName.trim() || !formData.parentName.trim()) {
      alert('Заполните имя ученика и родителя')
      return
    }
    addStudentMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/classes')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{classData?.name}</h1>
          <p className="text-slate-600">Преподаватель: {classData?.teacher?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-violet-500" />
            <div>
              <p className="text-2xl font-bold">{classData?.classStudents?.length || 0}</p>
              <p className="text-sm text-slate-500">Учеников</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{classData?.modules?.length || 0}</p>
              <p className="text-sm text-slate-500">Модулей</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{classData?.modules?.reduce((sum: number, m: any) => sum + m.lessons?.length, 0) || 0}</p>
              <p className="text-sm text-slate-500">Уроков</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Students */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              Ученики ({classData?.classStudents?.length || 0})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Импорт
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {classData?.classStudents?.map((cs: any) => (
              <div key={cs.student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                <div>
                  <p className="font-medium text-slate-900">{cs.student.name}</p>
                  <p className="text-sm text-slate-500">Родитель: {cs.student.parent?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cs.student.parent?.parentType === 'CALM' ? 'bg-green-100 text-green-700' :
                    cs.student.parent?.parentType === 'ANXIOUS' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {cs.student.parent?.parentType === 'CALM' ? 'Спокойный' :
                     cs.student.parent?.parentType === 'ANXIOUS' ? 'Тревожный' : 'Требовательный'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Удалить ученика ${cs.student.name}?`)) {
                        deleteStudentMutation.mutate(cs.student.id)
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {(!classData?.classStudents || classData.classStudents.length === 0) && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Нет учеников в классе</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Добавить первого ученика
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            Модули
          </h3>
          <div className="space-y-4">
            {classData?.modules?.map((module: any) => {
              const totalLessons = module.lessons?.length || 0
              const lessonsWithCards = module.lessons?.filter((l: any) => l.cards?.length > 0).length || 0
              const hasReports = (module._count?.osReports || 0) > 0
              const canGenerateOS = totalLessons >= 2 && !hasReports
              const isFullyCompleted = lessonsWithCards >= module.lessonsCount
              
              return (
                <div key={module.id} className={`p-4 rounded-xl border-2 ${
                  canGenerateOS && isFullyCompleted 
                    ? 'border-rose-300 bg-rose-50' 
                    : canGenerateOS 
                    ? 'border-amber-300 bg-amber-50'
                    : hasReports
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{module.title}</p>
                      <p className="text-sm text-slate-500">{totalLessons} уроков</p>
                    </div>
                    
                    {/* Status Badge */}
                    {hasReports ? (
                      <span className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <Check className="w-4 h-4" />
                        ОС готова
                      </span>
                    ) : canGenerateOS && isFullyCompleted ? (
                      <span className="flex items-center gap-1 text-sm text-rose-700 bg-rose-100 px-3 py-1 rounded-full animate-pulse">
                        <Bell className="w-4 h-4" />
                        Готов к ОС!
                      </span>
                    ) : canGenerateOS ? (
                      <span className="flex items-center gap-1 text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                        Можно генерировать
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">
                        {lessonsWithCards}/{module.lessonsCount} заполнено
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          hasReports ? 'bg-green-500' :
                          isFullyCompleted ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(lessonsWithCards / module.lessonsCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {lessonsWithCards}/{module.lessonsCount}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  {totalLessons >= 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/reports/${module.id}`)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                          hasReports
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg'
                        }`}
                      >
                        <Bot className="w-5 h-5" />
                        {hasReports ? 'Просмотреть ОС' : 'Генерировать персональные ОС'}
                      </button>
                    </div>
                  )}
                  
                  {totalLessons < 2 && (
                    <p className="text-sm text-slate-500 text-center">
                      Нужно минимум 2 урока для генерации ОС
                    </p>
                  )}
                </div>
              )
            })}
            {(!classData?.modules || classData.modules.length === 0) && (
              <p className="text-slate-500 text-center py-4">Нет модулей</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Добавить ученика</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ФИО ученика *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Иванов Иван"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Имя родителя *
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Иван Петрович"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Телефон родителя (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Тип родителя
                </label>
                <select
                  value={formData.parentType}
                  onChange={(e) => setFormData({ ...formData, parentType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="CALM">😊 Спокойный</option>
                  <option value="ANXIOUS">😰 Тревожный</option>
                  <option value="DEMANDING">😤 Требовательный</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAddStudent}
                disabled={addStudentMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {addStudentMutation.isPending ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Импорт учеников из HTML</h3>
              <button onClick={() => { setShowImportModal(false); setImportStep(1); setImportedStudents([]) }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-4 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    importStep >= step ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-sm ${importStep >= step ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step === 1 ? 'Загрузка' : step === 2 ? 'Редактирование' : 'Создание'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Upload */}
            {importStep === 1 && (
              <div className="text-center py-8">
                <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-8 mb-4">
                  <Upload className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-700 mb-2">
                    Загрузите HTML файл со страницы «Распечатать учеников» из бэкофиса
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Файл будет проанализирован и из него будут извлечены данные учеников
                  </p>
                  <label className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 cursor-pointer transition-colors">
                    Выбрать HTML файл
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Edit */}
            {importStep === 2 && (
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-amber-800 text-sm">
                    ⚠️ Проверьте и отредактируйте данные. Обязательно заполните имя родителя!
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Фамилия</th>
                        <th className="px-3 py-2 text-left">Имя</th>
                        <th className="px-3 py-2 text-left">Имя родителя</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedStudents.map((student, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={student.lastName}
                              onChange={(e) => {
                                const updated = [...importedStudents]
                                updated[index].lastName = e.target.value
                                setImportedStudents(updated)
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={student.firstName}
                              onChange={(e) => {
                                const updated = [...importedStudents]
                                updated[index].firstName = e.target.value
                                setImportedStudents(updated)
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={student.parentName}
                              onChange={(e) => {
                                const updated = [...importedStudents]
                                updated[index].parentName = e.target.value
                                setImportedStudents(updated)
                              }}
                              placeholder="Имя родителя"
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                setImportedStudents(importedStudents.filter((_, i) => i !== index))
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  Всего учеников: {importedStudents.length}
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setImportStep(1); setImportedStudents([]) }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setImportStep(3)}
                    disabled={importedStudents.length === 0}
                    className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {importStep === 3 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Готово к импорту!
                </h4>
                <p className="text-slate-600 mb-6">
                  Будет добавлено {importedStudents.length} учеников в класс "{classData?.name}"
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setImportStep(2)}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => bulkAddMutation.mutate(importedStudents)}
                    disabled={bulkAddMutation.isPending}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {bulkAddMutation.isPending ? 'Импортирую...' : 'Импортировать учеников'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  )
}
