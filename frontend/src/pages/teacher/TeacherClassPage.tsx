import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { ArrowLeft, Calendar, Users, CheckCircle2, Circle, MessageSquare, Loader2 } from 'lucide-react'

export default function TeacherClassPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: classData, isLoading } = useQuery({
    queryKey: ['teacher-class', id],
    queryFn: async () => (await api.get(`/teachers/me/classes/${id}`)).data,
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </MainLayout>
    )
  }

  const students = classData?.classStudents || []
  const modules = classData?.modules || []

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/teacher')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{classData?.name}</h1>
          <p className="text-slate-600">{students.length} учеников</p>
        </div>
        {classData?.whatsappGroupName && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <MessageSquare className="w-4 h-4" />
            {classData.whatsappGroupName}
          </div>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" />
          Ученики
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((cs: any) => (
            <div key={cs.student.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                {cs.student.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{cs.student.name}</p>
                <p className="text-xs text-slate-500">{cs.student.parent?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="space-y-6">
        {modules.map((module: any) => (
          <div key={module.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
              <h3 className="font-semibold text-lg">{module.title}</h3>
              <p className="text-violet-100 text-sm">{module.lessons?.length || 0} уроков</p>
            </div>
            
            <div className="p-4 space-y-2">
              {module.lessons?.sort((a: any, b: any) => a.lessonNumber - b.lessonNumber).map((lesson: any) => {
                const hasCards = lesson.cards && lesson.cards.length > 0
                const cardsCount = lesson.cards?.length || 0
                const studentsCount = students.length
                const isComplete = cardsCount >= studentsCount
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/teacher/lessons/${lesson.id}`)}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-green-100 text-green-600' : 
                      hasCards ? 'bg-amber-100 text-amber-600' : 
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : 
                       hasCards ? <span className="text-sm font-bold">{cardsCount}</span> :
                       <Circle className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded">
                          Урок {lesson.lessonNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(lesson.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mt-1">{lesson.topic}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-slate-600'}`}>
                        {cardsCount}/{studentsCount}
                      </p>
                      <p className="text-xs text-slate-500">карточек</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  )
}

