/**
 * RUNSTR DVM - Simple Test Script
 * 
 * This script tests if the DVM server is running and verifies basic functionality
 */

// For node-fetch v2 compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000';

async function testDVM() {
  console.log('Testing RUNSTR DVM...');
  
  try {
    // Test 1: Health check
    console.log('\n=== Test 1: Health Check ===');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    console.log('Health check successful:', healthData);
    
    // Test 2: API info
    console.log('\n=== Test 2: API Info ===');
    const infoResponse = await fetch(API_URL);
    if (!infoResponse.ok) {
      throw new Error(`API info request failed: ${infoResponse.status}`);
    }
    const infoData = await infoResponse.json();
    console.log('API info:', infoData);
    console.log('Available tasks:');
    infoData.tasks.forEach(task => {
      console.log(`- ${task.name}: ${task.description}`);
    });
    
    // Test 3: Running notes parser
    console.log('\n=== Test 3: Running Notes Parser ===');
    const testNote = 'Just ran 5km in 25:30 with 150m elevation. Felt great!';
    console.log(`Testing note parsing with: "${testNote}"`);
    
    const parseResponse = await fetch(`${API_URL}/api/running_notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testNote })
    });
    
    if (!parseResponse.ok) {
      throw new Error(`Parse request failed: ${parseResponse.status}`);
    }
    
    const parseResult = await parseResponse.json();
    console.log('Parsed result:', JSON.stringify(parseResult, null, 2));
    
    // Test 4: Check running feed
    console.log('\n=== Test 4: Running Feed ===');
    const feedResponse = await fetch(`${API_URL}/api/running_feed?limit=5`);
    if (!feedResponse.ok) {
      throw new Error(`Feed request failed: ${feedResponse.status}`);
    }
    const feedData = await feedResponse.json();
    console.log(`Got ${feedData.result.feed.length} items in feed`);
    console.log('Total items in feed:', feedData.result.total);
    
    console.log('\nAll tests completed successfully!');
    console.log('DVM is up and running correctly.');
    
  } catch (error) {
    console.error('Error testing DVM:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the DVM server is running with "npm start"');
    console.log('2. Check that the server is running on the correct port (default: 3000)');
    console.log('3. Look for error messages in the server console');
  }
}

testDVM().catch(console.error); 