import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import StudentCard from '../components/StudentCard'
import { ArrowLeft, Send, Bot, Copy, Check, X, Loader2, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Student {
  id: string
  name: string
  avatar?: string
  progress: number
  cardsCount: number
  latestCard?: any
  parent: {
    name: string
    parentType: string
  }
}

interface Lesson {
  id: string
  topic: string
  date: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export default function ClassPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<string>('')
  const [useAI, setUseAI] = useState(true)
  const [nextLessonDate, setNextLessonDate] = useState('')
  const [generatedSummary, setGeneratedSummary] = useState('')
  const [whatsappChatId, setWhatsappChatId] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: async () => {
      const response = await api.get(`/classes/${id}`)
      return response.data
    },
  })

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['class-students', id],
    queryFn: async () => {
      const response = await api.get(`/classes/${id}/students`)
      return response.data
    },
    enabled: !!id,
  })

  // Generate Summary Mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { lessonId: string; useAI: boolean; nextLessonDate?: string }) => {
      const response = await api.post('/messages/generate-summary', data)
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedSummary(data.summary)
    },
  })

  // Send WhatsApp Mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { lessonId: string; chatId: string }) => {
      const response = await api.post('/messages/send', data)
      return response.data
    },
    onSuccess: () => {
      setShowSendModal(false)
      setWhatsappChatId('')
    },
  })

  const handleGenerate = () => {
    if (!selectedLesson) return
    generateMutation.mutate({
      lessonId: selectedLesson,
      useAI,
      nextLessonDate: nextLessonDate || undefined,
    })
  }

  const handleSend = () => {
    if (!selectedLesson || !whatsappChatId) return
    sendMutation.mutate({
      lessonId: selectedLesson,
      chatId: whatsappChatId,
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedSummary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLessons = (): Lesson[] => {
    if (!classData?.modules) return []
    return classData.modules.flatMap((m: Module) => m.lessons || [])
  }

  if (classLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-purple-600">
                {classData?.name || 'Класс'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                Сгенерировать сводку
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ученики</h2>
          <p className="text-gray-600">
            Нажмите на карточку ученика, чтобы заполнить или просмотреть карточку урока
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students?.map((student) => (
            <StudentCard key={student.id} student={student} classId={id!} />
          ))}
        </div>
      </main>

      {/* Generate Summary Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                Генерация сводки
              </h2>
              <button
                onClick={() => {
                  setShowGenerateModal(false)
                  setGeneratedSummary('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lesson Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Выберите урок
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="input"
                >
                  <option value="">Выберите урок...</option>
                  {getLessons().map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.topic} ({new Date(lesson.date).toLocaleDateString('ru-RU')})
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Использовать AI</h3>
                  <p className="text-sm text-gray-500">
                    Генерировать текст с помощью нейросети
                  </p>
                </div>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useAI ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAI ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Next Lesson Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата следующего урока
                </label>
                <input
                  type="text"
                  value={nextLessonDate}
                  onChange={(e) => setNextLessonDate(e.target.value)}
                  placeholder="Например: 15 ноября в 18:00"
                  className="input"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedLesson || generateMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Сгенерировать
                  </>
                )}
              </button>

              {/* Generated Summary */}
              {generatedSummary && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Результат:</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button
                        onClick={() => setShowSendModal(true)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Отправить
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {generatedSummary}
                  </div>
                  {generateMutation.data?.generatedBy && (
                    <p className="text-xs text-gray-500 mt-2">
                      Сгенерировано: {generateMutation.data.generatedBy === 'AI' 
                        ? `AI (${generateMutation.data.provider})` 
                        : 'Шаблон'}
                    </p>
                  )}
                </div>
              )}

              {generateMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  Ошибка генерации. Проверьте настройки AI.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send WhatsApp Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Отправить в WhatsApp
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID группы WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsappChatId}
                  onChange={(e) => setWhatsappChatId(e.target.value)}
                  placeholder="Например: 79991234567-1234567890"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Формат для групп: ID@g.us
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSend}
                  disabled={!whatsappChatId || sendMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Отправить
                </button>
              </div>

              {sendMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Сообщение добавлено в очередь отправки!
                </div>
              )}

              {sendMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  Ошибка отправки. Проверьте настройки WhatsApp.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
