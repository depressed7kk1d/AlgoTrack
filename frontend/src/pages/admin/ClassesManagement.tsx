import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Users, GraduationCap, MessageSquare, X, Loader2, Check, ArrowRight } from 'lucide-react'

interface Class {
  id: string
  name: string
  whatsappGroupName?: string
  teacher: { id: string; name: string }
  _count: { classStudents: number; modules: number; lessons: number }
}

interface Teacher {
  id: string
  name: string
}

export default function ClassesManagement() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', teacherId: '', whatsappGroupId: '', whatsappGroupName: '' })

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['admin-classes'],
    queryFn: async () => (await api.get('/admin/classes')).data,
  })

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['admin-teachers'],
    queryFn: async () => (await api.get('/admin/teachers')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => (await api.post('/admin/classes', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      setShowModal(false)
      setFormData({ name: '', teacherId: '', whatsappGroupId: '', whatsappGroupName: '' })
    },
  })

  return (
    <MainLayout title="Управление классами">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-600">Группы вашей школы</p>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg">
          <Plus className="w-5 h-5" />
          Создать класс
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/classes/${cls.id}`)}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />{cls.teacher.name}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
              {cls.whatsappGroupName && (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                  <MessageSquare className="w-4 h-4" />{cls.whatsappGroupName}
                </div>
              )}
              <div className="flex gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cls._count.classStudents} уч.</span>
                <span>{cls._count.modules} мод.</span>
                <span>{cls._count.lessons} урок.</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Новый класс</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название класса *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required placeholder="Python - Группа А" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Преподаватель *</label>
                <select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required>
                  <option value="">Выберите преподавателя</option>
                  {teachers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp группа (ID)</label>
                <input type="text" value={formData.whatsappGroupId} onChange={(e) => setFormData({ ...formData, whatsappGroupId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="79991234567-123@g.us" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название группы WhatsApp</label>
                <input type="text" value={formData.whatsappGroupName} onChange={(e) => setFormData({ ...formData, whatsappGroupName: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Python Группа А - Родители" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

