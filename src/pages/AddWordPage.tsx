import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVocabulary } from '../hooks/useVocabulary'
import { useAuth } from '../lib/auth'

type Mode = 'single' | 'bulk'

interface ParsedWord { english: string; chinese: string; example: string }

function parseBulk(text: string): ParsedWord[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // support tab or comma as separator
      const sep = line.includes('\t') ? '\t' : ','
      const parts = line.split(sep).map((s) => s.trim())
      return {
        english: parts[0] ?? '',
        chinese: parts[1] ?? '',
        example: parts[2] ?? '',
      }
    })
    .filter((w) => w.english && w.chinese)
}

export default function AddWordPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { add, addBulk } = useVocabulary(profile!.id)

  const [mode, setMode] = useState<Mode>('single')

  // single mode
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [example, setExample] = useState('')

  // bulk mode
  const [bulkText, setBulkText] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsed = useMemo(() => parseBulk(bulkText), [bulkText])

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!english.trim() || !chinese.trim()) return
    setSaving(true)
    setError('')
    try {
      await add({ english: english.trim(), chinese: chinese.trim(), example: example.trim() })
      navigate('/vocabulary')
    } catch (err: any) {
      setError(err?.message ?? '保存失败，请重试')
      setSaving(false)
    }
  }

  const handleBulkSubmit = async () => {
    if (parsed.length === 0) return
    setSaving(true)
    setError('')
    try {
      await addBulk(parsed)
      navigate('/vocabulary')
    } catch (err: any) {
      setError(err?.message ?? '保存失败，请重试')
      setSaving(false)
    }
  }

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">添加单词</h1>
      </header>

      {/* Mode toggle */}
      <div className="px-4 pt-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['single', 'bulk'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {m === 'single' ? '单个添加' : '批量导入'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="px-4 pt-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">英文单词 *</label>
            <input value={english} onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. serendipity" required autoCapitalize="none" autoCorrect="off"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">中文释义 *</label>
            <input value={chinese} onChange={(e) => setChinese(e.target.value)}
              placeholder="意外发现美好事物的能力" required
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">例句（可选）</label>
            <textarea value={example} onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. Finding this café was pure serendipity." rows={2}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={saving || !english.trim() || !chinese.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform">
            {saving ? '保存中…' : '保存单词'}
          </button>
        </form>
      ) : (
        <div className="px-4 pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">粘贴单词列表</label>
            <p className="text-xs text-gray-400">每行一个单词，用逗号或 Tab 分隔：<span className="font-mono">英文,中文,例句</span>（例句可省略）</p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'apple,苹果,I eat an apple every day.\nbeautiful,美丽的\nserendipity,意外发现美好事物的能力'}
              rows={10}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">解析预览（共 {parsed.length} 个单词）</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {parsed.map((w, i) => (
                  <div key={i} className="flex items-baseline gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-900 shrink-0">{w.english}</span>
                    <span className="text-sm text-gray-500">{w.chinese}</span>
                    {w.example && <span className="text-xs text-gray-400 truncate">{w.example}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleBulkSubmit}
            disabled={saving || parsed.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {saving ? '保存中…' : `导入 ${parsed.length} 个单词`}
          </button>
        </div>
      )}
    </div>
  )
}
