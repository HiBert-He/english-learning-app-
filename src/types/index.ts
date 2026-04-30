export interface WrongQuestion {
  id: string;
  questionText: string;
  questionImages: string[]; // base64 data URLs
  correctAnswer: string;
  myAnswer: string;
  reason: string;
  knowledgePoints: string[];
  corrected: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Word {
  id: string;
  english: string;
  chinese: string;
  example: string;
  mastered: boolean;
  createdAt: number;
  lastReviewedAt: number | null;
}
