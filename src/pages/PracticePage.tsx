import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWrongQuestions } from '../hooks/useWrongQuestions'
import { useAuth } from '../lib/auth'
import type { PracticeQuestion } from '../types'

type Phase = 'idle' | 'loading' | 'quiz' | 'done'

export default function PracticePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const { questions } = useWrongQuestions(profile!.id)

  const kpStats = useMemo(() => {
    const map: Record<string, number> = {}
    for (const q of questions) {
      for (const kp of q.knowledge_points) {
        map[kp] = (map[kp] ?? 0) + 1
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [questions])

  const initialSelected = ((location.state as { selectedPoints?: string[] }) ?? {})
    .selectedPoints

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected ?? kpStats.slice(0, 3).map(([k]) => k)),
  )
  const [subject, setSubject] = useState('自动')
  const [phase, setPhase] = useState<Phase>('idle')
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')

  const togglePoint = (kp: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(kp) ? next.delete(kp) : next.add(kp)
      return next
    })
  }

  const generate = async () => {
    if (selected.size === 0) return
    setPhase('loading')
    setError('')
    try {
      const res = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ knowledge_points: Array.from(selected), count: 5, subject }),
      })
      if (!res.ok) throw new Error('生成失败，请重试')
      const data = await res.json()
      if (!Array.isArray(data.questions) || data.questions.length === 0)
        throw new Error('未生成题目，请重试')
      setPracticeQuestions(data.questions)
      setCurrentIdx(0)
      setAnswers({})
      setRevealed(false)
      setPhase('quiz')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '网络错误，请重试')
      setPhase('idle')
    }
  }

  const selectAnswer = (letter: string) => {
    if (revealed) return
    setAnswers((prev) => ({ ...prev, [currentIdx]: letter }))
    setRevealed(true)
  }

  const next = () => {
    if (currentIdx + 1 >= practiceQuestions.length) {
      setPhase('done')
    } else {
      setCurrentIdx((i) => i + 1)
      setRevealed(false)
    }
  }

  const score = practiceQuestions.filter((q, i) => answers[i] === q.correct).length

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">AI 正在生成练习题…</p>
      </div>
    )
  }

  if (phase === 'quiz') {
    const q = practiceQuestions[currentIdx]
    const userAnswer = answers[currentIdx]
    const correctLetter = q.correct

    return (
      <div className="pb-8">
        <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setPhase('idle')} className="text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-gray-900">
              第 {currentIdx + 1} 题 / 共 {practiceQuestions.length} 题
            </h1>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIdx + (revealed ? 1 : 0)) / practiceQuestions.length) * 100}%`,
              }}
            />
          </div>
        </header>

        <div className="px-4 pt-5 space-y-4">
          {q.knowledge_point && (
            <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
              {q.knowledge_point}
            </span>
          )}

          <p className="text-gray-900 text-[15px] leading-relaxed">{q.question}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = userAnswer === letter
              const isCorrect = letter === correctLetter
              let cls =
                'border border-gray-200 bg-white text-gray-700 active:scale-[0.98] transition-transform'
              if (revealed) {
                if (isCorrect)
                  cls = 'border-green-500 bg-green-50 text-green-700'
                else if (isSelected)
                  cls = 'border-red-400 bg-red-50 text-red-600'
              } else if (isSelected) {
                cls = 'border-blue-500 bg-blue-50 text-blue-700'
              }
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(letter)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${cls}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">解析：</span>
              {q.explanation}
            </div>
          )}

          {revealed && (
            <button
              onClick={next}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base active:scale-[0.98] transition-transform"
            >
              {currentIdx + 1 >= practiceQuestions.length ? '查看结果' : '下一题'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const pct = Math.round((score / practiceQuestions.length) * 100)
    return (
      <div className="pb-8">
        <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">练习结果</h1>
        </header>

        <div className="px-4 pt-5 space-y-5">
          <div className="text-center py-6">
            <div className="text-5xl mb-3">
              {pct >= 80 ? '🎉' : pct >= 60 ? '💪' : '📚'}
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {score} / {practiceQuestions.length}
            </div>
            <div className="text-gray-500 text-sm">得分 {pct}%</div>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700">题目详解</h2>
            {practiceQuestions.map((q, i) => {
              const isOK = answers[i] === q.correct
              const correctIdx = q.correct.charCodeAt(0) - 65
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 ${
                    isOK
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`text-base leading-tight ${isOK ? 'text-green-600' : 'text-red-500'}`}>
                      {isOK ? '✓' : '✗'}
                    </span>
                    <p className="text-sm text-gray-800 flex-1">{q.question}</p>
                  </div>
                  {!isOK && (
                    <p className="text-xs text-red-600 mb-1.5">
                      你选了 {answers[i] ? q.options[answers[i].charCodeAt(0) - 65] : '未作答'}
                      ，正确答案：{q.options[correctIdx]}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">解析：</span>
                    {q.explanation}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase('idle')
                setAnswers({})
                setRevealed(false)
              }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base active:scale-[0.98] transition-transform"
            >
              再来一组
            </button>
            <button
              onClick={() => navigate('/wrong-questions')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold text-base active:scale-[0.98] transition-transform"
            >
              回错题本
            </button>
          </div>
        </div>
      </div>
    )
  }

  // idle phase
  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-900">AI 练习</h1>
        <p className="text-xs text-gray-500 mt-0.5">根据你的错题薄弱点，生成专项练习</p>
      </header>

      <div className="px-4 pt-5 space-y-5">
        {kpStats.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">✏️</div>
            <p className="text-gray-400 text-sm">先添加带知识点的错题，再来生成练习</p>
            <button
              onClick={() => navigate('/wrong-questions/add')}
              className="mt-4 text-blue-600 text-sm font-medium"
            >
              添加错题 →
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3">选择学科</h2>
              <div className="flex flex-wrap gap-2">
                {['自动', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      subject === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3">选择练习知识点</h2>
              <p className="text-xs text-gray-400 mb-3">点击选中/取消，将针对所选知识点出题</p>
              <div className="flex flex-wrap gap-2">
                {kpStats.map(([kp, count]) => (
                  <button
                    key={kp}
                    onClick={() => togglePoint(kp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selected.has(kp)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {kp} · {count}题
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm px-1">{error}</p>}

            <button
              onClick={generate}
              disabled={selected.size === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              生成 5 道练习题
            </button>
          </>
        )}
      </div>
    </div>
  )
}
