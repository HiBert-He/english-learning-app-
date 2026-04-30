import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/useVocabulary';
import type { Word } from '../types';

type SortOrder = 'entry' | 'alpha';

export default function VocabularyPage() {
  const { words, loading, remove } = useVocabulary();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortOrder>('entry');
  const [search, setSearch] = useState('');
  const [filterMastered, setFilterMastered] = useState<'all' | 'mastered' | 'learning'>('all');

  const displayed = useMemo(() => {
    let list = [...words];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) => w.english.toLowerCase().includes(q) || w.chinese.includes(q)
      );
    }
    if (filterMastered === 'mastered') list = list.filter((w) => w.mastered);
    if (filterMastered === 'learning') list = list.filter((w) => !w.mastered);
    if (sort === 'alpha') list.sort((a, b) => a.english.localeCompare(b.english));
    // entry order: already sorted by createdAt desc in hook
    return list;
  }, [words, sort, search, filterMastered]);

  const unmasteredCount = words.filter((w) => !w.mastered).length;

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">背单词</h1>
          <div className="flex items-center gap-2">
            {unmasteredCount > 0 && (
              <button
                onClick={() => navigate('/vocabulary/review')}
                className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
              >
                复习 {unmasteredCount}
              </button>
            )}
            <Link
              to="/vocabulary/add"
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
            >
              <span className="text-lg leading-none">+</span> 添加
            </Link>
          </div>
        </div>

        <div className="relative mb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索单词…"
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-0.5 flex-1">
            {(['entry', 'alpha'] as SortOrder[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sort === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {s === 'entry' ? '录入顺序' : '字母顺序'}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {(['all', 'learning', 'mastered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterMastered(f)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterMastered === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {f === 'all' ? '全部' : f === 'learning' ? '学习中' : '已掌握'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">加载中…</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-gray-400 text-sm">暂无单词，点击右上角添加</p>
          </div>
        ) : (
          displayed.map((word) => (
            <WordRow key={word.id} word={word} onDelete={() => remove(word.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function WordRow({ word, onDelete }: { word: Word; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-base">{word.english}</span>
          {word.mastered && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-medium">已掌握</span>
          )}
        </div>
        <p className="text-gray-500 text-sm truncate">{word.chinese}</p>
        {word.example && <p className="text-gray-400 text-xs mt-0.5 truncate italic">{word.example}</p>}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 rounded-lg"
          onBlur={() => setTimeout(() => setShowMenu(false), 150)}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-24">
            <button
              onClick={onDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
