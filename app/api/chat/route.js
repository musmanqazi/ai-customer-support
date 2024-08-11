import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  const openai = new OpenAI()
  const data = await req.json()

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'I can help you with anything!' },
      { role: 'user', content: 'Who won the world series in 2020?' },
      { role: 'assistant', content: 'The Los Angeles Dodgers won the World Series in 2020.' },
      ...data
    ],
    model: 'gpt-3.5-turbo',
    stream: true
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try{
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta.content
          if (content) {
              const text = encoder.encode(content)
              controller.enqueue(text)
            }
          }
      } catch(err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })
  return new NextResponse(stream)
}
