import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Bot, MessageCircle, Save, TestTube, Check, X, Loader2, Info } from 'lucide-react'

interface AISettings {
  id: string
  provider: 'GIGACHAT' | 'OPENAI' | 'DEEPSEEK' | 'YANDEXGPT'
  isEnabled: boolean
  // GigaChat
  gigachatAuthKey: string | null
  gigachatScope: string
  gigachatModel: string | null
  // OpenAI
  openaiApiKey: string | null
  openaiModel: string | null
  openaiBaseUrl: string | null
  // DeepSeek
  deepseekApiKey: string | null
  deepseekModel: string | null
  // YandexGPT
  yandexApiKey: string | null
  yandexFolderId: string | null
  yandexModel: string | null
  // Common
  temperature: number
  maxTokens: number
}

interface WhatsAppSettings {
  id: string
  isEnabled: boolean
  greenApiId: string | null
  greenApiToken: string | null
}

interface AIProvider {
  id: string
  name: string
  description: string
  authType: string
  requiredFields: string[]
  models: { id: string; name: string; description: string }[]
  scopes?: { id: string; name: string; description: string }[]
  howToGet: string
  pricing: string
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // AI Settings State
  const [aiProvider, setAiProvider] = useState<'GIGACHAT' | 'OPENAI' | 'DEEPSEEK' | 'YANDEXGPT'>('GIGACHAT')
  const [aiEnabled, setAiEnabled] = useState(false)
  // GigaChat
  const [gigachatKey, setGigachatKey] = useState('')
  const [gigachatScope, setGigachatScope] = useState('GIGACHAT_API_PERS')
  const [gigachatModel, setGigachatModel] = useState('GigaChat-2')
  // OpenAI
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo')
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  // DeepSeek
  const [deepseekKey, setDeepseekKey] = useState('')
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat')
  // YandexGPT
  const [yandexKey, setYandexKey] = useState('')
  const [yandexFolderId, setYandexFolderId] = useState('')
  const [yandexModel, setYandexModel] = useState('yandexgpt-lite')
  // Common
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1500)

  // WhatsApp Settings State
  const [waEnabled, setWaEnabled] = useState(false)
  const [greenApiId, setGreenApiId] = useState('')
  const [greenApiToken, setGreenApiToken] = useState('')

  // Test Results
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null)
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Fetch AI Settings
  const { data: aiSettings, isLoading: aiLoading } = useQuery<AISettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await api.get('/ai/settings')
      return response.data
    },
  })

  // Fetch AI Providers
  const { data: providers } = useQuery<AIProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const response = await api.get('/ai/providers')
      return response.data
    },
  })

  // Fetch WhatsApp Settings
  const { data: waSettings, isLoading: waLoading } = useQuery<WhatsAppSettings>({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/whatsapp')
      return response.data
    },
  })

  // Update AI Settings Mutation
  const updateAiMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/ai/settings', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
    },
  })

  // Update WhatsApp Settings Mutation
  const updateWaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/settings/whatsapp', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] })
    },
  })

  // Test AI Mutation
  const testAiMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/test')
      return response.data
    },
    onSuccess: (data) => {
      setAiTestResult(data)
    },
    onError: (error: any) => {
      setAiTestResult({ success: false, message: error.response?.data?.message || 'Ошибка теста' })
    },
  })

  // Test WhatsApp Mutation
  const testWaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/whatsapp/test')
      return response.data
    },
    onSuccess: (data) => {
      setWaTestResult(data)
    },
    onError: (error: any) => {
      setWaTestResult({ success: false, message: error.response?.data?.message || 'Ошибка теста' })
    },
  })

  // Load settings into state
  useEffect(() => {
    if (aiSettings) {
      setAiProvider(aiSettings.provider)
      setAiEnabled(aiSettings.isEnabled)
      setTemperature(aiSettings.temperature)
      setMaxTokens(aiSettings.maxTokens)
      // GigaChat
      if (aiSettings.gigachatScope) setGigachatScope(aiSettings.gigachatScope)
      if (aiSettings.gigachatModel) setGigachatModel(aiSettings.gigachatModel)
      // OpenAI
      if (aiSettings.openaiModel) setOpenaiModel(aiSettings.openaiModel)
      if (aiSettings.openaiBaseUrl) setOpenaiBaseUrl(aiSettings.openaiBaseUrl)
      // DeepSeek
      if (aiSettings.deepseekModel) setDeepseekModel(aiSettings.deepseekModel)
      // YandexGPT
      if (aiSettings.yandexModel) setYandexModel(aiSettings.yandexModel)
    }
  }, [aiSettings])

  useEffect(() => {
    if (waSettings) {
      setWaEnabled(waSettings.isEnabled)
    }
  }, [waSettings])

  const handleSaveAi = () => {
    const data: any = {
      provider: aiProvider,
      isEnabled: aiEnabled,
      temperature,
      maxTokens,
    }

    // Provider-specific fields (only send if changed)
    switch (aiProvider) {
      case 'GIGACHAT':
        if (gigachatKey && !gigachatKey.includes('***')) data.gigachatAuthKey = gigachatKey
        data.gigachatScope = gigachatScope
        data.gigachatModel = gigachatModel
        break
      case 'OPENAI':
        if (openaiKey && !openaiKey.includes('***')) data.openaiApiKey = openaiKey
        data.openaiModel = openaiModel
        if (openaiBaseUrl) data.openaiBaseUrl = openaiBaseUrl
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
    const data: any = {
      isEnabled: waEnabled,
    }
    if (greenApiId && !greenApiId.includes('***')) data.greenApiId = greenApiId
    if (greenApiToken && !greenApiToken.includes('***')) data.greenApiToken = greenApiToken
    updateWaMutation.mutate(data)
    setWaTestResult(null)
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GIGACHAT': return '🤖'
      case 'OPENAI': return '🧠'
      case 'DEEPSEEK': return '🔍'
      case 'YANDEXGPT': return '🅨'
      default: return '🤖'
    }
  }

  const currentProvider = providers?.find(p => p.id === aiProvider)

  if (aiLoading || waLoading) {
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
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-purple-600">Настройки</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.name}</span>
              <button onClick={logout} className="btn-secondary text-sm">Выйти</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Settings */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Настройки AI</h2>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable AI */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Включить AI</h3>
                <p className="text-sm text-gray-500">Использовать нейросеть для генерации текстов</p>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Провайдер</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {providers?.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setAiProvider(provider.id as any)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      aiProvider === provider.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getProviderIcon(provider.id)}</span>
                      <span className="font-medium text-sm">{provider.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Info */}
            {currentProvider && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
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
            {aiProvider === 'GIGACHAT' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">🤖 Настройки GigaChat</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authorization Key (Base64)
                  </label>
                  <input
                    type="password"
                    value={gigachatKey}
                    onChange={(e) => setGigachatKey(e.target.value)}
                    placeholder={aiSettings?.gigachatAuthKey || 'Введите ключ авторизации...'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope (тип подписки)</label>
                  <select value={gigachatScope} onChange={(e) => setGigachatScope(e.target.value)} className="input">
                    <option value="GIGACHAT_API_PERS">Физические лица</option>
                    <option value="GIGACHAT_API_B2B">ИП/Юр. лица (пакеты)</option>
                    <option value="GIGACHAT_API_CORP">ИП/Юр. лица (pay-as-you-go)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
                  <select value={gigachatModel} onChange={(e) => setGigachatModel(e.target.value)} className="input">
                    <option value="GigaChat-2">GigaChat 2 (быстрая)</option>
                    <option value="GigaChat-2-Pro">GigaChat 2 Pro (качественная)</option>
                    <option value="GigaChat-2-Max">GigaChat 2 Max (максимум)</option>
                  </select>
                </div>
              </div>
            )}

            {aiProvider === 'OPENAI' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">🧠 Настройки OpenAI</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={aiSettings?.openaiApiKey || 'sk-...'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
                  <select value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} className="input">
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрая, дешёвая)</option>
                    <option value="gpt-4">GPT-4 (качественная)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (улучшенная)</option>
                    <option value="gpt-4o">GPT-4o (новейшая)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (опционально, для прокси)</label>
                  <input
                    type="text"
                    value={openaiBaseUrl}
                    onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="input"
                  />
                </div>
              </div>
            )}

            {aiProvider === 'DEEPSEEK' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">🔍 Настройки DeepSeek</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder={aiSettings?.deepseekApiKey || 'Введите ключ...'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
                  <select value={deepseekModel} onChange={(e) => setDeepseekModel(e.target.value)} className="input">
                    <option value="deepseek-chat">DeepSeek Chat (для диалогов)</option>
                    <option value="deepseek-coder">DeepSeek Coder (для кода)</option>
                  </select>
                </div>
              </div>
            )}

            {aiProvider === 'YANDEXGPT' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">🅨 Настройки YandexGPT</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={yandexKey}
                    onChange={(e) => setYandexKey(e.target.value)}
                    placeholder={aiSettings?.yandexApiKey || 'Введите API ключ...'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Folder ID (ID каталога)</label>
                  <input
                    type="text"
                    value={yandexFolderId}
                    onChange={(e) => setYandexFolderId(e.target.value)}
                    placeholder={aiSettings?.yandexFolderId || 'b1g...'}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
                  <select value={yandexModel} onChange={(e) => setYandexModel(e.target.value)} className="input">
                    <option value="yandexgpt-lite">YandexGPT Lite (быстрая)</option>
                    <option value="yandexgpt">YandexGPT (стандартная)</option>
                    <option value="yandexgpt-32k">YandexGPT 32K (большой контекст)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Common AI Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature: {temperature}</label>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Низкие значения - точнее, высокие - креативнее</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens: {maxTokens}</label>
                <input
                  type="range" min="100" max="4000" step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Максимальная длина ответа</p>
              </div>
            </div>

            {/* Test & Save Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <button
                onClick={() => testAiMutation.mutate()}
                disabled={testAiMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                {testAiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Тест подключения
              </button>
              <button
                onClick={handleSaveAi}
                disabled={updateAiMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateAiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить
              </button>
              {aiTestResult && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${aiTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {aiTestResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{aiTestResult.message}</span>
                </div>
              )}
              {updateAiMutation.isSuccess && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Сохранено
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Настройки WhatsApp</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Включить WhatsApp</h3>
                <p className="text-sm text-gray-500">Отправка сообщений через GreenAPI</p>
              </div>
              <button
                onClick={() => setWaEnabled(!waEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waEnabled ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${waEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Как получить:</p>
                  <p className="text-green-700">green-api.com → Создать инстанс → Получить Instance ID и Token</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GreenAPI Instance ID</label>
              <input
                type="text"
                value={greenApiId}
                onChange={(e) => setGreenApiId(e.target.value)}
                placeholder={waSettings?.greenApiId || 'Введите Instance ID...'}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GreenAPI Token</label>
              <input
                type="password"
                value={greenApiToken}
                onChange={(e) => setGreenApiToken(e.target.value)}
                placeholder={waSettings?.greenApiToken || 'Введите токен...'}
                className="input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <button
                onClick={() => testWaMutation.mutate()}
                disabled={testWaMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                {testWaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Тест подключения
              </button>
              <button
                onClick={handleSaveWa}
                disabled={updateWaMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateWaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить
              </button>
              {waTestResult && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${waTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {waTestResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{waTestResult.message}</span>
                </div>
              )}
              {updateWaMutation.isSuccess && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Сохранено
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
