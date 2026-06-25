import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  createProfile: (name: string) => Promise<string | null>
  upgradeToTeacher: (code: string) => Promise<boolean>
  redeemPremiumCode: (code: string) => Promise<boolean>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createProfile = async (name: string): Promise<string | null> => {
    if (!user) return '未登录'
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, name, role: 'student' })
      .select()
      .single()
    if (error) return error.message
    setProfile(data)
    return null
  }

  const upgradeToTeacher = async (code: string) => {
    if (!user || !profile) return false
    const { data: codeRow } = await supabase
      .from('teacher_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .is('used_by', null)
      .single()
    if (!codeRow) return false

    await supabase
      .from('teacher_codes')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('code', codeRow.code)

    await supabase
      .from('profiles')
      .update({ role: 'teacher' })
      .eq('id', user.id)

    await fetchProfile(user.id)
    return true
  }

  const redeemPremiumCode = async (code: string) => {
    if (!user || !profile) return false
    if (profile.is_premium) return true
    const { data: codeRow } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .is('used_by', null)
      .single()
    if (!codeRow) return false

    await supabase
      .from('invite_codes')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('code', codeRow.code)

    await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id)

    await fetchProfile(user.id)
    return true
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, createProfile, upgradeToTeacher, redeemPremiumCode, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
