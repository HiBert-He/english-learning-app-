import { useState, useEffect, useCallback } from 'react';
import {
  getAllWrongQuestions,
  addWrongQuestion,
  updateWrongQuestion,
  deleteWrongQuestion,
} from '../db';
import type { WrongQuestion } from '../types';

export function useWrongQuestions() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllWrongQuestions();
    all.sort((a, b) => b.createdAt - a.createdAt);
    setQuestions(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (q: Omit<WrongQuestion, 'id' | 'createdAt' | 'updatedAt' | 'corrected'>) => {
    const now = Date.now();
    const newQ: WrongQuestion = {
      ...q,
      id: crypto.randomUUID(),
      corrected: false,
      createdAt: now,
      updatedAt: now,
    };
    await addWrongQuestion(newQ);
    await load();
    return newQ.id;
  }, [load]);

  const update = useCallback(async (q: WrongQuestion) => {
    await updateWrongQuestion({ ...q, updatedAt: Date.now() });
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteWrongQuestion(id);
    await load();
  }, [load]);

  return { questions, loading, add, update, remove, reload: load };
}
