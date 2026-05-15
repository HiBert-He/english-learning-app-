import { supabase } from '../lib/supabase'
import type { WrongQuestion, Word } from '../types'

// ── Wrong Questions ────────────────────────────────────────────
export async function getAllWrongQuestions(userId: string): Promise<WrongQuestion[]> {
  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addWrongQuestion(q: Omit<WrongQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<WrongQuestion> {
  const { data, error } = await supabase
    .from('wrong_questions')
    .insert(q)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWrongQuestion(q: WrongQuestion): Promise<void> {
  const { error } = await supabase
    .from('wrong_questions')
    .update({
      question_text: q.question_text,
      question_images: q.question_images,
      correct_answer: q.correct_answer,
      correct_answer_images: q.correct_answer_images,
      my_answer: q.my_answer,
      reason: q.reason,
      knowledge_points: q.knowledge_points,
      corrected: q.corrected,
    })
    .eq('id', q.id)
  if (error) throw error
}

export async function deleteWrongQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('wrong_questions').delete().eq('id', id)
  if (error) throw error
}

// ── Vocabulary ────────────────────────────────────────────────
export async function getAllWords(userId: string): Promise<Word[]> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addWord(word: Omit<Word, 'id' | 'created_at'>): Promise<Word> {
  const { data, error } = await supabase.from('vocabulary').insert(word).select().single()
  if (error) throw error
  return data
}

export async function addWords(words: Omit<Word, 'id' | 'created_at'>[]): Promise<void> {
  const { error } = await supabase.from('vocabulary').insert(words)
  if (error) throw error
}

export async function updateWord(word: Word): Promise<void> {
  const { error } = await supabase
    .from('vocabulary')
    .update({
      english: word.english,
      chinese: word.chinese,
      example: word.example,
      mastered: word.mastered,
      last_reviewed_at: word.last_reviewed_at,
    })
    .eq('id', word.id)
  if (error) throw error
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from('vocabulary').delete().eq('id', id)
  if (error) throw error
}

// ── Teacher: read student questions ──────────────────────────
export async function getStudentWrongQuestions(studentId: string): Promise<WrongQuestion[]> {
  const { data, error } = await supabase
    .rpc('get_student_questions_for_teacher', { p_student_id: studentId })
  if (error) throw error
  const list = (data ?? []) as WrongQuestion[]
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getStudentQuestion(studentId: string, questionId: string): Promise<WrongQuestion | null> {
  const { data, error } = await supabase
    .rpc('get_student_questions_for_teacher', { p_student_id: studentId })
  if (error) throw error
  const list = (data ?? []) as WrongQuestion[]
  return list.find((q) => q.id === questionId) ?? null
}

export async function setTeacherComment(questionId: string, comment: string, answerImages: string[] = []): Promise<void> {
  const { error } = await supabase.rpc('set_teacher_comment', {
    p_question_id: questionId,
    p_comment: comment,
    p_answer_images: answerImages,
  })
  if (error) throw error
}
