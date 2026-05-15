import { useState, useEffect, useCallback } from 'react'
import {
  getAllWrongQuestions,
  addWrongQuestion,
  updateWrongQuestion,
  deleteWrongQuestion,
} from '../db'
import type { WrongQuestion } from '../types'

export function useWrongQuestions(userId: string) {
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getAllWrongQuestions(userId)
    setQuestions(all)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (q: Omit<WrongQuestion, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'corrected' | 'teacher_comment' | 'teacher_answer_images' | 'teacher_id' | 'teacher_commented_at'>) => {
    await addWrongQuestion({
      ...q,
      user_id: userId,
      corrected: false,
      correct_answer_images: q.correct_answer_images ?? [],
      teacher_comment: null,
      teacher_answer_images: [],
      teacher_id: null,
      teacher_commented_at: null,
    })
    await load()
  }, [userId, load])

  const update = useCallback(async (q: WrongQuestion) => {
    await updateWrongQuestion(q)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteWrongQuestion(id)
    await load()
  }, [load])

  return { questions, loading, add, update, remove, reload: load }
}
