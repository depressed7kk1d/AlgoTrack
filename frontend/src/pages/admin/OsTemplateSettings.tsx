import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { Save, RotateCcw, Info, Loader2, Check, Copy, Sparkles } from 'lucide-react'

export default function OsTemplateSettings() {
  const queryClient = useQueryClient()
  const [template, setTemplate] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['os-template'],
    queryFn: async () => (await api.get('/admin/os-template')).data,
  })

  useEffect(() => {
    if (data?.template) {
      setTemplate(data.template)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (newTemplate: string) => {
      await api.patch('/admin/os-template', { template: newTemplate })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-template'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleReset = () => {
    if (data?.template) {
      setTemplate(data.template)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const placeholders = [
    { tag: '[Имя родителя]', desc: 'Имя родителя ученика' },
    { tag: '[Имя ребёнка]', desc: 'Имя ученика' },
    { tag: '[Имя педагога]', desc: 'Имя преподавателя группы' },
    { tag: '[Название модуля]', desc: 'Название текущего модуля' },
    { tag: '[N]', desc: 'Количество уроков' },
    { tag: '[X]%', desc: 'Процент выполнения' },
  ]

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
          <h1 className="text-2xl font-bold text-slate-900">Настройка шаблона ОС</h1>
          <p className="text-slate-600">
            Настройте пример персональной обратной связи, который будет использоваться 
            при генерации ОС для родителей
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-violet-900 font-medium">Как это работает?</p>
              <p className="text-violet-700 text-sm mt-1">
                Нейросеть использует ваш пример как образец стиля и структуры. 
                Она сгенерирует персональную ОС для каждого ученика, сохраняя ваш стиль общения 
                и формат сообщения, но с реальными данными об успеваемости.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholders Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-medium mb-2">Доступные переменные:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {placeholders.map((p) => (
                  <div key={p.tag} className="flex items-center gap-2">
                    <code className="bg-amber-100 px-2 py-0.5 rounded text-amber-800">{p.tag}</code>
                    <span className="text-amber-700">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Ваш пример ОС</h3>
              <p className="text-sm text-slate-500">
                {data?.hasCustomTemplate 
                  ? '✅ Используется ваш персональный шаблон' 
                  : '📝 Используется шаблон по умолчанию'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          </div>
          
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full h-96 p-4 text-sm font-mono text-slate-700 resize-none focus:outline-none"
            placeholder="Введите ваш пример обратной связи..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить изменения
          </button>
          
          <button
            onClick={() => saveMutation.mutate(template)}
            disabled={saveMutation.isPending}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              saved 
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saved ? 'Сохранено!' : 'Сохранить шаблон'}
          </button>
        </div>

        {/* Example Section */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Примеры хороших ОС</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 mb-2 font-medium">Пример для ученика с высоким результатом (95%+):</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
{`Елена, доброе утро, на связи Оксана ☀

Делюсь обратной связью после четырёх занятий по модулю «Введение в Python» от педагога Александра 💻

Средний процент выполнения заданий Владислава на образовательной платформе за 4 занятия — 100%

— На первом уроке Владислав познакомился с основами Python, функцией print() и базовыми арифметическими операторами.

— На втором уроке освоил работу с переменными, научился вводить данные с клавиатуры, различать типы данных и менять их с помощью int().

— На третьем уроке изучил строки и методы работы с ними, а также исправление ошибок типов.

— На четвёртом уроке познакомился с вложенными конструкциями, научился создавать лаконичный и читаемый код.

Образовательный результат: Владислав выполняет все практические задания на 100%, внимателен к теоретической части, активно работает на уроках, проявляет высокий интерес и вовлеченность 👍🏻

Рекомендации: Планируем перевод на более сложный трек обучения для поддержания высокого уровня мотивации.

Желаем Владиславу успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 mb-2 font-medium">Пример для ученика с пробелами (60-80%):</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
{`Вера, доброе утро, на связи Оксана ☀

Делюсь обратной связью после четырёх занятий по модулю «Введение в Python» от педагога Александра 💻

Средний процент выполнения заданий Ивана на образовательной платформе за 4 занятия — 82%

— На первом уроке Иван познакомился с основами Python, функцией print() и базовыми арифметическими операторами. 100% выполнение практических заданий

— На втором уроке повторял работу с переменными, научился вводить данные с клавиатуры с помощью input(). 64% выполнение практических заданий

— На третьем уроке изучил строки: складывать строки, получать символы по индексу, извлекать часть строки. 81% выполнения практических заданий

— На четвёртом уроке познакомился с вложенными конструкциями. 82% выполнение практических заданий

Образовательный результат: Иван активно работает на уроках, однако есть пробелы по Уроку 2 с процентом выполнения 64%.

Рекомендации: Рекомендую самостоятельно дома изучить ещё раз теорию и доделать практику по 2 уроку "Переменные".

Желаем Ивану успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

