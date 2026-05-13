import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function ProfileSetupPage() {
  const { createProfile } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const err = await createProfile(name.trim())
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 bg-white max-w-[480px] mx-auto">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">👋</div>
        <h1 className="text-xl font-bold text-gray-900">设置你的昵称</h1>
        <p className="text-gray-400 text-sm mt-1">老师和同学会看到这个名字</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="姓名或昵称" required
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        <button type="submit" disabled={saving || !name.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-40">
          {saving ? '设置中…' : '进入应用'}
        </button>
      </form>
    </div>
  )
}
