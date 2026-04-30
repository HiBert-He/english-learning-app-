import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './db';
import BottomNav from './components/BottomNav';
import WrongQuestionsPage from './pages/WrongQuestionsPage';
import AddWrongQuestionPage from './pages/AddWrongQuestionPage';
import WrongQuestionDetailPage from './pages/WrongQuestionDetailPage';
import VocabularyPage from './pages/VocabularyPage';
import AddWordPage from './pages/AddWordPage';
import ReviewPage from './pages/ReviewPage';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(() => setError('数据库初始化失败，请刷新重试'));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen px-6 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wrong-questions" replace />} />
        <Route path="/wrong-questions" element={<><WrongQuestionsPage /><BottomNav /></>} />
        <Route path="/wrong-questions/add" element={<AddWrongQuestionPage />} />
        <Route path="/wrong-questions/:id" element={<WrongQuestionDetailPage />} />
        <Route path="/vocabulary" element={<><VocabularyPage /><BottomNav /></>} />
        <Route path="/vocabulary/add" element={<AddWordPage />} />
        <Route path="/vocabulary/review" element={<ReviewPage />} />
      </Routes>
    </HashRouter>
  );
}
