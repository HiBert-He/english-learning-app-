import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useVocabulary } from '../hooks/useVocabulary'
import { useAuth } from '../lib/auth'

type Mode = 'single' | 'bulk'

interface ParsedWord { english: string; chinese: string; example: string }

const HEADER_KEYWORDS = ['english', '英文', '单词', 'word', 'vocab']

function parseBulkText(text: string): ParsedWord[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes('\t') ? '\t' : ','
      const parts = line.split(sep).map((s) => s.trim())
      return { english: parts[0] ?? '', chinese: parts[1] ?? '', example: parts[2] ?? '' }
    })
    .filter((w) => w.english && w.chinese)
}

function parseExcel(file: File): Promise<ParsedWord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(ws, { header: 1 })

        let start = 0
        if (rows.length > 0) {
          const firstCell = String(rows[0][0] ?? '').toLowerCase()
          if (HEADER_KEYWORDS.some((kw) => firstCell.includes(kw))) start = 1
        }

        const words = rows.slice(start)
          .map((row) => ({
            english: String(row[0] ?? '').trim(),
            chinese: String(row[1] ?? '').trim(),
            example: String(row[2] ?? '').trim(),
          }))
          .filter((w) => w.english && w.chinese)

        resolve(words)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export default function AddWordPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { add, addBulk } = useVocabulary(profile!.id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('single')

  // single mode
  const [english, setEnglish] = useState('')
  const [chinese, setChinese] = useState('')
  const [example, setExample] = useState('')

  // bulk mode
  const [bulkText, setBulkText] = useState('')
  const [fileWords, setFileWords] = useState<ParsedWord[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const textParsed = useMemo(() => parseBulkText(bulkText), [bulkText])
  const parsed: ParsedWord[] = fileWords ?? textParsed

  const handleFile = async (file: File) => {
    setError('')
    try {
      const words = await parseExcel(file)
      if (words.length === 0) { setError('未识别到有效单词，请检查格式（A列英文，B列中文）'); return }
      setFileWords(words)
      setFileName(file.name)
      setBulkText('')
    } catch {
      setError('文件解析失败，请确认是有效的 Excel 或 CSV 文件')
    }
  }

  const clearFile = () => { setFileWords(null); setFileName('') }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

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
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
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

          {/* Excel upload zone */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">上传 Excel / CSV 文件</p>
            <p className="text-xs text-gray-400">A列英文，B列中文，C列例句（可选）；支持 .xlsx .xls .csv</p>

            {fileName ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <span className="text-sm text-blue-700 font-medium truncate">{fileName}</span>
                </div>
                <button onClick={clearFile} className="text-blue-400 hover:text-blue-600 shrink-0 ml-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 active:bg-gray-100'
                }`}
              >
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-400">点击选择文件或拖拽到此处</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileInput} />
          </div>

          {/* Divider */}
          {!fileName && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">或手动粘贴</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Manual text paste */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-400">每行一个：<span className="font-mono">英文,中文,例句</span>（例句可省略，也支持 Tab 分隔）</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'apple,苹果,I eat an apple every day.\nbeautiful,美丽的\nserendipity,意外发现美好事物的能力'}
                  rows={8}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">解析预览（共 {parsed.length} 个单词）</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {parsed.map((w, i) => (
                  <div key={i} className="flex items-baseline gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-900 shrink-0">{w.english}</span>
                    <span className="text-sm text-gray-500 shrink-0">{w.chinese}</span>
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
