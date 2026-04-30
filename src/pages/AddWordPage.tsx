import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/useVocabulary';

export default function AddWordPage() {
  const navigate = useNavigate();
  const { add } = useVocabulary();

  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const [example, setExample] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !chinese.trim()) return;
    setSaving(true);
    await add({ english: english.trim(), chinese: chinese.trim(), example: example.trim() });
    navigate('/vocabulary');
  };

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">添加单词</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">英文单词 *</label>
          <input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. serendipity"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">中文释义 *</label>
          <input
            value={chinese}
            onChange={(e) => setChinese(e.target.value)}
            placeholder="意外发现美好事物的能力"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">例句（可选）</label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="e.g. Finding this café was pure serendipity."
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !english.trim() || !chinese.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform mt-4"
        >
          {saving ? '保存中…' : '保存单词'}
        </button>
      </form>
    </div>
  );
}
