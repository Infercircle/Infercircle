// Test script to debug AI agent
const { AIAgent } = require('./src/lib/aiAgent.ts');

async function testAI() {
  try {
    console.log('Testing AI agent...');
    const agent = new AIAgent();
    const response = await agent.processQuery('What is Bitcoin?');
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAI();
