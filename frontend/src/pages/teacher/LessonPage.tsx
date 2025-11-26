import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import MainLayout from '../../components/layout/MainLayout'
import { ArrowLeft, Save, Send, Copy, Check, Loader2, Bot, MessageSquare, Calendar } from 'lucide-react'

interface StudentCard {
  studentId: string
  studentName: string
  taskCompletedCount: number
  totalTasks: number
  activity: 'HIGH' | 'MEDIUM' | 'LOW'
  mood: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  homework?: string
  notes?: string
  cardId?: string
}

export default function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const [cards, setCards] = useState<StudentCard[]>([])
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState('')
  const [nextLessonDate, setNextLessonDate] = useState('')
  const [teacherName, setTeacherName] = useState(user?.name || '')
  const [lessonTopics, setLessonTopics] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Автозаполнение имени учителя при загрузке
  useEffect(() => {
    if (user?.name && !teacherName) {
      setTeacherName(user.name)
    }
  }, [user?.name])

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const response = await api.get(`/lessons/${lessonId}`)
      return response.data
    },
    enabled: !!lessonId,
  })

  const { data: classData } = useQuery({
    queryKey: ['lesson-class', lesson?.module?.classId],
    queryFn: async () => {
      const response = await api.get(`/teachers/me/classes/${lesson.module.classId}`)
      return response.data
    },
    enabled: !!lesson?.module?.classId,
  })

  // Initialize cards when classData loads
  const students = classData?.classStudents || []
  if (cards.length === 0 && students.length > 0 && lesson) {
    const existingCards = lesson.cards || []
    const initialCards = students.map((cs: any) => {
      const existing = existingCards.find((c: any) => c.studentId === cs.student.id)
      return {
        studentId: cs.student.id,
        studentName: cs.student.name,
        taskCompletedCount: existing?.taskCompletedCount || 0,
        totalTasks: existing?.totalTasks || 10,
        activity: existing?.activity || 'MEDIUM',
        mood: existing?.mood || 'NEUTRAL',
        homework: existing?.homework || '',
        notes: existing?.notes || '',
        cardId: existing?.id,
      }
    })
    setCards(initialCards)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = cards.map(card => {
        const data = {
          lessonId,
          studentId: card.studentId,
          taskCompletedCount: card.taskCompletedCount,
          totalTasks: card.totalTasks,
          activity: card.activity,
          mood: card.mood,
          homework: card.homework,
          notes: card.notes,
        }
        if (card.cardId) {
          return api.patch(`/cards/${card.cardId}`, data)
        }
        return api.post('/cards', data)
      })
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
    },
  })

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/messages/generate-summary', {
        lessonId,
        useAI: true,
        nextLessonDate,
        teacherName,
        lessonTopics,
      })
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedSummary(data.message || data.summary)
    },
  })

  const sendToWhatsAppMutation = useMutation({
    mutationFn: async () => {
      await api.post('/messages/send', {
        chatId: classData?.whatsappGroupId,
        message: generatedSummary,
      })
    },
  })

  const updateCard = (studentId: string, updates: Partial<StudentCard>) => {
    setCards(prev => prev.map(c => c.studentId === studentId ? { ...c, ...updates } : c))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSummary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div></MainLayout>
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded">Урок {lesson?.lessonNumber}</span>
              <Calendar className="w-4 h-4" />
              {new Date(lesson?.date).toLocaleDateString('ru-RU')}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{lesson?.topic}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Сохранить
          </button>
          <button
            onClick={() => setShowSummaryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg"
          >
            <MessageSquare className="w-5 h-5" />
            Сгенерировать сводку
          </button>
        </div>
      </div>

      {/* Lesson Description */}
      {lesson?.description && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-violet-700">{lesson.description}</p>
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-4">
        {cards.map((card) => (
          <div key={card.studentId} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {card.studentName.charAt(0)}
                </div>
                <h3 className="font-semibold text-lg text-slate-900">{card.studentName}</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-violet-600">
                  {card.totalTasks > 0 ? Math.round((card.taskCompletedCount / card.totalTasks) * 100) : 0}%
                </span>
                <p className="text-xs text-slate-500">выполнено</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tasks */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Задания</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={card.taskCompletedCount}
                    onChange={(e) => updateCard(card.studentId, { taskCompletedCount: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center"
                  />
                  <span className="text-slate-500">из</span>
                  <input
                    type="number"
                    min="1"
                    value={card.totalTasks}
                    onChange={(e) => updateCard(card.studentId, { totalTasks: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center"
                  />
                </div>
              </div>

              {/* Activity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Активность</label>
                <div className="flex gap-1">
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateCard(card.studentId, { activity: level })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        card.activity === level
                          ? level === 'HIGH' ? 'bg-green-500 text-white' :
                            level === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'HIGH' ? '🔥' : level === 'MEDIUM' ? '👍' : '😴'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Настроение</label>
                <div className="flex gap-1">
                  {(['POSITIVE', 'NEUTRAL', 'NEGATIVE'] as const).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => updateCard(card.studentId, { mood })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        card.mood === mood
                          ? mood === 'POSITIVE' ? 'bg-green-500 text-white' :
                            mood === 'NEUTRAL' ? 'bg-slate-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mood === 'POSITIVE' ? '😊' : mood === 'NEUTRAL' ? '😐' : '😢'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Homework */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ДЗ</label>
                <input
                  type="text"
                  value={card.homework || ''}
                  onChange={(e) => updateCard(card.studentId, { homework: e.target.value })}
                  placeholder="Домашнее задание..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Заметки</label>
              <textarea
                value={card.notes || ''}
                onChange={(e) => updateCard(card.studentId, { notes: e.target.value })}
                placeholder="Заметки об ученике..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Сгенерировать сводку для родителей</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ваше имя
                  {user?.name && <span className="text-slate-400 text-xs font-normal ml-2">(можно изменить)</span>}
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Дата следующего урока</label>
                <input
                  type="date"
                  value={nextLessonDate}
                  onChange={(e) => setNextLessonDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Что проходили на уроке (скопируйте из методички)
                </label>
                <textarea
                  value={lessonTopics}
                  onChange={(e) => setLessonTopics(e.target.value)}
                  placeholder="Узнали, что такое пиксель...&#10;Научились создавать пиксельные буквы..."
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <button
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending || !teacherName || !nextLessonDate || !lessonTopics}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {generateSummaryMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                Сгенерировать с AI
              </button>

              {generatedSummary && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Результат:</label>
                  <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {generatedSummary}
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Скопировано!' : 'Копировать'}
                    </button>
                    
                    {classData?.whatsappGroupId && (
                      <button
                        onClick={() => sendToWhatsAppMutation.mutate()}
                        disabled={sendToWhatsAppMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {sendToWhatsAppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Отправить в WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowSummaryModal(false)
                  setGeneratedSummary('')
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

