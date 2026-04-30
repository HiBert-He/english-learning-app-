import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWrongQuestions } from '../hooks/useWrongQuestions';
import type { WrongQuestion } from '../types';

type Filter = 'all' | 'uncorrected' | 'corrected';

export default function WrongQuestionsPage() {
  const { questions, loading } = useWrongQuestions();
  const [filter, setFilter] = useState<Filter>('all');
  const [tagFilter, setTagFilter] = useState<string>('');

  const allTags = Array.from(new Set(questions.flatMap((q) => q.knowledgePoints)));

  const filtered = questions.filter((q) => {
    if (filter === 'uncorrected' && q.corrected) return false;
    if (filter === 'corrected' && !q.corrected) return false;
    if (tagFilter && !q.knowledgePoints.includes(tagFilter)) return false;
    return true;
  });

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">错题本</h1>
          <Link
            to="/wrong-questions/add"
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
          >
            <span className="text-lg leading-none">+</span> 添加
          </Link>
        </div>

        <div className="flex gap-2 mb-2">
          {(['all', 'uncorrected', 'corrected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f === 'all' ? '全部' : f === 'uncorrected' ? '待订正' : '已订正'}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setTagFilter('')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !tagFilter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              所有知识点
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tagFilter === tag ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-400 text-sm">暂无错题，点击右上角添加</p>
          </div>
        ) : (
          filtered.map((q) => <QuestionCard key={q.id} question={q} />)
        )}
      </div>
    </div>
  );
}

function QuestionCard({ question: q }: { question: WrongQuestion }) {
  return (
    <Link to={`/wrong-questions/${q.id}`} className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
          q.corrected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {q.corrected ? '已订正' : '待订正'}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(q.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      {q.questionImages.length > 0 && (
        <div className="flex gap-2 mb-2">
          {q.questionImages.slice(0, 2).map((src, i) => (
            <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-xl" />
          ))}
          {q.questionImages.length > 2 && (
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
              +{q.questionImages.length - 2}
            </div>
          )}
        </div>
      )}

      {q.questionText && (
        <p className="text-gray-700 text-sm line-clamp-2 mb-2">{q.questionText}</p>
      )}

      {q.knowledgePoints.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {q.knowledgePoints.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">{tag}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
