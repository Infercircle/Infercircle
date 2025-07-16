// Test script to verify conversation context functionality
const baseURL = 'http://localhost:3000';

async function testConversationContext() {
  console.log('Testing conversation context...');
  
  try {
    // First message - introduce yourself
    const firstMessage = 'Hi, my name is John and I love Bitcoin.';
    const firstResponse = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: firstMessage,
        conversationHistory: []
      }),
    });
    
    const firstResult = await firstResponse.json();
    console.log('First message:', firstMessage);
    console.log('AI response:', firstResult.response);
    console.log('---');
    
    // Second message - ask about your name (should remember)
    const conversationHistory = [
      { role: 'user', content: firstMessage },
      { role: 'assistant', content: firstResult.response }
    ];
    
    const secondMessage = 'What is my name?';
    const secondResponse = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: secondMessage,
        conversationHistory
      }),
    });
    
    const secondResult = await secondResponse.json();
    console.log('Second message:', secondMessage);
    console.log('AI response:', secondResult.response);
    console.log('---');
    
    // Third message - ask about what you love (should remember)
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: secondMessage },
      { role: 'assistant', content: secondResult.response }
    ];
    
    const thirdMessage = 'What cryptocurrency do I love?';
    const thirdResponse = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: thirdMessage,
        conversationHistory: updatedHistory
      }),
    });
    
    const thirdResult = await thirdResponse.json();
    console.log('Third message:', thirdMessage);
    console.log('AI response:', thirdResult.response);
    
  } catch (error) {
    console.error('Error testing conversation context:', error);
  }
}

// Run the test
testConversationContext();
