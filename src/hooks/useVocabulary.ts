import { useState, useEffect, useCallback } from 'react'
import { getAllWords, addWord, addWords, updateWord, deleteWord, deleteWords } from '../db'
import type { Word } from '../types'

export function useVocabulary(userId: string) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getAllWords(userId)
    setWords(all)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (w: Omit<Word, 'id' | 'user_id' | 'created_at' | 'mastered' | 'last_reviewed_at'>) => {
    await addWord({
      ...w,
      user_id: userId,
      mastered: false,
      last_reviewed_at: null,
    })
    await load()
  }, [userId, load])

  const addBulk = useCallback(async (ws: Omit<Word, 'id' | 'user_id' | 'created_at' | 'mastered' | 'last_reviewed_at'>[]) => {
    await addWords(ws.map((w) => ({ ...w, user_id: userId, mastered: false, last_reviewed_at: null })))
    await load()
  }, [userId, load])

  const update = useCallback(async (w: Word) => {
    await updateWord(w)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteWord(id)
    await load()
  }, [load])

  const removeMany = useCallback(async (ids: string[]) => {
    await deleteWords(ids)
    await load()
  }, [load])

  return { words, loading, add, addBulk, update, remove, removeMany, reload: load }
}
