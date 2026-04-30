import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/useVocabulary';
import type { Word } from '../types';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { words, update } = useVocabulary();

  const queue = useMemo(() => {
    const unmastered = words.filter((w) => !w.mastered);
    return shuffle([...unmastered]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [masteredThisSession, setMasteredThisSession] = useState(0);

  const current: Word | undefined = queue[index];

  const next = (mastered: boolean) => {
    if (!current) return;
    if (mastered) {
      update({ ...current, mastered: true, lastReviewedAt: Date.now() });
      setMasteredThisSession((n) => n + 1);
    } else {
      update({ ...current, lastReviewedAt: Date.now() });
    }
    setFlipped(false);
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setTimeout(() => setIndex((i) => i + 1), 50);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">全部已掌握！</h2>
        <p className="text-gray-500 text-sm mb-8">所有单词都已标记为已掌握，继续添加新单词吧</p>
        <button onClick={() => navigate('/vocabulary')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-semibold">
          返回单词本
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">复习完成！</h2>
        <p className="text-gray-500 text-sm mb-2">
          本次复习了 <span className="font-semibold text-gray-700">{queue.length}</span> 个单词
        </p>
        <p className="text-gray-500 text-sm mb-8">
          新掌握 <span className="font-semibold text-green-600">{masteredThisSession}</span> 个
        </p>
        <button onClick={() => navigate('/vocabulary')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-semibold">
          返回单词本
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-4 pt-12 pb-4 flex items-center gap-3 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-base font-bold text-gray-900">单词复习</h1>
            <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((index) / queue.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wide">
          {flipped ? '释义' : '点击卡片查看释义'}
        </p>

        {/* Flashcard */}
        <div
          className="flip-card-container w-full"
          style={{ height: 280 }}
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
            {/* Front: English */}
            <div className="flip-card-front bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer select-none">
              <p className="text-4xl font-bold text-gray-900 text-center mb-3">{current?.english}</p>
              <div className="w-8 h-0.5 bg-gray-200 rounded" />
              <p className="text-gray-400 text-sm mt-3">← 点击翻转 →</p>
            </div>
            {/* Back: Chinese + example */}
            <div className="flip-card-back bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-md flex flex-col items-center justify-center p-8 cursor-pointer select-none">
              <p className="text-2xl font-bold text-white text-center mb-3">{current?.chinese}</p>
              {current?.example && (
                <>
                  <div className="w-8 h-0.5 bg-blue-400 rounded mb-3" />
                  <p className="text-blue-100 text-sm text-center italic leading-relaxed">{current.example}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons - only show after flip */}
        <div className={`w-full mt-8 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex gap-3">
            <button
              onClick={() => next(false)}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              😅 还不会
            </button>
            <button
              onClick={() => next(true)}
              className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              🎉 已掌握
            </button>
          </div>
          <button
            onClick={() => next(false)}
            className="w-full mt-2 text-gray-400 text-sm py-2"
          >
            跳过
          </button>
        </div>

        {!flipped && (
          <button
            onClick={() => setFlipped(true)}
            className="mt-8 text-blue-600 text-sm font-medium"
          >
            显示释义
          </button>
        )}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
