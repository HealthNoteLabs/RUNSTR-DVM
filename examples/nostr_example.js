/**
 * RUNSTR DVM Nostr Example
 * 
 * This example demonstrates how to interact with the RUNSTR DVM
 * using the Nostr protocol (NIP-90).
 */

const { relayInit, getEventHash, getSignature, generatePrivateKey, getPublicKey } = require('nostr-tools');
require('websocket-polyfill');

// The Nostr public key of the RUNSTR DVM
// In a real scenario, you would discover this by querying for kind 31990 events
const DVM_PUBLIC_KEY = 'replace_with_your_dvm_public_key';

// Client Configuration
const clientPrivateKey = generatePrivateKey();
const clientPublicKey = getPublicKey(clientPrivateKey);
const relayUrl = 'wss://relay.damus.io';

async function main() {
  try {
    console.log('Connecting to relay...');
    const relay = relayInit(relayUrl);
    await relay.connect();
    
    relay.on('connect', async () => {
      console.log(`Connected to ${relayUrl}`);
      
      // Example 1: Parse a running note using DVM task
      console.log('\n=== Example 1: Direct DVM Task Request ===');
      await sendRunningNotesTask(relay, {
        content: "Just finished a hilly 10K run in 52:15. Pace was around 5:13/km with 200m elevation gain. Weather was sunny and warm. Felt strong!"
      });
      
      // Example 2: Generate activity summary (in a real application, you would have already parsed notes)
      console.log('\n=== Example 2: Activity Summary Task Request ===');
      await sendActivitySummaryTask(relay, {
        activities: [
          {
            timestamp: '2023-02-05T08:30:00Z',
            extractedData: {
              distance: { value: 5, unit: 'km' },
              time: { 
                hours: 0, 
                minutes: 25, 
                seconds: 30, 
                totalSeconds: 1530,
                formatted: '00:25:30'
              }
            }
          },
          {
            timestamp: '2023-02-07T09:15:00Z',
            extractedData: {
              distance: { value: 8, unit: 'km' },
              time: { 
                hours: 0, 
                minutes: 40, 
                seconds: 45, 
                totalSeconds: 2445,
                formatted: '00:40:45'
              }
            }
          },
          {
            timestamp: '2023-02-10T07:45:00Z',
            extractedData: {
              distance: { value: 10, unit: 'km' },
              time: { 
                hours: 0, 
                minutes: 50, 
                seconds: 20, 
                totalSeconds: 3020,
                formatted: '00:50:20'
              }
            }
          }
        ]
      });
      
      // Example 3: Post a note with a running hashtag
      console.log('\n=== Example 3: Posting a Note with Running Hashtag ===');
      await postRunningNote(relay, "Completed my morning 5K in 22:30 today. Shaved 30 seconds off my previous best time! Feeling great. #running");
    });
    
    // Listen for task results and replies
    listenForResults(relay);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function sendRunningNotesTask(relay, params) {
  const taskRequest = {
    task: 'running_notes',
    params
  };
  
  await sendTaskRequest(relay, taskRequest);
}

async function sendActivitySummaryTask(relay, params) {
  const taskRequest = {
    task: 'activity_summary',
    params
  };
  
  await sendTaskRequest(relay, taskRequest);
}

async function sendTaskRequest(relay, taskRequest) {
  const event = {
    kind: 23194, // NIP-90 Task Request
    pubkey: clientPublicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', DVM_PUBLIC_KEY]
    ],
    content: JSON.stringify(taskRequest)
  };
  
  event.id = getEventHash(event);
  event.sig = getSignature(event, clientPrivateKey);
  
  console.log(`Sending ${taskRequest.task} task request...`);
  await relay.publish(event);
  console.log(`Task request sent with ID: ${event.id}`);
  return event.id;
}

async function postRunningNote(relay, content) {
  const event = {
    kind: 1, // Regular note
    pubkey: clientPublicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'running'] // Add running hashtag
    ],
    content: content
  };
  
  event.id = getEventHash(event);
  event.sig = getSignature(event, clientPrivateKey);
  
  console.log('Posting running note...');
  await relay.publish(event);
  console.log(`Note posted with ID: ${event.id}`);
  console.log('Waiting for DVM to process and reply to the note...');
  return event.id;
}

function listenForResults(relay) {
  console.log('Listening for DVM responses...');
  
  // Listen for task results (NIP-90)
  const taskSubscription = relay.sub([
    {
      kinds: [23195], // NIP-90 Task Result
      "#p": [clientPublicKey]
    }
  ]);
  
  taskSubscription.on('event', event => {
    try {
      const result = JSON.parse(event.content);
      console.log('\n=== Task Result Received ===');
      
      if (result.success) {
        console.log('Status: Success');
        console.log('Result:');
        console.log(JSON.stringify(result.result, null, 2));
      } else {
        console.log('Status: Error');
        console.log(`Error: ${result.error}`);
      }
      
      console.log('===========================\n');
    } catch (error) {
      console.error('Error processing result:', error);
    }
  });
  
  // Listen for direct replies to our notes
  const replySubscription = relay.sub([
    {
      kinds: [1], // Regular notes
      "#p": [clientPublicKey] // Tagged with our pubkey
    }
  ]);
  
  replySubscription.on('event', event => {
    try {
      console.log('\n=== Note Reply Received ===');
      console.log(`From: ${event.pubkey}`);
      console.log('Content:');
      console.log(event.content);
      console.log('===========================\n');
    } catch (error) {
      console.error('Error processing reply:', error);
    }
  });
}

main().catch(console.error); 