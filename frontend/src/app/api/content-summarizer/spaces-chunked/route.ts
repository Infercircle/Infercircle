import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const HELPER_APIS_URL = process.env.NEXT_PUBLIC_HELPER_APIS_URL;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { space_url, is_ended = false } = await request.json();

    if (!space_url) {
      return NextResponse.json({ error: 'space_url is required' }, { status: 400 });
    }

    if (!HELPER_APIS_URL) {
      return NextResponse.json({ error: 'Helper API URL not configured' }, { status: 500 });
    }

    // OPENROUTER_API_KEY may be absent in prod; we'll still return transcript and mark AI unavailable

    console.log('🚀 Starting Twitter Space chunked processing...');
    console.log('📡 Space URL:', space_url);
    console.log('📡 Helper API URL:', HELPER_APIS_URL);
    
    // Call the new chunked endpoint
    console.log('⏳ Starting chunked download and transcription...');
    const chunkedResponse = await axios.post(`${HELPER_APIS_URL}/download-and-transcribe-runpod-chunked`, {
      space_url,
      is_ended,
      auto_transcribe: true 
    }, {
      timeout: 1800000, // 30 minutes timeout
      headers: { 'Content-Type': 'application/json' }
    });

    const responseData = chunkedResponse.data as any;
    console.log('✅ Chunked processing completed');
    console.log('📝 Response data type:', typeof responseData);
    console.log('📝 Response data keys:', Object.keys(responseData || {}));
    
    // Extract transcript from the response object
    const transcript = responseData?.formatted_transcript;
    console.log('📝 Transcript data type:', typeof transcript);
    console.log('📝 Transcript length:', transcript?.length || 'undefined', 'characters');
    
    // Check if transcript is valid
    if (!transcript || typeof transcript !== 'string') {
      console.error('❌ Invalid transcript received:', transcript);
      return NextResponse.json({ 
        error: 'Invalid transcript received from download service' 
      }, { status: 500 });
    }

    // Clean and escape the transcript to prevent JSON parsing errors
    const cleanedTranscript = transcript
      .replace(/"/g, '\\"')  // Escape double quotes
      .replace(/\n/g, '\\n')  // Escape newlines
      .replace(/\r/g, '\\r')  // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    // Send transcript to AI for summarization if configured
    console.log('🤖 Sending transcript to AI for summarization...');
    let summary: string | null = null;
    let aiUnavailable = false;
    if (!OPENROUTER_API_KEY) {
      aiUnavailable = true;
      console.warn('OPENROUTER_API_KEY not set; returning transcript without summary');
    } else {
      try {
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'deepseek/deepseek-chat-v3.1:free',
          messages: [
            {
              role: 'system',
              content:
                "You are a skilled crypto analyst and content summarizer.\n\nSummarize the following Twitter Space or Twitter Broadcast into a clear, insightful, and structured recap for a Web3-native audience. The audience includes DeGen's, builders, founders, investors, and analysts who missed the live session.\n\nInstructions:\n\n- Start with a short intro paragraph that includes:\n  - The title of the session (if mentioned)\n  - The hosts and speakers\n  - Any useful context (e.g. technical issues, change of plans, tone of session. Not compulsory unless mentioned)\n  \n- Then use markdown formatting with clear section headings and bullet points.\n\n- Add relevant emojis to highlight important insights if need be (🧠 = takeaways, ⚠️ = risks, 📈 = trends).\n\n- Keep the tone professional yet reader-friendly — smart, focused, and digestible.\n\n- Organize the rest of the summary under these sections:\n\n  1. Key Insights\n  2. Terminology Explained (if new terms or concepts were introduced)\n  3. Problems Identified or is being solved\n  4. Proposed Solutions or Ideas\n  5. What's Coming Next (future plans, updates, or speculation)\n  6. Final Takeaways\n\nYour goal is to educate Web3-native readers who missed the live session."
            },
            {
              role: 'user',
              content: cleanedTranscript
            }
          ]
        }, {
          timeout: 300000,
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://www.sitename.com',
            'X-Title': 'SiteName',
            'Content-Type': 'application/json',
          }
        });
  
        console.log('AI response received successfully');
        summary = (aiResponse.data as any).choices?.[0]?.message?.content || null;
        if (!summary) {
          aiUnavailable = true;
          console.warn('AI returned empty summary; proceeding without summary');
        }
      } catch (error) {
        aiUnavailable = true;
        console.error('AI service error:', error);
      }
    }

    console.log('🎉 Chunked space summarization completed successfully!');
    if (summary) {
      console.log('📊 Summary length:', summary.length, 'characters');
    } else {
      console.log('📊 No AI summary generated');
    }
    
    return NextResponse.json({
      summary: summary || '',
      transcript,
      space_id: responseData?.space_id,
      download: responseData?.download,
      metadata: { ...(responseData?.metadata || {}), aiUnavailable },
      success: true
    });

  } catch (error) {
    console.error('Chunked summarize error:', error);
    return NextResponse.json({ error: 'Failed to process space with chunked processing' }, { status: 500 });
  }
}
