import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWrongQuestions } from '../hooks/useWrongQuestions'
import { useAuth } from '../lib/auth'
import ImageUploader from '../components/ImageUploader'
import TagInput from '../components/TagInput'

export default function AddWrongQuestionPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { add } = useWrongQuestions(profile!.id)

  const [questionText, setQuestionText] = useState('')
  const [questionImages, setQuestionImages] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [correctAnswerImages, setCorrectAnswerImages] = useState<string[]>([])
  const [myAnswer, setMyAnswer] = useState('')
  const [reason, setReason] = useState('')
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [analyzing, setAnalyzing] = useState(false)
  const [aiHint, setAiHint] = useState('')

  const handleAiAnalyze = async () => {
    if (!questionText.trim() && questionImages.length === 0) return
    setAnalyzing(true)
    setAiHint('')
    try {
      const res = await fetch('/api/analyze-question', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question_text: questionText,
          question_images: questionImages,
          correct_answer: correctAnswer,
          my_answer: myAnswer,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()

      if (Array.isArray(data.knowledge_points) && data.knowledge_points.length > 0) {
        setKnowledgePoints(data.knowledge_points)
      }
      if (data.error_analysis && !reason.trim()) {
        setReason(data.error_analysis)
      }
      if (data.question_text_ocr && !questionText.trim()) {
        setQuestionText(data.question_text_ocr)
      }
      if (data.suggestions) {
        setAiHint(data.suggestions)
      }
    } catch {
      setAiHint('AI 分析失败，请手动填写')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim() && questionImages.length === 0) return
    setSaving(true)
    setError('')
    try {
      await add({
        question_text: questionText,
        question_images: questionImages,
        correct_answer: correctAnswer,
        correct_answer_images: correctAnswerImages,
        my_answer: myAnswer,
        reason,
        knowledge_points: knowledgePoints,
      })
      navigate('/wrong-questions')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
      setSaving(false)
    }
  }

  const canAnalyze = questionText.trim().length > 0 || questionImages.length > 0

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">添加错题</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-5">
        <Field label="题目内容">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="输入题目文字（可选，也可仅上传图片）"
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2">
            <ImageUploader images={questionImages} onChange={setQuestionImages} />
          </div>
        </Field>

        {/* AI analyze button */}
        <button
          type="button"
          onClick={handleAiAnalyze}
          disabled={!canAnalyze || analyzing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-blue-300 text-blue-600 text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform bg-blue-50"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              AI 分析中…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI 一键分析（自动识别知识点）
            </>
          )}
        </button>

        {aiHint && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
            <span className="font-semibold">AI 建议：</span>{aiHint}
          </div>
        )}

        <Field label="正确答案">
          <textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="写下正确答案（可选）"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2">
            <ImageUploader images={correctAnswerImages} onChange={setCorrectAnswerImages} />
          </div>
        </Field>

        <Field label="我的答案（可选）">
          <textarea
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            placeholder="写下你当时的答案"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>

        <Field label="错误原因">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="分析为什么做错了（AI 分析后会自动填入）"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>

        <Field label="知识点标签">
          <TagInput
            tags={knowledgePoints}
            onChange={setKnowledgePoints}
            placeholder="如：时态、定语从句（AI 分析后会自动填入）"
          />
        </Field>

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        <button
          type="submit"
          disabled={saving || (!questionText.trim() && questionImages.length === 0)}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {saving ? '保存中…' : '保存错题'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}
