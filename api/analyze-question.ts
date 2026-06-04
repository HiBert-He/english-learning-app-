/// <reference types="node" />
export const config = { runtime: 'edge' }

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

  const { question_text = '', correct_answer = '', my_answer = '' } =
    (await request.json()) as {
      question_text?: string
      question_images?: string[]
      correct_answer?: string
      my_answer?: string
    }

  if (!question_text.trim()) {
    return new Response(
      JSON.stringify({
        knowledge_points: [],
        question_text_ocr: '',
        error_analysis: '',
        suggestions: 'DeepSeek 暂不支持图片识别，请手动输入题目文字后再分析',
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  }

  const prompt = `你是一位专业教师。请分析以下错题，自动判断学科，返回 JSON 结果。

题目：${question_text}
学生答案：${my_answer || '（未填写）'}
正确答案：${correct_answer || '（未填写）'}

严格返回如下 JSON（不要有其他文字、不要 markdown 代码块）：
{
  "subject": "判断出的学科，如数学、英语、物理等",
  "knowledge_points": ["知识点1", "知识点2"],
  "question_text_ocr": "",
  "error_analysis": "学生错误原因简析（50字以内）",
  "suggestions": "针对性建议（30字以内）"
}

知识点应具体且准确，例如数学填"二次函数"而非"函数"，英语填"定语从句"而非"语法"，2-4个。`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 512,
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

  let result: unknown
  try {
    const match = text.match(/\{[\s\S]*\}/)
    result = match ? JSON.parse(match[0]) : JSON.parse(text)
  } catch {
    result = { knowledge_points: [], error_analysis: text, suggestions: '', question_text_ocr: '', subject: '' }
  }

  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}
