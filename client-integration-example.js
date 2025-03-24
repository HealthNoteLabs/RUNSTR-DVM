/**
 * RUNSTR DVM - Nostr Client Integration Example
 * 
 * This example demonstrates how to integrate the RUNSTR DVM
 * into a Nostr client application.
 */

// For node-fetch compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const DVM_API_URL = 'http://localhost:3000';
const DVM_PUBKEY = 'replace_with_your_dvm_pubkey'; // Get this from your DVM console output

/**
 * Example 1: Simple API Integration
 * 
 * This is the easiest way to integrate with the DVM
 * directly from your client-side JavaScript.
 */
class RunstrDvmClient {
  constructor(apiUrl = DVM_API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Get a feed of running-related notes
   */
  async getRunningFeed(limit = 20, since = 0) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/running_feed?limit=${limit}&since=${since}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch running feed: ${response.status}`);
      }
      const data = await response.json();
      return data.result.feed;
    } catch (error) {
      console.error('Error fetching running feed:', error);
      throw error;
    }
  }

  /**
   * Parse running information from text
   */
  async parseRunningNote(content) {
    try {
      const response = await fetch(`${this.apiUrl}/api/running_notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        throw new Error(`Failed to parse note: ${response.status}`);
      }
      const data = await response.json();
      return data.result.extractedData;
    } catch (error) {
      console.error('Error parsing running note:', error);
      throw error;
    }
  }

  /**
   * Get workout templates
   */
  async getWorkoutTemplates(limit = 20, type = null) {
    try {
      let url = `${this.apiUrl}/api/workout_templates?limit=${limit}`;
      if (type) url += `&type=${type}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch workout templates: ${response.status}`);
      }
      const data = await response.json();
      return data.result.templates;
    } catch (error) {
      console.error('Error fetching workout templates:', error);
      throw error;
    }
  }

  /**
   * Get workout records
   */
  async getWorkoutRecords(limit = 20, completed = null) {
    try {
      let url = `${this.apiUrl}/api/workout_records?limit=${limit}`;
      if (completed !== null) url += `&completed=${completed}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch workout records: ${response.status}`);
      }
      const data = await response.json();
      return data.result.records;
    } catch (error) {
      console.error('Error fetching workout records:', error);
      throw error;
    }
  }
}

/**
 * Example 2: Nostr Protocol Integration (NIP-90)
 * 
 * This uses the Nostr protocol directly to communicate with the DVM.
 * In a real application, you would use a Nostr library like nostr-tools.
 */
class NostrDvmIntegration {
  constructor() {
    // In a real application, this would use your Nostr client's relay connections
    // and key management rather than creating new instances
    this.relays = ['wss://relay.damus.io'];
    this.dvmPubkey = DVM_PUBKEY;
  }

  /**
   * Send a task to the DVM using NIP-90
   * 
   * @param {string} task - The task name to run
   * @param {Object} params - Parameters for the task
   * @returns {Promise<Object>} - The task result
   */
  async sendDvmTask(task, params, privateKey) {
    // This is a simplified example - in a real client you would:
    // 1. Use your existing relay connections
    // 2. Use your client's key management
    // 3. Handle subscription properly
    
    // Example of what the code would look like:
    /*
    const { relayInit, getEventHash, getSignature, getPublicKey } = require('nostr-tools');
    const relay = relayInit(this.relays[0]);
    await relay.connect();
    
    const event = {
      kind: 23194, // NIP-90 Task Request
      pubkey: getPublicKey(privateKey),
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.dvmPubkey]],
      content: JSON.stringify({ task, params })
    };
    
    event.id = getEventHash(event);
    event.sig = getSignature(event, privateKey);
    
    await relay.publish(event);
    
    // Set up subscription to wait for result
    return new Promise((resolve) => {
      const sub = relay.sub([{ kinds: [23195], '#e': [event.id] }]);
      
      sub.on('event', (resultEvent) => {
        const result = JSON.parse(resultEvent.content);
        resolve(result);
        sub.unsub();
      });
    });
    */
    
    console.log(`Would send NIP-90 task "${task}" to DVM with params:`, params);
    return { success: true, result: { simulated: true } };
  }
}

