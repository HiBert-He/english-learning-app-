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

  const { english = '', chinese = '' } = (await request.json()) as {
    english?: string
    chinese?: string
  }

  if (!english.trim()) {
    return new Response(JSON.stringify({ error: '缺少单词' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const prompt = `你是一位英语词汇记忆教练。请帮助学生记住下面这个单词。

单词：${english}
释义：${chinese || '（未提供，请自行判断）'}

严格返回如下 JSON（不要有其他文字、不要 markdown 代码块）：
{
  "mnemonic": "记忆技巧，可用词根词缀、谐音、联想等方法，30字以内",
  "example": "一句包含该单词的实用英文例句",
  "example_translation": "例句的中文翻译",
  "related": ["1-3个形近词、同根词或同义词"]
}`

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
    result = { mnemonic: text, example: '', example_translation: '', related: [] }
  }

  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}
