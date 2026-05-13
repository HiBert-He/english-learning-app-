import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registerDone, setRegisterDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setRegisterDone(true)
    }
    setLoading(false)
  }

  if (registerDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">验证邮件已发送</h2>
        <p className="text-gray-500 text-sm mb-6">请前往邮箱点击验证链接，完成注册后即可登录。</p>
        <button onClick={() => { setMode('login'); setRegisterDone(false) }}
          className="text-blue-600 text-sm font-medium">
          返回登录
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 bg-white max-w-[480px] mx-auto">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-gray-900">英语错题本</h1>
        <p className="text-gray-400 text-sm mt-1">记录错题，掌握知识点</p>
      </div>

      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}>
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">邮箱</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" required autoCapitalize="none"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">密码</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '至少 6 位' : '输入密码'} required minLength={6}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-40 mt-2">
          {loading ? '请稍候…' : mode === 'login' ? '登录' : '注册'}
        </button>
      </form>
    </div>
  )
}
