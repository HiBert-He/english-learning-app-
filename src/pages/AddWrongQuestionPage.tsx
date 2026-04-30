import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWrongQuestions } from '../hooks/useWrongQuestions';
import ImageUploader from '../components/ImageUploader';
import TagInput from '../components/TagInput';

export default function AddWrongQuestionPage() {
  const navigate = useNavigate();
  const { add } = useWrongQuestions();

  const [questionText, setQuestionText] = useState('');
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() && questionImages.length === 0) return;
    setSaving(true);
    await add({ questionText, questionImages, correctAnswer, myAnswer, reason, knowledgePoints });
    navigate('/wrong-questions');
  };

  return (
    <div className="pb-8">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">添加错题</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-5">
        <Field label="题目内容">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="输入题目文字（可选）"
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="mt-2">
            <ImageUploader images={questionImages} onChange={setQuestionImages} />
          </div>
        </Field>

        <Field label="正确答案">
          <textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="写下正确答案"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </Field>

        <Field label="我的答案（可选）">
          <textarea
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            placeholder="写下你当时的答案"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </Field>

        <Field label="错误原因">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="分析为什么做错了"
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </Field>

        <Field label="知识点标签">
          <TagInput tags={knowledgePoints} onChange={setKnowledgePoints} placeholder="如：时态、定语从句（回车添加）" />
        </Field>

        <button
          type="submit"
          disabled={saving || (!questionText.trim() && questionImages.length === 0)}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {saving ? '保存中…' : '保存错题'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
