import { useState, useEffect, useCallback } from 'react';
import { getAllWords, addWord, updateWord, deleteWord } from '../db';
import type { Word } from '../types';

export function useVocabulary() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllWords();
    all.sort((a, b) => b.createdAt - a.createdAt);
    setWords(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (w: Omit<Word, 'id' | 'createdAt' | 'mastered' | 'lastReviewedAt'>) => {
    const newWord: Word = {
      ...w,
      id: crypto.randomUUID(),
      mastered: false,
      createdAt: Date.now(),
      lastReviewedAt: null,
    };
    await addWord(newWord);
    await load();
  }, [load]);

  const update = useCallback(async (w: Word) => {
    await updateWord(w);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteWord(id);
    await load();
  }, [load]);

  return { words, loading, add, update, remove, reload: load };
}
