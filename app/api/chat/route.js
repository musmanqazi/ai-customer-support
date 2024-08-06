import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create an OpenAI instance with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to introduce a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to make a request to OpenAI API with retry logic
async function makeRequest(data, retries = 3) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the world series in 2020?' },
        { role: 'assistant', content: 'The Los Angeles Dodgers won the World Series in 2020.' },
        { role: 'user', content: 'Where was it played?' }
      ],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0].message.content;
  } catch (error) {
    if (error.code === 'rate_limit_reached' && retries > 0) {
      console.log(`Rate limit reached. Retrying in ${(4 - retries) * 5} seconds... (${retries} retries left)`);
      await delay((4 - retries) * 5000); // wait for 5, 10, 15 seconds before retrying
      return makeRequest(data, retries - 1);
    } else {
      throw error;
    }
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const response = await makeRequest(data);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
