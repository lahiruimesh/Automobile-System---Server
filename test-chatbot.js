// Test script for chatbot API endpoints
// Run this with: node test-chatbot.js

import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'http://localhost:5000';

// Helper function to make requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test functions
async function testChatbotStatus() {
  console.log('\n🧪 Testing Chatbot Status...');
  const result = await makeRequest('/chatbot/status');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.data?.configured) {
    console.log('✅ Chatbot is configured and ready!');
  } else {
    console.log('⚠️  Chatbot is not configured. Please add OPENAI_API_KEY to .env file');
  }
}

async function testChatWithoutAuth() {
  console.log('\n🧪 Testing Chat Without Authentication...');
  const result = await makeRequest('/chatbot/chat', 'POST', {
    message: 'Hello'
  });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 401) {
    console.log('✅ Authentication protection is working correctly!');
  } else {
    console.log('⚠️  Authentication should be required');
  }
}

async function testChatWithAuth(token) {
  console.log('\n🧪 Testing Chat With Authentication...');
  const result = await makeRequest('/chatbot/chat', 'POST', {
    message: 'What automobile services do you provide?',
    conversationHistory: []
  }, token);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.data?.success) {
    console.log('✅ Chat is working! AI Response received.');
  } else {
    console.log('❌ Chat failed:', result.data?.message);
  }
}

async function testClearConversation(token) {
  console.log('\n🧪 Testing Clear Conversation...');
  const result = await makeRequest('/chatbot/clear', 'POST', {}, token);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.data?.success) {
    console.log('✅ Clear conversation working!');
  } else {
    console.log('❌ Clear conversation failed');
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(50));
  console.log('🤖 AI Chatbot API Tests');
  console.log('='.repeat(50));

  // Test 1: Status check
  await testChatbotStatus();

  // Test 2: Chat without auth (should fail)
  await testChatWithoutAuth();

  // Test 3: Chat with auth (requires valid JWT token)
  const testToken = process.env.TEST_JWT_TOKEN;
  if (testToken) {
    await testChatWithAuth(testToken);
    await testClearConversation(testToken);
  } else {
    console.log('\n⚠️  Skipping authenticated tests. Add TEST_JWT_TOKEN to .env to test with authentication.');
    console.log('   Get a token by logging in through /auth/login endpoint');
  }

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
}

// Run tests
runTests().catch(console.error);
