import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import MainLayout from '../../components/layout/MainLayout'
import { 
  Plus, Edit2, Trash2, GraduationCap, Mail, Phone, BookOpen, X, Loader2, Check 
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
  createdAt: string
  _count: { classes: number }
}

export default function TeachersManagement() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' })

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/admin/teachers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await api.patch(`/admin/teachers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/teachers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })
    },
  })

  const openCreateModal = () => {
    setEditingTeacher(null)
    setFormData({ name: '', email: '', password: '', phone: '' })
    setShowModal(true)
  }

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({ name: teacher.name, email: teacher.email, password: '', phone: teacher.phone || '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTeacher(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTeacher) {
      const updateData: any = { ...formData }
      if (!updateData.password) delete updateData.password
      updateMutation.mutate({ id: editingTeacher.id, data: updateData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <MainLayout title="Управление преподавателями">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-600">Преподаватели вашей школы</p>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg">
          <Plus className="w-5 h-5" />
          Добавить преподавателя
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers?.map((teacher) => (
            <div key={teacher.id} className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 ${!teacher.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                    {!teacher.isActive && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Деактивирован</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(teacher)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4 text-slate-600" /></button>
                  <button onClick={() => confirm(`Деактивировать "${teacher.name}"?`) && deleteMutation.mutate(teacher.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4" />{teacher.email}</div>
                {teacher.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4" />{teacher.phone}</div>}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1 text-sm text-slate-600"><BookOpen className="w-4 h-4" />{teacher._count.classes} классов</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">{editingTeacher ? 'Редактировать' : 'Новый преподаватель'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Пароль {editingTeacher ? '' : '*'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required={!editingTeacher} minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">Отмена</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg flex items-center justify-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {editingTeacher ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

