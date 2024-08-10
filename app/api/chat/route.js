import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  const { messages, apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  const openai = new OpenAI({
    apiKey: apiKey
  });

  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-3.5-turbo',
    stream: true
  });

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