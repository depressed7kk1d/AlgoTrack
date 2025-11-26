import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { 
  MessageSquare, 
  QrCode, 
  Check, 
  RefreshCw, 
  Loader2,
  Settings,
  LogOut,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react'

export default function AdminWhatsAppSettings() {
  const queryClient = useQueryClient()
  
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Получить настройки
  const { data: settings, isLoading } = useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => (await api.get('/whatsapp/settings')).data,
  })

  // Получить статус
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => (await api.get('/whatsapp/status')).data,
    enabled: !!settings?.hasCredentials,
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (settings) {
      setIdInstance(settings.idInstance || '')
    }
  }, [settings])

  // Сохранить настройки
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: any = { idInstance }
      if (apiTokenInstance) {
        data.apiTokenInstance = apiTokenInstance
      }
      return api.patch('/whatsapp/settings', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
      setSaved(true)
      setApiTokenInstance('')
      setTimeout(() => setSaved(false), 3000)
    },
  })

  // Получить QR-код
  const qrMutation = useMutation({
    mutationFn: async () => (await api.get('/whatsapp/qr')).data,
    onSuccess: (data) => {
      if (data.type === 'qrCode') {
        setQrCode(data.qrCode)
      } else if (data.type === 'alreadyLogged') {
        setQrCode(null)
        refetchStatus()
      }
    },
  })

  // Выйти
  const logoutMutation = useMutation({
    mutationFn: async () => (await api.post('/whatsapp/logout')).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
      setQrCode(null)
    },
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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp для вашей школы</h1>
          <p className="text-slate-600">
            Настройте интеграцию с WhatsApp для отправки ОС родителям
          </p>
        </div>

        {/* Info Banner */}
        {!settings?.isOwnSettings && settings?.hasCredentials && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-900 font-medium">Используются глобальные настройки</p>
                <p className="text-blue-700 text-sm">
                  Сейчас ваша школа использует общий WhatsApp бот. Вы можете настроить свой собственный.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className={`rounded-xl p-6 mb-6 ${
          status?.authorized 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {status?.authorized ? 'WhatsApp подключён' : 'WhatsApp не авторизован'}
                </h2>
                <p className="text-sm opacity-90">
                  {status?.stateInstance || 'Настройте интеграцию'}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetchStatus()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Credentials */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Учётные данные GREEN-API</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ID Instance
                </label>
                <input
                  type="text"
                  value={idInstance}
                  onChange={(e) => setIdInstance(e.target.value)}
                  placeholder="1103394810"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API Token Instance
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={apiTokenInstance}
                    onChange={(e) => setApiTokenInstance(e.target.value)}
                    placeholder={settings?.hasCredentials ? '***токен сохранён***' : 'Введите токен'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    {showToken ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : saved ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Сохранено
                  </span>
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Авторизация WhatsApp</h3>
            </div>

            {!settings?.hasCredentials ? (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Сначала сохраните учётные данные GREEN-API</p>
              </div>
            ) : status?.authorized ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-600 font-medium mb-4">WhatsApp авторизован</p>
                <button
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 mx-auto"
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Выйти из WhatsApp
                </button>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="mx-auto mb-4 rounded-lg border border-slate-200"
                  style={{ width: 200, height: 200 }}
                />
                <p className="text-sm text-slate-600 mb-2">
                  Отсканируйте QR-код в WhatsApp
                </p>
                <button
                  onClick={() => qrMutation.mutate()}
                  className="mt-4 flex items-center justify-center gap-2 text-violet-600 hover:text-violet-700 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Обновить QR-код
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-slate-600 mb-4">Необходима авторизация</p>
                <button
                  onClick={() => qrMutation.mutate()}
                  disabled={qrMutation.isPending}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 mx-auto"
                >
                  {qrMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <QrCode className="w-5 h-5" />
                  )}
                  Получить QR-код
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h4 className="font-medium text-emerald-900 mb-2">📱 Как настроить свой WhatsApp бот:</h4>
          <ol className="text-sm text-emerald-800 space-y-2 list-decimal list-inside">
            <li>Зарегистрируйтесь на <a href="https://green-api.com" target="_blank" rel="noopener" className="underline font-medium">green-api.com</a></li>
            <li>Создайте новый инстанс и получите <strong>idInstance</strong> и <strong>apiTokenInstance</strong></li>
            <li>Вставьте данные в форму и сохраните</li>
            <li>Нажмите "Получить QR-код" и отсканируйте его в WhatsApp</li>
            <li>Готово! Теперь учителя вашей школы смогут отправлять ОС в WhatsApp</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  )
}

