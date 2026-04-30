import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWrongQuestions } from '../hooks/useWrongQuestions';
import ImageUploader from '../components/ImageUploader';
import TagInput from '../components/TagInput';

export default function WrongQuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { questions, update, remove } = useWrongQuestions();
  const question = questions.find((q) => q.id === id);

  const [editing, setEditing] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    if (!question) return;
    setQuestionText(question.questionText);
    setQuestionImages(question.questionImages);
    setCorrectAnswer(question.correctAnswer);
    setMyAnswer(question.myAnswer);
    setReason(question.reason);
    setKnowledgePoints(question.knowledgePoints);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!question) return;
    setSaving(true);
    await update({
      ...question,
      questionText,
      questionImages,
      correctAnswer,
      myAnswer,
      reason,
      knowledgePoints,
    });
    setSaving(false);
    setEditing(false);
  };

  const toggleCorrected = async () => {
    if (!question) return;
    await update({ ...question, corrected: !question.corrected });
  };

  const handleDelete = async () => {
    if (!question) return;
    if (window.confirm('确认删除这道错题？')) {
      await remove(question.id);
      navigate('/wrong-questions');
    }
  };

  if (!question) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400">题目不存在</p>
    </div>
  );

  return (
    <div className="pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">错题详情</h1>
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <button onClick={startEditing} className="text-blue-600 text-sm font-medium">编辑</button>
            <button onClick={handleDelete} className="text-red-500 text-sm font-medium">删除</button>
          </div>
        )}
      </header>

      <div className="px-4 pt-5 space-y-5">
        {/* Correction status */}
        <button
          onClick={toggleCorrected}
          className={`w-full py-2.5 rounded-2xl font-semibold text-sm transition-colors ${
            question.corrected
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {question.corrected ? '✓ 已订正 — 点击撤销' : '○ 待订正 — 点击标记已订正'}
        </button>

        {editing ? (
          /* Edit Mode */
          <div className="space-y-5">
            <Field label="题目内容">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="mt-2">
                <ImageUploader images={questionImages} onChange={setQuestionImages} />
              </div>
            </Field>
            <Field label="正确答案">
              <textarea value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </Field>
            <Field label="我的答案">
              <textarea value={myAnswer} onChange={(e) => setMyAnswer(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </Field>
            <Field label="错误原因">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </Field>
            <Field label="知识点标签">
              <TagInput tags={knowledgePoints} onChange={setKnowledgePoints} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-2xl font-semibold text-sm">取消</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold text-sm disabled:opacity-40">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            <Section title="题目">
              {question.questionImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {question.questionImages.map((src, i) => (
                    <img key={i} src={src} alt="" className="max-w-full rounded-xl border border-gray-200" />
                  ))}
                </div>
              )}
              {question.questionText && <p className="text-gray-700 text-sm whitespace-pre-wrap">{question.questionText}</p>}
            </Section>

            {question.correctAnswer && (
              <Section title="正确答案">
                <p className="text-green-700 text-sm whitespace-pre-wrap bg-green-50 rounded-xl p-3">{question.correctAnswer}</p>
              </Section>
            )}

            {question.myAnswer && (
              <Section title="我的答案">
                <p className="text-red-600 text-sm whitespace-pre-wrap bg-red-50 rounded-xl p-3">{question.myAnswer}</p>
              </Section>
            )}

            {question.reason && (
              <Section title="错误原因">
                <p className="text-gray-700 text-sm whitespace-pre-wrap bg-amber-50 rounded-xl p-3">{question.reason}</p>
              </Section>
            )}

            {question.knowledgePoints.length > 0 && (
              <Section title="知识点">
                <div className="flex flex-wrap gap-1.5">
                  {question.knowledgePoints.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">{tag}</span>
                  ))}
                </div>
              </Section>
            )}

            <p className="text-xs text-gray-400 text-right pt-2">
              添加于 {new Date(question.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        )}
      </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}
