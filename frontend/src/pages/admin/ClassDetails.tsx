import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { ArrowLeft, Users, BookOpen, FileText, Bell, Calendar, Loader2, Bot, Check, AlertCircle } from 'lucide-react'

export default function ClassDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: classData, isLoading } = useQuery({
    queryKey: ['admin-class', id],
    queryFn: async () => (await api.get(`/admin/classes/${id}`)).data,
    enabled: !!id,
  })

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
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            Ученики
          </h3>
          <div className="space-y-3">
            {classData?.classStudents?.map((cs: any) => (
              <div key={cs.student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{cs.student.name}</p>
                  <p className="text-sm text-slate-500">Родитель: {cs.student.parent?.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cs.student.parent?.parentType === 'CALM' ? 'bg-green-100 text-green-700' :
                  cs.student.parent?.parentType === 'ANXIOUS' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {cs.student.parent?.parentType === 'CALM' ? 'Спокойный' :
                   cs.student.parent?.parentType === 'ANXIOUS' ? 'Тревожный' : 'Требовательный'}
                </span>
              </div>
            ))}
            {(!classData?.classStudents || classData.classStudents.length === 0) && (
              <p className="text-slate-500 text-center py-4">Нет учеников</p>
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
    </MainLayout>
  )
}
