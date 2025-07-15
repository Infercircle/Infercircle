import { NextRequest, NextResponse } from 'next/server';
import { AIAgent } from '@/lib/aiAgent';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const agent = new AIAgent();
    const response = await agent.processQuery(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}