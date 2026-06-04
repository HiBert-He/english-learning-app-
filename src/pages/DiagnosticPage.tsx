import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWrongQuestions } from '../hooks/useWrongQuestions'
import { useAuth } from '../lib/auth'

export default function DiagnosticPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { questions, loading } = useWrongQuestions(profile!.id)

  const stats = useMemo(() => {
    const map: Record<string, { total: number; corrected: number }> = {}
    for (const q of questions) {
      for (const kp of q.knowledge_points) {
        if (!map[kp]) map[kp] = { total: 0, corrected: 0 }
        map[kp].total++
        if (q.corrected) map[kp].corrected++
      }
    }
    return Object.entries(map)
      .map(([name, { total, corrected }]) => ({
        name,
        total,
        corrected,
        uncorrected: total - corrected,
      }))
      .sort((a, b) => b.uncorrected - a.uncorrected)
  }, [questions])

  const total = questions.length
  const corrected = questions.filter((q) => q.corrected).length
  const maxCount = stats[0]?.total ?? 1
  const weakPoints = stats.filter((s) => s.uncorrected > 0).slice(0, 5).map((s) => s.name)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">诊断报告</h1>
      </header>

      <div className="px-4 pt-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="总错题" value={total} color="blue" />
          <StatCard label="已订正" value={corrected} color="green" />
          <StatCard label="待订正" value={total - corrected} color="orange" />
        </div>

        {total > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">订正进度</span>
              <span className="font-semibold text-gray-900">
                {Math.round((corrected / total) * 100)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.round((corrected / total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {stats.length > 0 ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-4">知识点薄弱分析</h2>
            <div className="space-y-3.5">
              {stats.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <span className="text-gray-400">
                      待订正 {s.uncorrected} / 共 {s.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-400 transition-all"
                      style={{ width: `${(s.corrected / maxCount) * 100}%` }}
                    />
                    <div
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${(s.uncorrected / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                已订正
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                待订正
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-gray-400 text-sm">
              暂无数据，添加带知识点标签的错题后查看报告
            </p>
          </div>
        )}

        {weakPoints.length > 0 && (
          <button
            onClick={() => navigate('/practice', { state: { selectedPoints: weakPoints } })}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base active:scale-[0.98] transition-transform"
          >
            针对薄弱点生成练习 →
          </button>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'green' | 'orange'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className={`${colors[color]} rounded-2xl p-3 text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5">{label}</div>
    </div>
  )
}
