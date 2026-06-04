import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWrongQuestions } from '../hooks/useWrongQuestions'
import { useAuth } from '../lib/auth'
import type { WrongQuestion } from '../types'

type Filter = 'all' | 'uncorrected' | 'corrected'

export default function WrongQuestionsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { questions, loading } = useWrongQuestions(profile!.id)
  const [filter, setFilter] = useState<Filter>('all')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const allTags = Array.from(new Set(questions.flatMap((q) => q.knowledge_points)))

  const filtered = questions.filter((q) => {
    if (filter === 'uncorrected' && q.corrected) return false
    if (filter === 'corrected' && !q.corrected) return false
    if (tagFilter && !q.knowledge_points.includes(tagFilter)) return false
    if (search) {
      const s = search.toLowerCase()
      const hit =
        q.question_text.toLowerCase().includes(s) ||
        q.correct_answer.toLowerCase().includes(s) ||
        q.my_answer.toLowerCase().includes(s) ||
        q.reason.toLowerCase().includes(s) ||
        q.knowledge_points.some((t) => t.toLowerCase().includes(s))
      if (!hit) return false
    }
    return true
  })

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">错题本</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/diagnostic')}
              title="诊断报告"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-500 active:scale-[0.95] transition-transform"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </button>
            <Link
              to="/wrong-questions/add"
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
            >
              <span className="text-lg leading-none">+</span> 添加
            </Link>
          </div>
        </div>

        <div className="relative mb-2">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索题目、答案、知识点…"
            className="w-full pl-9 pr-8 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-2">
          {(['all', 'uncorrected', 'corrected'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
              {f === 'all' ? '全部' : f === 'uncorrected' ? '待订正' : '已订正'}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setTagFilter('')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !tagFilter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
              所有知识点
            </button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tagFilter === tag ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{search ? '🔍' : '📝'}</div>
            <p className="text-gray-400 text-sm">
              {search ? `未找到"${search}"相关错题` : '暂无错题，点击右上角添加'}
            </p>
          </div>
        ) : (
          filtered.map((q) => <QuestionCard key={q.id} question={q} />)
        )}
      </div>
    </div>
  )
}

function QuestionCard({ question: q }: { question: WrongQuestion }) {
  return (
    <Link to={`/wrong-questions/${q.id}`}
      className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
          q.corrected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {q.corrected ? '已订正' : '待订正'}
        </span>
        <div className="flex items-center gap-1.5">
          {q.teacher_comment && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">有批注</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(q.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {q.question_images.length > 0 && (
        <div className="flex gap-2 mb-2">
          {q.question_images.slice(0, 2).map((src, i) => (
            <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-xl" />
          ))}
          {q.question_images.length > 2 && (
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
              +{q.question_images.length - 2}
            </div>
          )}
        </div>
      )}

      {q.question_text && (
        <p className="text-gray-700 text-sm line-clamp-2 mb-2">{q.question_text}</p>
      )}

      {q.knowledge_points.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {q.knowledge_points.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">{tag}</span>
          ))}
        </div>
      )}
    </Link>
  )
}
