import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Class } from '../types'

export default function ClassesPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isTeacher = profile?.role === 'teacher'

  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [profile])

  const loadClasses = async () => {
    if (!profile) return
    setLoading(true)
    if (isTeacher) {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })
      setClasses(data ?? [])
    } else {
      const { data } = await supabase
        .from('enrollments')
        .select('class_id, classes(*)')
        .eq('student_id', profile.id)
      const list = (data ?? []).map((e: any) => e.classes).filter(Boolean)
      setClasses(list)
    }
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setJoining(true)
    const { data, error } = await supabase.rpc('join_class_by_code', {
      p_invite_code: joinCode.trim(),
    })
    if (error || data?.error === 'not_found') {
      setJoinError('班级码不正确，请检查后重试')
    } else {
      setJoinCode('')
      setShowJoinInput(false)
      await loadClasses()
    }
    setJoining(false)
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{isTeacher ? '我的班级' : '我的班级'}</h1>
          {isTeacher ? (
            <button onClick={() => navigate('/classes/create')}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
              <span className="text-lg leading-none">+</span> 创建班级
            </button>
          ) : (
            <button onClick={() => setShowJoinInput(!showJoinInput)}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
              <span className="text-lg leading-none">+</span> 加入班级
            </button>
          )}
        </div>

        {showJoinInput && (
          <form onSubmit={handleJoin} className="mt-3 flex gap-2">
            <input
              value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
              placeholder="输入班级码" autoCapitalize="none"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={joining || !joinCode.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
              {joining ? '…' : '加入'}
            </button>
          </form>
        )}
        {joinError && <p className="text-red-500 text-xs mt-2 px-1">{joinError}</p>}
      </header>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中…</p>
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏫</div>
            <p className="text-gray-400 text-sm">
              {isTeacher ? '还没有班级，点击右上角创建' : '还没有加入班级，点击右上角输入班级码'}
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <Link key={cls.id} to={`/classes/${cls.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{cls.name}</p>
                  {isTeacher && (
                    <p className="text-xs text-gray-400 mt-0.5">班级码：<span className="font-mono font-medium text-gray-600">{cls.invite_code}</span></p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
