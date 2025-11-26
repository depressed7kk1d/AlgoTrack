import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { 
  Send, 
  Plus, 
  X, 
  Image, 
  MessageSquare, 
  Users, 
  Clock, 
  Check,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Radio
} from 'lucide-react'

interface Broadcast {
  id: string
  name: string
  messages: Array<{ text: string; imageUrl?: string }>
  targetType: string
  status: string
  totalRecipients: number
  sentCount: number
  failedCount: number
  scheduledFor?: string
  createdAt: string
}

export default function BroadcastPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null)

  // Форма создания
  const [name, setName] = useState('')
  const [messages, setMessages] = useState<Array<{ text: string; imageUrl: string }>>([{ text: '', imageUrl: '' }])
  const [targetType, setTargetType] = useState<'ALL_GROUPS' | 'SELECTED_GROUPS'>('ALL_GROUPS')
  const [scheduledFor, setScheduledFor] = useState('')

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => (await api.get('/broadcast')).data as Broadcast[],
  })

  const { data: groups } = useQuery({
    queryKey: ['whatsapp-groups'],
    queryFn: async () => (await api.get('/whatsapp/groups')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/broadcast', {
        name,
        messages: messages.filter(m => m.text.trim()),
        targetType,
        scheduledFor: scheduledFor || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
      setShowCreateModal(false)
      resetForm()
    },
  })

  const startMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/broadcast/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/broadcast/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    },
  })

  const resetForm = () => {
    setName('')
    setMessages([{ text: '', imageUrl: '' }])
    setTargetType('ALL_GROUPS')
    setScheduledFor('')
  }

  const addMessageVariant = () => {
    if (messages.length < 5) {
      setMessages([...messages, { text: '', imageUrl: '' }])
    }
  }

  const removeMessageVariant = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index))
    }
  }

  const updateMessage = (index: number, field: 'text' | 'imageUrl', value: string) => {
    const updated = [...messages]
    updated[index][field] = value
    setMessages(updated)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-slate-100 text-slate-700',
      SCHEDULED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      PENDING: 'Ожидает',
      SCHEDULED: 'Запланирована',
      IN_PROGRESS: 'В процессе',
      COMPLETED: 'Завершена',
      CANCELLED: 'Отменена',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Рассылки</h1>
            <p className="text-slate-600">Массовая отправка сообщений в WhatsApp группы</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать рассылку
          </button>
        </div>

        {/* Anti-ban info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-emerald-900 font-medium">Умная система антибана</p>
              <p className="text-emerald-700 text-sm">
                Система автоматически чередует варианты сообщений, добавляет случайные задержки между отправками 
                и соблюдает лимиты WhatsApp. Рекомендуем создавать 2-3 варианта сообщения.
              </p>
            </div>
          </div>
        </div>

        {/* Broadcasts List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {broadcasts && broadcasts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Send className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{broadcast.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{broadcast.messages.length} вариант(ов)</span>
                          <span>•</span>
                          <span>
                            {broadcast.sentCount}/{broadcast.totalRecipients} отправлено
                            {broadcast.failedCount > 0 && (
                              <span className="text-red-500 ml-1">({broadcast.failedCount} ошибок)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(broadcast.status)}
                      
                      {broadcast.status === 'PENDING' && (
                        <button
                          onClick={() => startMutation.mutate(broadcast.id)}
                          disabled={startMutation.isPending}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Запустить"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      
                      {(broadcast.status === 'PENDING' || broadcast.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => cancelMutation.mutate(broadcast.id)}
                          disabled={cancelMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Отменить"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {broadcast.status === 'IN_PROGRESS' && broadcast.totalRecipients > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${(broadcast.sentCount / broadcast.totalRecipients) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Нет рассылок</p>
              <p className="text-slate-400 text-sm">Создайте первую рассылку для отправки сообщений</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Создать рассылку</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Название рассылки
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Напр: Анонс нового курса"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Варианты сообщений */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Варианты сообщений (для антибана)
                  </label>
                  {messages.length < 5 && (
                    <button
                      onClick={addMessageVariant}
                      className="text-sm text-violet-600 hover:text-violet-700"
                    >
                      + Добавить вариант
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Вариант {index + 1}</span>
                        {messages.length > 1 && (
                          <button
                            onClick={() => removeMessageVariant(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <textarea
                        value={msg.text}
                        onChange={(e) => updateMessage(index, 'text', e.target.value)}
                        placeholder="Текст сообщения..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 mb-2"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={msg.imageUrl}
                          onChange={(e) => updateMessage(index, 'imageUrl', e.target.value)}
                          placeholder="URL изображения (опционально)"
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Кому отправить */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Кому отправить
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTargetType('ALL_GROUPS')}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      targetType === 'ALL_GROUPS'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className={`w-5 h-5 mb-2 ${targetType === 'ALL_GROUPS' ? 'text-violet-600' : 'text-slate-400'}`} />
                    <p className="font-medium text-slate-900">Все группы</p>
                    <p className="text-sm text-slate-500">{groups?.length || 0} групп</p>
                  </button>
                  
                  <button
                    onClick={() => setTargetType('SELECTED_GROUPS')}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      targetType === 'SELECTED_GROUPS'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 mb-2 ${targetType === 'SELECTED_GROUPS' ? 'text-violet-600' : 'text-slate-400'}`} />
                    <p className="font-medium text-slate-900">Выбранные группы</p>
                    <p className="text-sm text-slate-500">Выбрать вручную</p>
                  </button>
                </div>
              </div>

              {/* Когда отправить */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Когда отправить
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Оставьте пустым для ручного запуска
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !name || !messages.some(m => m.text.trim())}
                className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

