import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import WrongQuestionsPage from './pages/WrongQuestionsPage'
import AddWrongQuestionPage from './pages/AddWrongQuestionPage'
import WrongQuestionDetailPage from './pages/WrongQuestionDetailPage'
import VocabularyPage from './pages/VocabularyPage'
import AddWordPage from './pages/AddWordPage'
import ReviewPage from './pages/ReviewPage'
import ClassesPage from './pages/ClassesPage'
import CreateClassPage from './pages/CreateClassPage'
import ClassDetailPage from './pages/ClassDetailPage'
import StudentQuestionsPage from './pages/StudentQuestionsPage'
import SettingsPage from './pages/SettingsPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (!profile) return <ProfileSetupPage />

  const withNav = (page: React.ReactNode) => <>{page}<BottomNav /></>

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/wrong-questions" replace />} />
      <Route path="/wrong-questions" element={withNav(<WrongQuestionsPage />)} />
      <Route path="/wrong-questions/add" element={<AddWrongQuestionPage />} />
      <Route path="/wrong-questions/:id" element={<WrongQuestionDetailPage />} />
      <Route path="/vocabulary" element={withNav(<VocabularyPage />)} />
      <Route path="/vocabulary/add" element={<AddWordPage />} />
      <Route path="/vocabulary/review" element={<ReviewPage />} />
      <Route path="/classes" element={withNav(<ClassesPage />)} />
      <Route path="/classes/create" element={<CreateClassPage />} />
      <Route path="/classes/:id" element={<ClassDetailPage />} />
      <Route path="/classes/:id/students/:studentId" element={<StudentQuestionsPage />} />
      <Route path="/settings" element={withNav(<SettingsPage />)} />
      <Route path="*" element={<Navigate to="/wrong-questions" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
