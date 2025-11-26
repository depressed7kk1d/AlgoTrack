import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { 
  X, 
  Send, 
  Clock, 
  MessageSquare, 
  Calendar, 
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react'

interface SendOsModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  lessonId?: string
}

interface WhatsAppGroup {
  id: string
  name: string
}

export default function SendOsModal({ isOpen, onClose, message, lessonId }: SendOsModalProps) {
  const queryClient = useQueryClient()
  
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null)
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [sent, setSent] = useState(false)

  // Получить список групп
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useQuery({
    queryKey: ['whatsapp-groups'],
    queryFn: async () => (await api.get('/whatsapp/groups')).data as WhatsAppGroup[],
    enabled: isOpen,
  })

  // Получить статус WhatsApp
  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => (await api.get('/whatsapp/status')).data,
    enabled: isOpen,
  })

  // Отправить сейчас
  const sendNowMutation = useMutation({
    mutationFn: async () => {
      return api.post('/scheduled-messages/send-now', {
        chatId: selectedGroup?.id,
        message,
        lessonId,
      })
    },
    onSuccess: () => {
      setSent(true)
      setTimeout(() => {
        onClose()
        setSent(false)
      }, 2000)
    },
  })

  // Запланировать
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      return api.post('/scheduled-messages', {
        chatId: selectedGroup?.id,
        chatName: selectedGroup?.name,
        message,
        scheduledFor,
        lessonId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] })
      setSent(true)
      setTimeout(() => {
        onClose()
        setSent(false)
      }, 2000)
    },
  })

  // Установить дефолтную дату (завтра)
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduledDate(tomorrow.toISOString().split('T')[0])
      setScheduledTime('10:00')
    }
  }, [isOpen])

  // Получить максимальную дату (4 дня вперёд)
  const getMaxDate = () => {
    const max = new Date()
    max.setDate(max.getDate() + 4)
    return max.toISOString().split('T')[0]
  }

  const handleSend = () => {
    if (sendMode === 'now') {
      sendNowMutation.mutate()
    } else {
      scheduleMutation.mutate()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Отправить ОС в WhatsApp</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* WhatsApp Status */}
          {!whatsappStatus?.authorized && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-medium">WhatsApp не авторизован</p>
                <p className="text-amber-700 text-sm">
                  Попросите администратора настроить WhatsApp интеграцию
                </p>
              </div>
            </div>
          )}

          {/* Select Group */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Выберите группу
            </label>
            {groupsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              </div>
            ) : groupsError ? (
              <p className="text-red-500 text-sm py-2">Ошибка загрузки групп</p>
            ) : groups && groups.length > 0 ? (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-violet-50 text-violet-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium">{group.name}</span>
                    {selectedGroup?.id === group.id && (
                      <Check className="w-4 h-4 float-right mt-1 text-violet-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">
                Нет доступных групп
              </p>
            )}
          </div>

          {/* Send Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Когда отправить?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSendMode('now')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
                  sendMode === 'now'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Send className="w-4 h-4" />
                Сейчас
              </button>
              <button
                onClick={() => setSendMode('scheduled')}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
                  sendMode === 'scheduled'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Запланировать
              </button>
            </div>
          </div>

          {/* Scheduled Date/Time */}
          {sendMode === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Дата
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={getMaxDate()}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Время
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Сообщение
            </label>
            <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
              {message.substring(0, 500)}{message.length > 500 && '...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={
              !selectedGroup || 
              !whatsappStatus?.authorized || 
              sendNowMutation.isPending || 
              scheduleMutation.isPending
            }
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
              sent
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {sendNowMutation.isPending || scheduleMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : sent ? (
              <>
                <Check className="w-5 h-5" />
                {sendMode === 'now' ? 'Отправлено!' : 'Запланировано!'}
              </>
            ) : (
              <>
                {sendMode === 'now' ? <Send className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                {sendMode === 'now' ? 'Отправить' : 'Запланировать'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

