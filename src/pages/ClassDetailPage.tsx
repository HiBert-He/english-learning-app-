import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Class, Enrollment, Profile } from '../types'

interface StudentRow extends Enrollment {
  profiles: Profile
  questionCount?: number
  uncorrectedCount?: number
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cls, setCls] = useState<Class | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  const load = async () => {
    if (!id) return
    setLoading(true)

    const [{ data: classData }, { data: enrollmentData }] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('enrollments').select('*, profiles(*)').eq('class_id', id),
    ])

    setCls(classData ?? null)

    if (enrollmentData) {
      const studentsWithCounts = await Promise.all(
        enrollmentData.map(async (e: any) => {
          const { data: qData } = await supabase
            .from('wrong_questions')
            .select('corrected')
            .eq('user_id', e.student_id)
          const questionCount = qData?.length ?? 0
          const uncorrectedCount = qData?.filter((q: any) => !q.corrected).length ?? 0
          return { ...e, questionCount, uncorrectedCount }
        })
      )
      setStudents(studentsWithCounts as StudentRow[])
    }
    setLoading(false)
  }

  const copyCode = () => {
    if (!cls) return
    navigator.clipboard.writeText(cls.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteClass = async () => {
    if (!cls || !window.confirm(`确认解散「${cls.name}」？此操作不可撤销。`)) return
    await supabase.from('classes').delete().eq('id', cls.id)
    navigate('/classes')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!cls) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400">班级不存在</p>
    </div>
  )

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{cls.name}</h1>
          <button onClick={handleDeleteClass} className="text-red-400 text-sm">解散</button>
        </div>

        <button onClick={copyCode}
          className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-sm w-full">
          <span className="font-medium">班级码：</span>
          <span className="font-mono font-bold tracking-widest flex-1">{cls.invite_code}</span>
          <span className="text-xs text-blue-500">{copied ? '已复制' : '点击复制'}</span>
        </button>
      </header>

      <div className="px-4 pt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          学生列表（{students.length} 人）
        </p>
        <div className="space-y-2">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">暂无学生，把班级码分享给学生吧</p>
            </div>
          ) : (
            students.map((s) => (
              <Link key={s.id} to={`/classes/${id}/students/${s.student_id}`}
                className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {s.profiles?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.profiles?.name ?? '未知'}</p>
                    <p className="text-xs text-gray-400">错题 {s.questionCount} 道</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(s.uncorrectedCount ?? 0) > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      待订正 {s.uncorrectedCount}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
