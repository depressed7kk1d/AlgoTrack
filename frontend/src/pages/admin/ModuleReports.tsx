import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { ArrowLeft, FileText, User, Copy, Check, Loader2, Download, ExternalLink, Bot, Link2, Send } from 'lucide-react'

interface Report {
  id: string
  reportText: string
  avgCompletion: number
  status: string
  student: {
    id: string
    name: string
    parent: {
      name: string
      phone?: string
      parentType: string
    }
  }
}

export default function ModuleReports() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  const { data: moduleData } = useQuery({
    queryKey: ['module-data', moduleId],
    queryFn: async () => {
      // Get class details that includes this module
      const response = await api.get(`/admin/classes`)
      const classes = response.data
      for (const cls of classes) {
        const classDetail = await api.get(`/admin/classes/${cls.id}`)
        const module = classDetail.data.modules?.find((m: any) => m.id === moduleId)
        if (module) {
          return { ...module, classData: classDetail.data }
        }
      }
      return null
    },
    enabled: !!moduleId,
  })

  const { data: reports, refetch: refetchReports } = useQuery<Report[]>({
    queryKey: ['module-reports', moduleId],
    queryFn: async () => (await api.get(`/reports/module/${moduleId}`)).data,
    enabled: !!moduleId,
  })

  const generateMutation = useMutation({
    mutationFn: async (studentId: string) => {
      setGeneratingFor(studentId)
      const response = await api.post(`/reports/generate`, { moduleId, studentId })
      return response.data
    },
    onSuccess: () => {
      refetchReports()
      setGeneratingFor(null)
    },
    onError: () => setGeneratingFor(null),
  })

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      const students = moduleData?.classData?.classStudents || []
      for (const cs of students) {
        await api.post(`/reports/generate`, { moduleId, studentId: cs.student.id })
      }
    },
    onSuccess: () => refetchReports(),
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyLinkToClipboard = (token: string, id: string) => {
    const url = `${window.location.origin}/parent/${token}`
    navigator.clipboard.writeText(url)
    setCopiedLinkId(id)
    setTimeout(() => setCopiedLinkId(null), 2000)
  }

  const students = moduleData?.classData?.classStudents || []
  const lessonsCount = moduleData?.lessons?.length || 0

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Персональные ОС по модулю</h1>
            <p className="text-slate-600">
              {moduleData?.title} • {moduleData?.classData?.name} • {lessonsCount} уроков
            </p>
          </div>
        </div>
        <button
          onClick={() => generateAllMutation.mutate()}
          disabled={generateAllMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
        >
          {generateAllMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
          Сгенерировать все ОС
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-blue-800 text-sm">
          💡 После генерации ОС вы получите <strong>текст для копирования</strong> (для отправки в WhatsApp) 
          и <strong>ссылку на страницу родителя</strong> с красивым PDF-отчётом по ученику.
        </p>
      </div>

      {/* Students Reports */}
      <div className="space-y-6">
        {students.map((cs: any) => {
          const report = reports?.find(r => r.student.id === cs.student.id)
          const isGenerating = generatingFor === cs.student.id
          const parentToken = cs.student.parentLink?.linkToken
          const parentPageUrl = parentToken ? `${window.location.origin}/parent/${parentToken}` : null
          
          return (
            <div key={cs.student.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Student Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {cs.student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{cs.student.name}</p>
                    <p className="text-sm text-slate-500">
                      Родитель: {cs.student.parent?.name} 
                      {cs.student.parent?.phone && ` • ${cs.student.parent.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report && (
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      report.avgCompletion >= 80 ? 'bg-green-100 text-green-700' :
                      report.avgCompletion >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(report.avgCompletion)}% выполнения
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cs.student.parent?.parentType === 'CALM' ? 'bg-green-100 text-green-700' :
                    cs.student.parent?.parentType === 'ANXIOUS' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {cs.student.parent?.parentType === 'CALM' ? '😊 Спокойный' :
                     cs.student.parent?.parentType === 'ANXIOUS' ? '😟 Тревожный' : '😤 Требовательный'}
                  </span>
                </div>
              </div>

              {/* Report Content */}
              <div className="p-6">
                {report ? (
                  <>
                    {/* Generated Text */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm text-slate-700 border border-slate-200 max-h-64 overflow-y-auto">
                      {report.reportText}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Copy Text */}
                      <button
                        onClick={() => copyToClipboard(report.reportText, report.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          copiedId === report.id 
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {copiedId === report.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === report.id ? 'Скопировано!' : 'Копировать текст'}
                      </button>
                      
                      {/* Regenerate */}
                      <button
                        onClick={() => generateMutation.mutate(cs.student.id)}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2.5 text-violet-600 hover:bg-violet-50 rounded-lg text-sm font-medium border border-violet-200"
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                        Перегенерировать
                      </button>

                      {/* Separator */}
                      <div className="flex-1" />

                      {/* Parent Page Link */}
                      {parentToken && (
                        <>
                          <button
                            onClick={() => copyLinkToClipboard(parentToken, cs.student.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              copiedLinkId === cs.student.id
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            {copiedLinkId === cs.student.id ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                            {copiedLinkId === cs.student.id ? 'Ссылка скопирована!' : 'Копировать ссылку для родителя'}
                          </button>
                          
                          <a
                            href={`/parent/${parentToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Открыть страницу родителя
                          </a>
                        </>
                      )}
                    </div>

                    {/* Parent Link Display */}
                    {parentToken && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 mb-1 font-medium">📎 Ссылка для родителя (можно отправить в WhatsApp):</p>
                        <code className="text-xs text-amber-900 break-all">{parentPageUrl}</code>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">ОС ещё не сгенерирована</p>
                    <button
                      onClick={() => generateMutation.mutate(cs.student.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg mx-auto font-medium"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                      Сгенерировать ОС
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </MainLayout>
  )
}
