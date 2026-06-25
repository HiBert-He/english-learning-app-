import { useState, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'

export default function PremiumGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { profile, redeemPremiumCode } = useAuth()
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState('')

  if (profile?.is_premium) return <>{children}</>

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRedeeming(true)
    const ok = await redeemPremiumCode(code)
    if (!ok) setError('邀请码无效或已被使用')
    setRedeeming(false)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
      <div className="text-3xl">🔒</div>
      <p className="text-sm font-semibold text-gray-800">{feature} 是付费功能</p>
      <p className="text-xs text-gray-500">内测期间可凭邀请码免费解锁</p>
      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="输入邀请码" autoCapitalize="none"
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={redeeming || !code.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
          {redeeming ? '…' : '解锁'}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
