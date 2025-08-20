#!/usr/bin/env node

/**
 * Test script for Content Summarizer API endpoints
 * Run with: node test-content-summarizer.js
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, payload, name) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`📡 Endpoint: ${endpoint}`);
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Response:`, JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log(`❌ Error: ${errorData}`);
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Content Summarizer API Tests');
  console.log('================================');
  
  // Test Status endpoint first
  console.log('\n🧪 Testing Status Check...');
  try {
    const statusResponse = await fetch(`${BASE_URL}/api/content-summarizer/status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Status Check:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('❌ Status Check Failed:', statusResponse.status);
    }
  } catch (error) {
    console.log('💥 Status Check Error:', error.message);
  }
  
  // Test Spaces API
  await testEndpoint(
    '/api/content-summarizer/spaces',
    {
      space_url: 'https://twitter.com/i/spaces/1a2b3c4d5e6f',
      is_ended: false
    },
    'Twitter Spaces Summarization'
  );
  
  // Test Broadcasts API
  await testEndpoint(
    '/api/content-summarizer/broadcasts',
    {
      broadcast_url: 'https://x.com/i/broadcasts/1a2b3c4d5e6f'
    },
    'Twitter Broadcasts Summarization'
  );
  
  console.log('\n✨ Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
