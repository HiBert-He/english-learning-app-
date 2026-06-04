export interface WrongQuestion {
  id: string
  user_id: string
  question_text: string
  question_images: string[]
  correct_answer: string
  correct_answer_images: string[]
  my_answer: string
  reason: string
  knowledge_points: string[]
  corrected: boolean
  teacher_comment: string | null
  teacher_answer_images: string[]
  teacher_id: string | null
  teacher_commented_at: string | null
  created_at: string
  updated_at: string
}

export interface Word {
  id: string
  user_id: string
  english: string
  chinese: string
  example: string
  mastered: boolean
  last_reviewed_at: string | null
  created_at: string
}

export interface Profile {
  id: string
  name: string
  role: 'student' | 'teacher'
  created_at: string
}

export interface Class {
  id: string
  name: string
  teacher_id: string
  invite_code: string
  created_at: string
}

export interface Enrollment {
  id: string
  class_id: string
  student_id: string
  joined_at: string
  profiles?: Profile
}

export interface PracticeQuestion {
  question: string
  options: string[]   // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correct: string     // "A" | "B" | "C" | "D"
  explanation: string
  knowledge_point?: string
}
