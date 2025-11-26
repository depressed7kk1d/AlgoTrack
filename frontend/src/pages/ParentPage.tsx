import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Star,
  Target,
  Zap,
  Heart
} from 'lucide-react'

interface ParentData {
  student: {
    id: string
    name: string
    avatar?: string
  }
  parent: {
    name: string
  }
  class: {
    name: string
    teacher: { name: string }
  }
  modules: Array<{
    id: string
    title: string
    lessonsCount: number
    lessons: Array<{
      id: string
      lessonNumber: number
      topic: string
      date: string
      card?: {
        taskCompletedCount: number
        totalTasks: number
        activity: string
        mood: string
      }
    }>
    report?: {
      reportText: string
      avgCompletion: number
      status: string
      createdAt: string
    }
  }>
  overallProgress: number
  totalLessons: number
  completedLessons: number
}

export default function ParentPage() {
  const { token } = useParams()

  const { data, isLoading, error } = useQuery<ParentData>({
    queryKey: ['parent-page', token],
    queryFn: async () => {
      const response = await api.get(`/parent/${token}`)
      return response.data
    },
    enabled: !!token,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ссылка недействительна</h2>
          <p className="text-slate-600">
            К сожалению, эта ссылка недействительна или срок её действия истёк. 
            Обратитесь к администратору школы.
          </p>
        </div>
      </div>
    )
  }

  const getActivityEmoji = (activity: string) => {
    switch (activity) {
      case 'HIGH': return '🔥'
      case 'MEDIUM': return '👍'
      case 'LOW': return '😴'
      default: return '—'
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'POSITIVE': return '😊'
      case 'NEUTRAL': return '😐'
      case 'NEGATIVE': return '😢'
      default: return '—'
    }
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'from-emerald-500 to-green-500'
    if (percent >= 50) return 'from-amber-500 to-yellow-500'
    return 'from-rose-500 to-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl font-bold">
              {data.student.name.charAt(0)}
            </div>
            <div>
              <p className="text-violet-200 text-sm mb-1">Прогресс ученика</p>
              <h1 className="text-3xl font-bold mb-2">{data.student.name}</h1>
              <div className="flex items-center gap-4 text-sm text-violet-100">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {data.class.name}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {data.class.teacher.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${getProgressColor(data.overallProgress)} flex items-center justify-center text-white text-2xl font-bold`}>
              {Math.round(data.overallProgress)}%
            </div>
            <p className="text-sm text-slate-600 mt-2">Общий прогресс</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 mt-2">
              <span className="font-bold text-slate-900">{data.completedLessons}</span> из {data.totalLessons} уроков
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 mt-2">
              <span className="font-bold text-slate-900">{data.modules.length}</span> модулей
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {data.modules.map((module) => {
          const completedLessons = module.lessons.filter(l => l.card).length
          const moduleProgress = module.lessons.length > 0
            ? module.lessons.reduce((sum, l) => {
                if (!l.card) return sum
                return sum + (l.card.taskCompletedCount / l.card.totalTasks) * 100
              }, 0) / completedLessons || 0
            : 0

          return (
            <div key={module.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Module Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm mb-1">Модуль</p>
                    <h2 className="text-xl font-bold">{module.title}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{Math.round(moduleProgress)}%</p>
                    <p className="text-sm text-slate-300">{completedLessons}/{module.lessonsCount} уроков</p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getProgressColor(moduleProgress)} rounded-full transition-all duration-500`}
                    style={{ width: `${moduleProgress}%` }}
                  />
                </div>
              </div>

              {/* Lessons */}
              <div className="p-6">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-500" />
                  История уроков
                </h3>
                <div className="space-y-3">
                  {module.lessons.map((lesson) => {
                    const completion = lesson.card 
                      ? Math.round((lesson.card.taskCompletedCount / lesson.card.totalTasks) * 100)
                      : null

                    return (
                      <div key={lesson.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          completion === null ? 'bg-slate-200 text-slate-400' :
                          completion >= 80 ? 'bg-emerald-100 text-emerald-600' :
                          completion >= 50 ? 'bg-amber-100 text-amber-600' :
                          'bg-rose-100 text-rose-600'
                        }`}>
                          {completion === null ? (
                            <span className="text-sm font-medium">#{lesson.lessonNumber}</span>
                          ) : (
                            <span className="text-lg font-bold">{completion}%</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{lesson.topic}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(lesson.date).toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        {lesson.card && (
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-2xl">{getActivityEmoji(lesson.card.activity)}</p>
                              <p className="text-xs text-slate-500">Активность</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl">{getMoodEmoji(lesson.card.mood)}</p>
                              <p className="text-xs text-slate-500">Настроение</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Module Report */}
              {module.report && (
                <div className="border-t border-slate-200 p-6 bg-gradient-to-r from-violet-50 to-purple-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Персональный отчёт по модулю</h3>
                      <p className="text-sm text-slate-500">
                        Сгенерировано {new Date(module.report.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                        {module.report.reportText}
                      </div>
                    </div>
                    
                    {/* Recommendations based on progress */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Рекомендации
                      </h4>
                      <div className="space-y-2">
                        {module.report.avgCompletion < 80 && (
                          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <p>Рекомендуем уделить больше времени повторению материала и выполнению дополнительных заданий.</p>
                          </div>
                        )}
                        {module.report.avgCompletion >= 90 && (
                          <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 mt-0.5" />
                            <p>Отличные результаты! Рекомендуем перевод на более сложный трек обучения.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <Heart className="w-4 h-4 text-rose-400" />
            Алгоритмика — Международная школа программирования
          </div>
        </div>
      </div>
    </div>
  )
}
