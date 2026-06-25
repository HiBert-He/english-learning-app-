import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useVocabulary } from '../hooks/useVocabulary'
import { useAuth } from '../lib/auth'
import PremiumGate from '../components/PremiumGate'
import SpeakButton from '../components/SpeakButton'
import type { Word, VocabAssist } from '../types'

type SortOrder = 'entry' | 'alpha'

export default function VocabularyPage() {
  const { profile } = useAuth()
  const { words, loading, remove, removeMany } = useVocabulary(profile!.id)
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortOrder>('entry')
  const [search, setSearch] = useState('')
  const [filterMastered, setFilterMastered] = useState<'all' | 'mastered' | 'learning'>('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const displayed = useMemo(() => {
    let list = [...words]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((w) => w.english.toLowerCase().includes(q) || w.chinese.includes(q))
    }
    if (filterMastered === 'mastered') list = list.filter((w) => w.mastered)
    if (filterMastered === 'learning') list = list.filter((w) => !w.mastered)
    if (sort === 'alpha') list.sort((a, b) => a.english.localeCompare(b.english))
    return list
  }, [words, sort, search, filterMastered])

  const unmasteredCount = words.filter((w) => !w.mastered).length
  const allSelected = displayed.length > 0 && displayed.every((w) => selectedIds.has(w.id))

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allSelected) return new Set()
      const next = new Set(prev)
      displayed.forEach((w) => next.add(w.id))
      return next
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 个单词？`)) return
    removeMany([...selectedIds])
    exitSelectMode()
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">背单词</h1>
          <div className="flex items-center gap-2">
            {selectMode ? (
              <button onClick={exitSelectMode} className="text-sm font-medium text-gray-500 px-2 py-1.5">
                取消
              </button>
            ) : (
              <>
                {unmasteredCount > 0 && (
                  <button onClick={() => navigate('/vocabulary/review')}
                    className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
                    复习 {unmasteredCount}
                  </button>
                )}
                <button onClick={() => setSelectMode(true)}
                  className="text-sm font-medium text-gray-500 px-2 py-1.5">
                  管理
                </button>
                <Link to="/vocabulary/add"
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
                  <span className="text-lg leading-none">+</span> 添加
                </Link>
              </>
            )}
          </div>
        </div>

        {selectMode && (
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={toggleSelectAll} className="text-sm font-medium text-blue-600">
              {allSelected ? '取消全选' : '全选'}
            </button>
            <span className="text-xs text-gray-400">已选 {selectedIds.size} 个</span>
            <button onClick={handleBatchDelete} disabled={selectedIds.size === 0}
              className={`text-sm font-medium px-3 py-1 rounded-lg ${
                selectedIds.size === 0 ? 'text-gray-300' : 'text-red-600'
              }`}>
              删除
            </button>
          </div>
        )}

        <div className="relative mb-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索单词…"
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-0.5 flex-1">
            {(['entry', 'alpha'] as SortOrder[]).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sort === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}>
                {s === 'entry' ? '录入顺序' : '字母顺序'}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {(['all', 'learning', 'mastered'] as const).map((f) => (
              <button key={f} onClick={() => setFilterMastered(f)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterMastered === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}>
                {f === 'all' ? '全部' : f === 'learning' ? '学习中' : '已掌握'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中…</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-gray-400 text-sm">暂无单词，点击右上角添加</p>
          </div>
        ) : (
          displayed.map((word) => (
            <WordRow key={word.id} word={word}
              onDelete={() => { if (window.confirm('确认删除这个单词？')) remove(word.id) }}
              selectMode={selectMode}
              selected={selectedIds.has(word.id)}
              onToggleSelect={() => toggleSelect(word.id)} />
          ))
        )}
      </div>
    </div>
  )
}

function WordRow({ word, onDelete, selectMode, selected, onToggleSelect }: {
  word: Word
  onDelete: () => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
}) {
  const { profile } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [assist, setAssist] = useState<VocabAssist | null>(null)
  const [assisting, setAssisting] = useState(false)
  const [assistError, setAssistError] = useState('')

  const handleAiAssist = async () => {
    setShowMenu(false)
    setExpanded(true)
    if (!profile?.is_premium) return
    if (assist || assisting) return
    setAssisting(true)
    setAssistError('')
    try {
      const res = await fetch('/api/vocab-assist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ english: word.english, chinese: word.chinese }),
      })
      if (!res.ok) throw new Error()
      setAssist(await res.json())
    } catch {
      setAssistError('AI 助记加载失败，请重试')
    } finally {
      setAssisting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
      onClick={selectMode ? onToggleSelect : undefined}>
      <div className="flex items-center gap-3">
        {selectMode && (
          <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
          }`}>
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-base">{word.english}</span>
            <SpeakButton text={word.english} />
            {word.mastered && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-medium">已掌握</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{word.chinese}</p>
          {word.example && <p className="text-gray-400 text-xs mt-0.5 italic">{word.example}</p>}
        </div>
        {!selectMode && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-gray-400 rounded-lg"
              onBlur={() => setTimeout(() => setShowMenu(false), 150)}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-28">
                <button onClick={handleAiAssist} className="w-full text-left px-3 py-2 text-sm text-violet-600 hover:bg-violet-50">
                  ✨ AI 助记
                </button>
                <button onClick={onDelete} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <PremiumGate feature="AI 辅助背单词">
            {assisting ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                AI 助记生成中…
              </div>
            ) : assist ? (
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-left space-y-2">
                <p className="text-xs font-semibold text-violet-700">✨ 记忆技巧</p>
                <p className="text-sm text-gray-700">{assist.mnemonic}</p>
                {assist.example && (
                  <div className="pt-1 border-t border-violet-100">
                    <p className="text-sm text-gray-700 italic">{assist.example}</p>
                    {assist.example_translation && (
                      <p className="text-xs text-gray-400 mt-0.5">{assist.example_translation}</p>
                    )}
                  </div>
                )}
                {assist.related?.length > 0 && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">相关词：</span>
                    {assist.related.join('、')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-500 text-xs">{assistError}</p>
            )}
          </PremiumGate>
        </div>
      )}
    </div>
  )
}
