import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function SettingsPage() {
  const { profile, signOut, upgradeToTeacher, redeemPremiumCode } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [upgraded, setUpgraded] = useState(false)

  const [premiumCode, setPremiumCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState('')

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpgradeError('')
    setUpgrading(true)
    const ok = await upgradeToTeacher(code)
    if (ok) setUpgraded(true)
    else setUpgradeError('邀请码无效或已使用，请联系管理员')
    setUpgrading(false)
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setRedeemError('')
    setRedeeming(true)
    const ok = await redeemPremiumCode(premiumCode)
    if (!ok) setRedeemError('邀请码无效或已使用，请联系管理员')
    setRedeeming(false)
  }

  const handleSignOut = async () => {
    if (!window.confirm('确认退出登录？')) return
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-900">设置</h1>
      </header>

      <div className="px-4 pt-5 space-y-4">
        {/* User info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
              {profile?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profile?.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {profile?.role === 'teacher' ? '教师' : '学生'}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade to teacher */}
        {profile?.role === 'student' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">升级为教师账号</h3>
            <p className="text-xs text-gray-400 mb-3">输入学校提供的教师邀请码，即可解锁班级管理和批阅功能</p>
            {upgraded ? (
              <p className="text-green-600 text-sm font-medium">已成功升级为教师</p>
            ) : (
              <form onSubmit={handleUpgrade} className="flex gap-2">
                <input
                  value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="教师邀请码" autoCapitalize="none"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" disabled={upgrading || !code.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
                  {upgrading ? '…' : '确认'}
                </button>
              </form>
            )}
            {upgradeError && <p className="text-red-500 text-xs mt-2">{upgradeError}</p>}
          </div>
        )}

        {/* Premium unlock */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">AI 高级功能</h3>
          <p className="text-xs text-gray-400 mb-3">AI 错题诊断、AI 生成练习、AI 辅助背单词均为付费功能，内测期间可凭邀请码免费解锁</p>
          {profile?.is_premium ? (
            <p className="text-green-600 text-sm font-medium">已解锁，尽情使用 ✨</p>
          ) : (
            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                value={premiumCode} onChange={(e) => setPremiumCode(e.target.value)}
                placeholder="付费功能邀请码" autoCapitalize="none"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={redeeming || !premiumCode.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
                {redeeming ? '…' : '解锁'}
              </button>
            </form>
          )}
          {redeemError && <p className="text-red-500 text-xs mt-2">{redeemError}</p>}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-red-500 font-medium text-sm text-left">
          退出登录
        </button>
      </div>
    </div>
  )
}
