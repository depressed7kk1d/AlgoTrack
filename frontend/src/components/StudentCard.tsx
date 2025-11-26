import { useState } from 'react'
import { User, TrendingUp } from 'lucide-react'
import CardModal from './CardModal'

interface Student {
  id: string
  name: string
  avatar?: string
  progress: number
  cardsCount: number
  latestCard?: any
  parent: {
    name: string
    parentType: string
  }
}

interface StudentCardProps {
  student: Student
  classId: string
}

export default function StudentCard({ student, classId }: StudentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="card cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-500">{student.parent.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Прогресс модуля</span>
              <span className="text-sm font-medium text-gray-900">{student.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(student.progress)}`}
                style={{ width: `${student.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>{student.cardsCount} карточек</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal
          student={student}
          classId={classId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}



