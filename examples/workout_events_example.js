/**
 * RUNSTR DVM - Workout Events Example (NIP-101e)
 * 
 * This example demonstrates how to create and interact with 
 * NIP-101e workout events using the RUNSTR DVM
 */

const { relayInit, getEventHash, getSignature, generatePrivateKey, getPublicKey } = require('nostr-tools');
const fetch = require('node-fetch');
require('websocket-polyfill');

// API URL for accessing the DVM via HTTP
const API_URL = 'http://localhost:3000';

// Nostr relay URL for publishing events
const relayUrl = 'wss://relay.damus.io';

// Generate a keypair for this example
const privateKey = generatePrivateKey();
const publicKey = getPublicKey(privateKey);

async function main() {
  try {
    console.log('Running Workout Events Example...');

    // Connect to Nostr relay
    console.log(`Connecting to relay: ${relayUrl}`);
    const relay = relayInit(relayUrl);
    await relay.connect();

    relay.on('connect', async () => {
      console.log(`Connected to ${relayUrl}`);

      // Example 1: Create a Running Exercise Template
      console.log('\n=== Example 1: Create Running Exercise Template ===');
      const exerciseId = await createRunningExerciseTemplate(relay);

      // Example 2: Create a Running Workout
      console.log('\n=== Example 2: Create Running Workout Record ===');
      const workoutId = await createRunningWorkoutRecord(relay, exerciseId);
      
      // Wait a moment for events to propagate
      console.log('\nWaiting 5 seconds for events to propagate...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Example 3: Query workout templates via API
      console.log('\n=== Example 3: Query Workout Templates ===');
      const templates = await fetchWorkoutTemplates();
      console.log(`Found ${templates.templates.length} templates`);
      if (templates.templates.length > 0) {
        const template = templates.templates[0];
        console.log(`Title: ${template.title}`);
        console.log(`Description: ${template.description}`);
        console.log(`Format: ${template.format.flat().join(', ')}`);
      }

      // Example 4: Query workout records via API
      console.log('\n=== Example 4: Query Workout Records ===');
      const records = await fetchWorkoutRecords();
      console.log(`Found ${records.records.length} workout records`);
      if (records.records.length > 0) {
        const record = records.records[0];
        console.log(`Title: ${record.title}`);
        console.log(`Description: ${record.description}`);
        console.log(`Duration: ${formatDuration(record.duration)} seconds`);
        if (record.splits && record.splits.length > 0) {
          console.log(`Splits: ${record.splits.length}`);
          record.splits.forEach(split => {
            console.log(`  Split ${split.number}: ${split.distance}${split.unit} in ${split.time}`);
          });
        }
      }

      console.log('\nExample completed!');
      process.exit(0);
    });

    relay.on('error', () => {
      console.log(`Failed to connect to ${relayUrl}`);
      process.exit(1);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

/**
 * Create a Running Exercise Template (NIP-101e kind 33401)
 */
async function createRunningExerciseTemplate(relay) {
  // Generate a unique UUID for this template
  const uuid = generateUUID();

  // Create exercise template event
  const event = {
    kind: 33401, // Exercise Template
    pubkey: publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', uuid],
      ['title', 'Easy Run'],
      ['format', 'distance', 'duration', 'pace', 'gps_data', 'elevation_gain'],
      ['format_units', 'km', 'seconds', 'min/km', 'polyline', 'm'],
      ['equipment', 'cardio'],
      ['difficulty', 'beginner'],
      ['t', 'running'],
      ['t', 'cardio']
    ],
    content: 'Easy pace run on flat terrain. Focus on maintaining consistent effort.'
  };

  // Sign and publish
  event.id = getEventHash(event);
  event.sig = getSignature(event, privateKey);
  await relay.publish(event);

  console.log(`Published running exercise template: ${event.id}`);
  return event.id;
}

/**
 * Create a Running Workout Record (NIP-101e kind 1301)
 */
async function createRunningWorkoutRecord(relay, exerciseId) {
  // Generate a unique UUID for this workout record
  const uuid = generateUUID();
  
  // Current timestamp
  const now = Math.floor(Date.now() / 1000);
  // Workout started 30 minutes ago
  const startTime = now - 1800;
  
  // Create workout record event
  const event = {
    kind: 1301, // Workout Record
    pubkey: publicKey,
    created_at: now,
    tags: [
      ['d', uuid],
      ['title', 'Morning 5K'],
      ['type', 'cardio'],
      ['start', startTime.toString()],
      ['end', now.toString()],
      ['exercise', `33401:${publicKey}:${exerciseId}`, '', '5', '1800', '4:52', 'encoded_polyline_would_go_here', '125'],
      ['cadence_avg', '172', 'spm'],
      ['heart_rate_avg', '142', 'bpm'],
      ['weather_temp', '18', 'c'],
      ['weather_humidity', '65', '%'],
      ['weather_condition', 'partly_cloudy'],
      ['split', '1', '1000', 'm', '3:45', '155', 'bpm'],
      ['split', '2', '1000', 'm', '3:52', '158', 'bpm'],
      ['split', '3', '1000', 'm', '4:05', '162', 'bpm'],
      ['split', '4', '1000', 'm', '3:59', '165', 'bpm'],
      ['split', '5', '1000', 'm', '3:40', '168', 'bpm'],
      ['completed', 'true'],
      ['t', 'running']
    ],
    content: 'Morning run felt great. Perfect weather conditions.'
  };

  // Sign and publish
  event.id = getEventHash(event);
  event.sig = getSignature(event, privateKey);
  await relay.publish(event);

  console.log(`Published running workout record: ${event.id}`);
  return event.id;
}

/**
 * Fetch workout templates via API
 */
async function fetchWorkoutTemplates() {
  try {
    const response = await fetch(`${API_URL}/api/workout_templates`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching workout templates:', error);
    return { templates: [], total: { exercise: 0, workout: 0 } };
  }
}

/**
 * Fetch workout records via API
 */
async function fetchWorkoutRecords() {
  try {
    const response = await fetch(`${API_URL}/api/workout_records`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching workout records:', error);
    return { records: [], total: 0 };
  }
}

/**
 * Format duration in seconds to a readable format
 */
function formatDuration(seconds) {
  if (!seconds) return '0';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

/**
 * Generate a simple UUID-like string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

main().catch(console.error); 