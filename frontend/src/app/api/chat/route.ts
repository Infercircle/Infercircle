import { NextRequest, NextResponse } from 'next/server';
import { AIAgent } from '@/lib/agent/aiAgent';

let agent: AIAgent | null = null;

export async function initAgent(): Promise<AIAgent> {
  if (!agent) {
    agent = new AIAgent("", "gemini-2.0-flash-lite");
    await agent.initializeAgent();
  }
  return agent;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const agent = await initAgent();
    const response = await agent.processMessage(message);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
