import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { X } from 'lucide-react'

interface CardModalProps {
  student: any
  classId: string
  onClose: () => void
}

export default function CardModal({ student, classId, onClose }: CardModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    lessonId: '',
    activityLevel: 'MEDIUM',
    skills: [] as string[],
    mood: 'NEUTRAL',
    notes: '',
    recommendation: '',
    taskCompletedCount: 0,
    taskTotalForLesson: 1,
    externalProjectLink: '',
  })

  // Get lessons for this class
  const { data: classData } = useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}`)
      return response.data
    },
  })

  const createCardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/cards', {
        ...data,
        studentId: student.id,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createCardMutation.mutate(formData)
  }

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const skillsOptions = [
    'понимание концепта',
    'работа с API',
    'генерация простых вариантов',
    'креативность',
    'решение проблем',
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Карточка ученика: {student.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Урок
            </label>
            <select
              value={formData.lessonId}
              onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
              className="input"
              required
            >
              <option value="">Выберите урок</option>
              {classData?.modules?.flatMap((module: any) =>
                module.lessons?.map((lesson: any) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.topic} ({new Date(lesson.date).toLocaleDateString('ru-RU')})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень активности
            </label>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, activityLevel: level })}
                  className={`px-4 py-2 rounded-lg ${
                    formData.activityLevel === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {level === 'LOW' && 'Низкая'}
                  {level === 'MEDIUM' && 'Средняя'}
                  {level === 'HIGH' && 'Высокая'}
                  {level === 'VERY_HIGH' && 'Очень высокая'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Навыки
            </label>
            <div className="flex flex-wrap gap-2">
              {skillsOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    formData.skills.includes(skill)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Настроение
            </label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="input"
            >
              <option value="HAPPY">😊 Радостное</option>
              <option value="INTERESTED">🤔 Заинтересованное</option>
              <option value="NEUTRAL">😐 Нейтральное</option>
              <option value="TIRED">😴 Усталое</option>
              <option value="DISTRACTED">😕 Рассеянное</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметки (200-500 символов)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={4}
              minLength={200}
              maxLength={500}
              required
              placeholder="Опишите активность ученика на уроке..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.notes.length}/500 символов
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Рекомендации
            </label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              className="input"
              rows={2}
              placeholder="Рекомендации для дальнейшего развития..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Выполнено задач
              </label>
              <input
                type="number"
                value={formData.taskCompletedCount}
                onChange={(e) =>
                  setFormData({ ...formData, taskCompletedCount: parseInt(e.target.value) || 0 })
                }
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Всего задач на урок
              </label>
              <input
                type="number"
                value={formData.taskTotalForLesson}
                onChange={(e) =>
                  setFormData({ ...formData, taskTotalForLesson: parseInt(e.target.value) || 1 })
                }
                className="input"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка на проект (опционально)
            </label>
            <input
              type="url"
              value={formData.externalProjectLink}
              onChange={(e) => setFormData({ ...formData, externalProjectLink: e.target.value })}
              className="input"
              placeholder="https://platform.example.com/projects/..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={createCardMutation.isPending}
              className="btn-primary flex-1"
            >
              {createCardMutation.isPending ? 'Сохранение...' : 'Сохранить карточку'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



