/// <reference types="node" />
export const config = { runtime: 'edge' }

const SUBJECT_PROMPTS: Record<string, string> = {
  数学: '你是一位专业的高中数学教师，请针对以下薄弱知识点生成练习题。题目可以包含计算、证明分析或概念判断，以单选题形式呈现。',
  英语: '你是一位专业的高中英语教师，请针对以下薄弱知识点生成单选练习题，考查语法、词汇或阅读能力。',
  物理: '你是一位专业的高中物理教师，请针对以下薄弱知识点生成单选练习题，题目可包含物理量计算和概念理解。',
  化学: '你是一位专业的高中化学教师，请针对以下薄弱知识点生成单选练习题，考查化学反应、方程式或概念。',
  生物: '你是一位专业的高中生物教师，请针对以下薄弱知识点生成单选练习题，考查生命现象、遗传或生态等概念。',
  历史: '你是一位专业的高中历史教师，请针对以下薄弱知识点生成单选练习题，考查历史事件、人物和影响。',
  地理: '你是一位专业的高中地理教师，请针对以下薄弱知识点生成单选练习题，考查自然地理和人文地理知识。',
  政治: '你是一位专业的高中政治教师，请针对以下薄弱知识点生成单选练习题，考查政治、经济和哲学概念。',
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { knowledge_points = [], count = 5, subject = '自动' } = (await request.json()) as {
    knowledge_points?: string[]
    count?: number
    subject?: string
  }

  if (!knowledge_points.length) {
    return new Response(JSON.stringify({ error: '请选择至少一个知识点' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const n = Math.min(Math.max(count, 1), 10)
  const teacherIntro =
    SUBJECT_PROMPTS[subject] ??
    '你是一位专业教师，请根据以下薄弱知识点的学科特征生成对应的单选练习题。'

  const prompt = `${teacherIntro}

薄弱知识点：${knowledge_points.join('、')}

请生成 ${n} 道单选题，每题 4 个选项（A/B/C/D），难度适中，贴近高考题型。

严格返回如下 JSON 数组（不要有其他文字、不要 markdown 代码块）：
[
  {
    "question": "题目内容",
    "options": ["A. 内容", "B. 内容", "C. 内容", "D. 内容"],
    "correct": "A",
    "explanation": "解析（40字以内）",
    "knowledge_point": "对应知识点"
  }
]`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    return new Response(JSON.stringify({ error: await res.text() }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const text = data.choices[0].message.content

  let questions: unknown[]
  try {
    const match = text.match(/\[[\s\S]*\]/)
    questions = match ? JSON.parse(match[0]) : JSON.parse(text)
  } catch {
    questions = []
  }

  return new Response(JSON.stringify({ questions }), {
    headers: { 'content-type': 'application/json' },
  })
}
