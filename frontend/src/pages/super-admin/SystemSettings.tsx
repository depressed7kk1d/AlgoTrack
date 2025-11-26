import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { 
  Bot, 
  MessageCircle, 
  Shield, 
  Save, 
  TestTube, 
  Check, 
  X, 
  Loader2, 
  Info,
  Clock
} from 'lucide-react'

interface AISettings {
  provider: 'GIGACHAT' | 'OPENAI' | 'DEEPSEEK' | 'YANDEXGPT'
  isEnabled: boolean
  gigachatAuthKey: string | null
  gigachatScope: string
  gigachatModel: string | null
  openaiApiKey: string | null
  openaiModel: string | null
  deepseekApiKey: string | null
  deepseekModel: string | null
  yandexApiKey: string | null
  yandexFolderId: string | null
  yandexModel: string | null
  temperature: number
  maxTokens: number
}

interface AIProvider {
  id: string
  name: string
  description: string
  howToGet: string
  pricing: string
  models: { id: string; name: string; description: string }[]
}

export default function SystemSettings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'ai' | 'whatsapp' | 'antiban'>('ai')

  // AI State
  const [aiProvider, setAiProvider] = useState<string>('GIGACHAT')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [gigachatKey, setGigachatKey] = useState('')
  const [gigachatScope, setGigachatScope] = useState('GIGACHAT_API_PERS')
  const [gigachatModel, setGigachatModel] = useState('GigaChat-2')
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo')
  const [deepseekKey, setDeepseekKey] = useState('')
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat')
  const [yandexKey, setYandexKey] = useState('')
  const [yandexFolderId, setYandexFolderId] = useState('')
  const [yandexModel, setYandexModel] = useState('yandexgpt-lite')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1500)

  // WhatsApp State
  const [waEnabled, setWaEnabled] = useState(false)
  const [greenApiId, setGreenApiId] = useState('')
  const [greenApiToken, setGreenApiToken] = useState('')

  // Test Results
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Queries
  const { data: aiSettings } = useQuery<AISettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await api.get('/ai/settings')
      return response.data
    },
  })

  const { data: providers } = useQuery<AIProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const response = await api.get('/ai/providers')
      return response.data
    },
  })

  const { data: waSettings } = useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/whatsapp')
      return response.data
    },
  })

  // Load settings
  useEffect(() => {
    if (aiSettings) {
      setAiProvider(aiSettings.provider)
      setAiEnabled(aiSettings.isEnabled)
      setTemperature(aiSettings.temperature)
      setMaxTokens(aiSettings.maxTokens)
      if (aiSettings.gigachatScope) setGigachatScope(aiSettings.gigachatScope)
      if (aiSettings.gigachatModel) setGigachatModel(aiSettings.gigachatModel)
      if (aiSettings.openaiModel) setOpenaiModel(aiSettings.openaiModel)
      if (aiSettings.deepseekModel) setDeepseekModel(aiSettings.deepseekModel)
      if (aiSettings.yandexModel) setYandexModel(aiSettings.yandexModel)
    }
  }, [aiSettings])

  useEffect(() => {
    if (waSettings) {
      setWaEnabled(waSettings.isEnabled)
    }
  }, [waSettings])

  // Mutations
  const updateAiMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/ai/settings', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
    },
  })

  const testAiMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/test')
      return response.data
    },
    onSuccess: (data) => setAiTestResult(data),
    onError: (error: any) => setAiTestResult({ success: false, message: error.response?.data?.message || 'Ошибка' }),
  })

  const updateWaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/settings/whatsapp', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] })
    },
  })

  const testWaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/whatsapp/test')
      return response.data
    },
    onSuccess: (data) => setWaTestResult(data),
    onError: (error: any) => setWaTestResult({ success: false, message: error.response?.data?.message || 'Ошибка' }),
  })

  const handleSaveAi = () => {
    const data: any = {
      provider: aiProvider,
      isEnabled: aiEnabled,
      temperature,
      maxTokens,
    }

    switch (aiProvider) {
      case 'GIGACHAT':
        if (gigachatKey && !gigachatKey.includes('***')) data.gigachatAuthKey = gigachatKey
        data.gigachatScope = gigachatScope
        data.gigachatModel = gigachatModel
        break
      case 'OPENAI':
        if (openaiKey && !openaiKey.includes('***')) data.openaiApiKey = openaiKey
        data.openaiModel = openaiModel
        break
      case 'DEEPSEEK':
        if (deepseekKey && !deepseekKey.includes('***')) data.deepseekApiKey = deepseekKey
        data.deepseekModel = deepseekModel
        break
      case 'YANDEXGPT':
        if (yandexKey && !yandexKey.includes('***')) data.yandexApiKey = yandexKey
        if (yandexFolderId && !yandexFolderId.includes('***')) data.yandexFolderId = yandexFolderId
        data.yandexModel = yandexModel
        break
    }

    updateAiMutation.mutate(data)
    setAiTestResult(null)
  }

  const handleSaveWa = () => {
    const data: any = { isEnabled: waEnabled }
    if (greenApiId && !greenApiId.includes('***')) data.greenApiId = greenApiId
    if (greenApiToken && !greenApiToken.includes('***')) data.greenApiToken = greenApiToken
    updateWaMutation.mutate(data)
    setWaTestResult(null)
  }

  const currentProvider = providers?.find(p => p.id === aiProvider)

  const tabs = [
    { id: 'ai', label: 'AI Нейросети', icon: Bot },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'antiban', label: 'Антибан', icon: Shield },
  ]

  return (
    <MainLayout title="Настройки системы">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Settings */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Настройки AI</h3>
              <p className="text-slate-600 text-sm">Выберите провайдера нейросети для генерации отчётов</p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiEnabled ? 'bg-violet-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {providers?.map((p) => (
              <button
                key={p.id}
                onClick={() => setAiProvider(p.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  aiProvider === p.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">
                  {p.id === 'GIGACHAT' && '🤖'}
                  {p.id === 'OPENAI' && '🧠'}
                  {p.id === 'DEEPSEEK' && '🔍'}
                  {p.id === 'YANDEXGPT' && '🅨'}
                </span>
                <p className="font-medium text-sm mt-2">{p.name}</p>
              </button>
            ))}
          </div>

          {/* Provider Info */}
          {currentProvider && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Как получить ключ:</p>
                  <p className="text-blue-700">{currentProvider.howToGet}</p>
                  <p className="text-blue-600 mt-1">💰 {currentProvider.pricing}</p>
                </div>
              </div>
            </div>
          )}

          {/* Provider-specific settings */}
          <div className="space-y-4 mb-6">
            {aiProvider === 'GIGACHAT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Authorization Key (Base64)</label>
                  <input
                    type="password"
                    value={gigachatKey}
                    onChange={(e) => setGigachatKey(e.target.value)}
                    placeholder={aiSettings?.gigachatAuthKey || 'Введите ключ...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scope</label>
                    <select value={gigachatScope} onChange={(e) => setGigachatScope(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="GIGACHAT_API_PERS">Физические лица</option>
                      <option value="GIGACHAT_API_B2B">ИП/Юр. лица (пакеты)</option>
                      <option value="GIGACHAT_API_CORP">ИП/Юр. лица (pay-as-you-go)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Модель</label>
                    <select value={gigachatModel} onChange={(e) => setGigachatModel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="GigaChat-2">GigaChat 2</option>
                      <option value="GigaChat-2-Pro">GigaChat 2 Pro</option>
                      <option value="GigaChat-2-Max">GigaChat 2 Max</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {aiProvider === 'OPENAI' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={aiSettings?.openaiApiKey || 'sk-...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Модель</label>
                  <select value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </div>
              </>
            )}

            {aiProvider === 'DEEPSEEK' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder={aiSettings?.deepseekApiKey || 'Введите ключ...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Модель</label>
                  <select value={deepseekModel} onChange={(e) => setDeepseekModel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="deepseek-chat">DeepSeek Chat</option>
                    <option value="deepseek-coder">DeepSeek Coder</option>
                  </select>
                </div>
              </>
            )}

            {aiProvider === 'YANDEXGPT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={yandexKey}
                    onChange={(e) => setYandexKey(e.target.value)}
                    placeholder={aiSettings?.yandexApiKey || 'Введите ключ...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Folder ID</label>
                  <input
                    type="text"
                    value={yandexFolderId}
                    onChange={(e) => setYandexFolderId(e.target.value)}
                    placeholder={aiSettings?.yandexFolderId || 'b1g...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Модель</label>
                  <select value={yandexModel} onChange={(e) => setYandexModel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="yandexgpt-lite">YandexGPT Lite</option>
                    <option value="yandexgpt">YandexGPT</option>
                    <option value="yandexgpt-32k">YandexGPT 32K</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Temperature & Tokens */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temperature: {temperature}</label>
              <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Tokens: {maxTokens}</label>
              <input type="range" min="100" max="4000" step="100" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
            <button onClick={() => testAiMutation.mutate()} disabled={testAiMutation.isPending} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              {testAiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Тест
            </button>
            <button onClick={handleSaveAi} disabled={updateAiMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
              {updateAiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить
            </button>
            {aiTestResult && (
              <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${aiTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {aiTestResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {aiTestResult.message.substring(0, 50)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Settings */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Настройки WhatsApp</h3>
              <p className="text-slate-600 text-sm">Интеграция с GreenAPI для отправки сообщений</p>
            </div>
            <button
              onClick={() => setWaEnabled(!waEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waEnabled ? 'bg-green-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${waEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Как получить:</p>
                <p className="text-green-700">green-api.com → Создать инстанс → Получить Instance ID и Token</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instance ID</label>
              <input
                type="text"
                value={greenApiId}
                onChange={(e) => setGreenApiId(e.target.value)}
                placeholder={waSettings?.greenApiId || 'Введите Instance ID...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Token</label>
              <input
                type="password"
                value={greenApiToken}
                onChange={(e) => setGreenApiToken(e.target.value)}
                placeholder={waSettings?.greenApiToken || 'Введите токен...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
            <button onClick={() => testWaMutation.mutate()} disabled={testWaMutation.isPending} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              {testWaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Тест
            </button>
            <button onClick={handleSaveWa} disabled={updateWaMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {updateWaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить
            </button>
            {waTestResult && (
              <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${waTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {waTestResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {waTestResult.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Anti-ban Settings */}
      {activeTab === 'antiban' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-violet-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Антибан настройки</h3>
              <p className="text-slate-600 text-sm">Защита от блокировки WhatsApp</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Задержка между сообщениями</span>
                </div>
                <p className="text-sm text-slate-600">30 - 120 секунд (случайная)</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Лимит сообщений в час</span>
                </div>
                <p className="text-sm text-slate-600">20 сообщений</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Лимит сообщений в день</span>
                </div>
                <p className="text-sm text-slate-600">100 сообщений</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">Тихие часы</span>
                </div>
                <p className="text-sm text-amber-600">22:00 - 08:00 (сообщения не отправляются)</p>
              </div>

              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                <h4 className="font-medium text-violet-700 mb-2">Как это работает:</h4>
                <ul className="text-sm text-violet-600 space-y-1">
                  <li>• Сообщения отправляются с случайной задержкой</li>
                  <li>• Имитация человеческого поведения</li>
                  <li>• Автоматическая пауза при превышении лимитов</li>
                  <li>• Планирование на следующий день если превышен дневной лимит</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

