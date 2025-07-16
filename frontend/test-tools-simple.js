const { AIAgent } = require('./src/lib/aiAgent.ts');

async function testTools() {
  console.log('Testing AIAgent tools...');
  
  const agent = new AIAgent();
  
  try {
    const response = await agent.processQuery("How is Solana doing?");
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

testTools();
