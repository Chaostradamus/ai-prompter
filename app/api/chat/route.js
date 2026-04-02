
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY in .env.local');
      return NextResponse.json(
        { error: 'Missing API key. Please add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Format conversation for Gemini
    const lastMessage = messages[messages.length - 1].content;
    
    const result = await model.generateContent(lastMessage);
    const response = result.response.text();

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}