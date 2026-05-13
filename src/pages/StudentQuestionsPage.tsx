import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getStudentWrongQuestions, setTeacherComment } from '../db'
import type { Profile, WrongQuestion } from '../types'

export default function StudentQuestionsPage() {
  const { studentId } = useParams<{ id: string; studentId: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Profile | null>(null)
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'uncorrected' | 'corrected'>('all')
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!studentId) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      getStudentWrongQuestions(studentId),
    ]).then(([{ data: profileData }, qs]) => {
      setStudent(profileData ?? null)
      setQuestions(qs)
      setLoading(false)
    })
  }, [studentId])

  const filtered = questions.filter((q) => {
    if (filter === 'uncorrected') return !q.corrected
    if (filter === 'corrected') return q.corrected
    return true
  })

  const openComment = (q: WrongQuestion) => {
    setActiveComment(q.id)
    setCommentText(q.teacher_comment ?? '')
  }

  const saveComment = async (questionId: string) => {
    setSaving(true)
    await setTeacherComment(questionId, commentText.trim())
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, teacher_comment: commentText.trim(), teacher_commented_at: new Date().toISOString() }
          : q
      )
    )
    setActiveComment(null)
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{student?.name ?? '学生'} 的错题</h1>
            <p className="text-xs text-gray-400">共 {questions.length} 道</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'uncorrected', 'corrected'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
              {f === 'all' ? '全部' : f === 'uncorrected' ? '待订正' : '已订正'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">暂无符合条件的错题</p>
          </div>
        ) : (
          filtered.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              {/* Status + date */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  q.corrected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {q.corrected ? '已订正' : '待订正'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(q.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              {/* Images */}
              {q.question_images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.question_images.map((src, i) => (
                    <img key={i} src={src} alt="" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
                  ))}
                </div>
              )}

              {/* Question text */}
              {q.question_text && <p className="text-gray-700 text-sm whitespace-pre-wrap">{q.question_text}</p>}

              {/* Answer */}
              {(q.correct_answer || q.correct_answer_images?.length > 0) && (
                <div className="bg-green-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-green-600">正确答案</p>
                  {q.correct_answer_images?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.correct_answer_images.map((src, i) => (
                        <img key={i} src={src} alt="" className="max-h-40 rounded-lg border border-green-200 object-contain" />
                      ))}
                    </div>
                  )}
                  {q.correct_answer && (
                    <p className="text-sm text-green-800 whitespace-pre-wrap">{q.correct_answer}</p>
                  )}
                </div>
              )}

              {/* My answer */}
              {q.my_answer && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-500 mb-1">学生答案</p>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">{q.my_answer}</p>
                </div>
              )}

              {/* Knowledge points */}
              {q.knowledge_points.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {q.knowledge_points.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">{tag}</span>
                  ))}
                </div>
              )}

              {/* Teacher comment display */}
              {q.teacher_comment && activeComment !== q.id && (
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-purple-600 mb-1">我的批注</p>
                  <p className="text-sm text-purple-800 whitespace-pre-wrap">{q.teacher_comment}</p>
                </div>
              )}

              {/* Comment editor */}
              {activeComment === q.id ? (
                <div className="space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="输入批注内容…"
                    rows={3}
                    autoFocus
                    className="w-full border border-purple-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setActiveComment(null)}
                      className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm">取消</button>
                    <button onClick={() => saveComment(q.id)} disabled={saving}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-40">
                      {saving ? '保存中…' : '保存批注'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openComment(q)}
                  className="w-full border border-dashed border-purple-300 text-purple-600 py-2 rounded-xl text-sm font-medium">
                  {q.teacher_comment ? '修改批注' : '+ 添加批注'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
