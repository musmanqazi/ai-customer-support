import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const openai = new OpenAI();
    const data = await req.json();

    const completion = await openai.chat.completions.create({
      messages: data,
      model: 'gpt-3.5-turbo',
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error('Error during streaming:', err);
          const errorText = encoder.encode(`An error occurred: ${err.message}. The chatbot is going offline.`);
          controller.enqueue(errorText);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error in route.js:', error);

    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const errorText = encoder.encode(`An error occurred: ${error.message}. The chatbot is going offline.`);
        controller.enqueue(errorText);
        controller.close();
      }
    });

    return new NextResponse(errorStream, { status: 200 });
  }
}
