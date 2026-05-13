import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CreateClassPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !profile) return
    setSaving(true)
    setError('')
    const code = generateCode()
    const { error: err } = await supabase
      .from('classes')
      .insert({ name: name.trim(), teacher_id: profile.id, invite_code: code })
    if (err) {
      setError('创建失败，请重试')
      setSaving(false)
      return
    }
    navigate('/classes')
  }

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">创建班级</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">班级名称</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="如：高三(2)班英语" required
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-400 px-1">创建后系统自动生成班级码，分享给学生即可加入。</p>
        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        <button type="submit" disabled={saving || !name.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-40">
          {saving ? '创建中…' : '创建班级'}
        </button>
      </form>
    </div>
  )
}
