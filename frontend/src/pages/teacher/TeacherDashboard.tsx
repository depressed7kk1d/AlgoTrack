import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BookOpen, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react'

interface Class {
  id: string
  name: string
  whatsappGroupName?: string
  _count: { classStudents: number; modules: number; lessons: number }
  modules: Array<{
    id: string
    title: string
    lessons: Array<{ id: string; topic: string; date: string; lessonNumber: number }>
  }>
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['teacher-classes'],
    queryFn: async () => (await api.get('/teachers/me/classes')).data,
  })

  if (isLoading) {
    return (
      <MainLayout title="Мои классы">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Мои классы">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Привет, {user?.name}! 👋</h2>
        <p className="text-slate-600">Выберите класс для заполнения карточек учеников</p>
      </div>

      {classes?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">У вас пока нет классов</p>
          <p className="text-sm text-slate-400">Обратитесь к администратору для назначения</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls) => {
            // Find latest/next lesson
            const allLessons = cls.modules.flatMap(m => m.lessons)
            const now = new Date()
            const nextLesson = allLessons
              .filter(l => new Date(l.date) >= now)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                </div>

                <h3 className="font-semibold text-lg text-slate-900 mb-2">{cls.name}</h3>

                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {cls._count.classStudents} уч.
                  </span>
                  <span>{cls._count.lessons} урок.</span>
                </div>

                {nextLesson && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Следующий урок:</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-500" />
                      <span className="text-sm text-slate-700">
                        {new Date(nextLesson.date).toLocaleDateString('ru-RU')} — {nextLesson.topic}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </MainLayout>
  )
}

