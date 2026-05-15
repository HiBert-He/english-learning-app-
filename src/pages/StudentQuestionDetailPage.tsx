import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudentQuestion, setTeacherComment } from '../db'
import ImageUploader from '../components/ImageUploader'
import type { WrongQuestion } from '../types'

export default function StudentQuestionDetailPage() {
  const { studentId, questionId } = useParams<{ id: string; studentId: string; questionId: string }>()
  const navigate = useNavigate()

  const [question, setQuestion] = useState<WrongQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [answerImages, setAnswerImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!studentId || !questionId) return
    getStudentQuestion(studentId, questionId)
      .then((q) => { setQuestion(q); setLoading(false) })
      .catch(() => setLoading(false))
  }, [studentId, questionId])

  const startEditing = () => {
    if (!question) return
    setCommentText(question.teacher_comment ?? '')
    setAnswerImages(question.teacher_answer_images ?? [])
    setEditing(true)
  }

  const saveComment = async () => {
    if (!question) return
    setSaving(true)
    await setTeacherComment(question.id, commentText.trim(), answerImages)
    setQuestion({
      ...question,
      teacher_comment: commentText.trim(),
      teacher_answer_images: answerImages,
      teacher_commented_at: new Date().toISOString(),
    })
    setEditing(false)
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!question) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400">题目不存在</p>
    </div>
  )

  return (
    <div className="pb-10">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">错题详情</h1>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          question.corrected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {question.corrected ? '已订正' : '待订正'}
        </span>
      </header>

      <div className="px-4 pt-5 space-y-4">

        {/* 题目 */}
        <Section title="题目">
          {question.question_images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {question.question_images.map((src, i) => (
                <img key={i} src={src} alt="" className="max-w-full rounded-xl border border-gray-200" />
              ))}
            </div>
          )}
          {question.question_text && (
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.question_text}</p>
          )}
        </Section>

        {/* 正确答案 */}
        {(question.correct_answer || question.correct_answer_images?.length > 0) && (
          <Section title="正确答案">
            <div className="bg-green-50 rounded-xl p-3 space-y-2">
              {question.correct_answer_images?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.correct_answer_images.map((src, i) => (
                    <img key={i} src={src} alt="" className="max-w-full rounded-lg border border-green-200" />
                  ))}
                </div>
              )}
              {question.correct_answer && (
                <p className="text-green-700 text-sm whitespace-pre-wrap">{question.correct_answer}</p>
              )}
            </div>
          </Section>
        )}

        {/* 学生答案 */}
        {question.my_answer && (
          <Section title="学生答案">
            <p className="text-red-600 text-sm whitespace-pre-wrap bg-red-50 rounded-xl p-3">{question.my_answer}</p>
          </Section>
        )}

        {/* 错误原因 */}
        {question.reason && (
          <Section title="错误原因">
            <p className="text-gray-700 text-sm whitespace-pre-wrap bg-amber-50 rounded-xl p-3">{question.reason}</p>
          </Section>
        )}

        {/* 知识点 */}
        {question.knowledge_points.length > 0 && (
          <Section title="知识点">
            <div className="flex flex-wrap gap-1.5">
              {question.knowledge_points.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">{tag}</span>
              ))}
            </div>
          </Section>
        )}

        {/* 教师批注 */}
        <Section title="教师批注">
          {!editing ? (
            <div className="space-y-2">
              {(question.teacher_comment || question.teacher_answer_images?.length > 0) ? (
                <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                  {question.teacher_answer_images?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {question.teacher_answer_images.map((src, i) => (
                        <img key={i} src={src} alt="" className="max-w-full rounded-lg border border-purple-200" />
                      ))}
                    </div>
                  )}
                  {question.teacher_comment && (
                    <p className="text-purple-800 text-sm whitespace-pre-wrap">{question.teacher_comment}</p>
                  )}
                  {question.teacher_commented_at && (
                    <p className="text-xs text-purple-400">{new Date(question.teacher_commented_at).toLocaleString('zh-CN')}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">暂无批注</p>
              )}
              <button onClick={startEditing}
                className="w-full border border-dashed border-purple-300 text-purple-600 py-2.5 rounded-xl text-sm font-medium">
                {(question.teacher_comment || question.teacher_answer_images?.length > 0) ? '修改批注' : '+ 添加批注 / 上传答案'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500">上传正确答案图片</p>
                <ImageUploader images={answerImages} onChange={setAnswerImages} />
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="输入文字批注（可选）…"
                rows={4}
                autoFocus
                className="w-full border border-purple-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-2xl text-sm font-semibold">
                  取消
                </button>
                <button onClick={saveComment} disabled={saving}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-2xl text-sm font-semibold disabled:opacity-40">
                  {saving ? '保存中…' : '保存批注'}
                </button>
              </div>
            </div>
          )}
        </Section>

        <p className="text-xs text-gray-400 text-right pt-2">
          添加于 {new Date(question.created_at).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}