/**
 * Example 3: NIP-101e Publishing Functions
 * 
 * These functions help your client publish workout events
 */
class WorkoutEventPublisher {
  /**
   * Create a running exercise template
   * 
   * @param {Object} templateData - Exercise template data
   * @param {string} privateKey - Nostr private key
   */
  async publishExerciseTemplate(templateData, privateKey) {
    const { title, description, formats, units, difficulty } = templateData;
    
    // In a real implementation, this would:
    // 1. Create a kind 33401 event
    // 2. Sign it with the private key 
    // 3. Publish to relays
    
    console.log(`Would publish exercise template "${title}" to Nostr`);
    return { success: true, id: 'simulated_event_id' };
  }
  
  /**
   * Record a completed run
   * 
   * @param {Object} runData - Run workout data 
   * @param {string} privateKey - Nostr private key
   */
  async publishRunRecord(runData, privateKey) {
    const { 
      title, description, distance, duration, 
      pace, elevation, heartRate, splits 
    } = runData;
    
    // In a real implementation, this would:
    // 1. Create a kind 1301 event with appropriate tags
    // 2. Sign it with the private key
    // 3. Publish to relays
    
    console.log(`Would publish run record "${title}" to Nostr`);
    return { success: true, id: 'simulated_event_id' };
  }
}

/**
 * Usage example in a Nostr client
 */
async function clientIntegrationExample() {
  console.log('RUNSTR DVM Client Integration Example');
  
  // Example 1: Using the API client
  console.log('\n=== Example 1: API Client ===');
  try {
    const dvmClient = new RunstrDvmClient();
    
    // Auto-detect running data from user input
    const userPost = 'Just ran 10K in 48:30! New PB! #running';
    console.log(`User post: "${userPost}"`);
    
    const extractedData = await dvmClient.parseRunningNote(userPost);
    console.log('Extracted running data:', extractedData);
    
    if (extractedData.distance) {
      console.log(`\nWow! ${extractedData.distance.value}${extractedData.distance.unit} is impressive!`);
    }
    
    if (extractedData.time) {
      console.log(`Your time of ${extractedData.time.formatted} is great!`);
    }
    
    if (extractedData.calculatedPace) {
      console.log(`You maintained a pace of ${extractedData.calculatedPace.formatted}!`);
    }
    
    // Show recent running activity feed
    console.log('\nRecent running activity:');
    const feed = await dvmClient.getRunningFeed(3);
    feed.forEach((note, i) => {
      console.log(`${i+1}. ${note.content.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('API client example failed:', error.message);
  }
  
  // Example 2: Using NIP-90 directly (simulated)
  console.log('\n=== Example 2: Nostr Protocol Integration ===');
  try {
    const nostrIntegration = new NostrDvmIntegration();
    
    // Simulated NIP-90 task request
    const result = await nostrIntegration.sendDvmTask(
      'running_notes', 
      { content: 'Ran 5 miles at 7:30 pace' },
      'simulated_private_key'
    );
    
    console.log('Task result:', result);
    
  } catch (error) {
    console.error('Nostr integration example failed:', error.message);
  }
  
  // Example 3: Publishing workout events (simulated)
  console.log('\n=== Example 3: Publishing Workout Events ===');
  try {
    const publisher = new WorkoutEventPublisher();
    
    // Create and publish a run record
    const result = await publisher.publishRunRecord({
      title: 'Morning 5K',
      description: 'Easy run before work',
      distance: { value: 5, unit: 'km' },
      duration: 1500, // 25 minutes
      pace: '5:00/km',
      elevation: 50,
      heartRate: 145,
      splits: [
        { distance: 1, unit: 'km', time: '4:55', heartRate: 140 },
        { distance: 1, unit: 'km', time: '5:05', heartRate: 145 },
        { distance: 1, unit: 'km', time: '4:50', heartRate: 150 },
        { distance: 1, unit: 'km', time: '5:10', heartRate: 145 },
        { distance: 1, unit: 'km', time: '4:45', heartRate: 155 }
      ]
    }, 'simulated_private_key');
    
    console.log('Publication result:', result);
    
  } catch (error) {
    console.error('Workout event example failed:', error.message);
  }
  
  console.log('\nIntegration examples completed');
}

// Run the example
clientIntegrationExample().catch(console.error); 