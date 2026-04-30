import { openDB, type IDBPDatabase } from 'idb';
import type { WrongQuestion, Word } from '../types';

const DB_NAME = 'english-learning';
const DB_VERSION = 1;

let db: IDBPDatabase;

export async function initDB() {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('wrongQuestions', { keyPath: 'id' });
      database.createObjectStore('vocabulary', { keyPath: 'id' });
    },
  });
}

function getDB() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

// Wrong Questions
export const getAllWrongQuestions = (): Promise<WrongQuestion[]> =>
  getDB().getAll('wrongQuestions');

export const addWrongQuestion = (q: WrongQuestion): Promise<string> =>
  getDB().add('wrongQuestions', q) as Promise<string>;

export const updateWrongQuestion = (q: WrongQuestion): Promise<string> =>
  getDB().put('wrongQuestions', q) as Promise<string>;

export const deleteWrongQuestion = (id: string): Promise<void> =>
  getDB().delete('wrongQuestions', id);

// Vocabulary
export const getAllWords = (): Promise<Word[]> =>
  getDB().getAll('vocabulary');

export const addWord = (word: Word): Promise<string> =>
  getDB().add('vocabulary', word) as Promise<string>;

export const updateWord = (word: Word): Promise<string> =>
  getDB().put('vocabulary', word) as Promise<string>;

export const deleteWord = (id: string): Promise<void> =>
  getDB().delete('vocabulary', id);
