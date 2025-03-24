# RUNSTR DVM User Guide

Welcome to RUNSTR DVM, a Nostr Data Vending Machine specialized for running-related data and activities. This guide will help you get started with using and integrating the DVM.

## What is RUNSTR DVM?

RUNSTR DVM is a specialized service that:
1. Monitors Nostr for running-related content
2. Extracts structured data from running notes
3. Supports standardized workout formats (NIP-101e)
4. Provides an API for accessing running data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/runstr-dvm.git
   cd runstr-dvm
   ```

2. Install dependencies
   ```bash
   npm install dotenv express nostr-tools websocket-polyfill cors node-fetch
   ```

3. Create a `.env` file with your configuration:
   ```
   NOSTR_PRIVATE_KEY=your_private_key_here
   NOSTR_RELAYS=wss://relay.damus.io,wss://relay.nostr.info
   PORT=3000
   HOST=localhost
   ```

### Running the DVM

Start the DVM server:
```bash
npm start
```

Verify it's working with the test script:
```bash
node test-dvm.js
```

You should see output confirming the DVM is running correctly.

## Key Features

### 1. Running Notes Parser

The DVM can extract structured data from free-form running descriptions:

Example:
```
"Just completed a 5K in 25:30. Feeling great despite the rainy weather!"
```

Extracts:
- Distance: 5 km
- Time: 25:30
- Pace: 5:06/km (calculated)

### 2. Running Feed

The DVM monitors Nostr for posts with running-related hashtags (#running, #runstr) and maintains a feed of running content.

### 3. Workout Events (NIP-101e)

Supports standardized workout data:
- Exercise Templates (kind 33401)
- Workout Records (kind 1301)
- Running-specific metrics (pace, cadence, heart rate, splits)

## Integrating with Your Nostr Client

### Option 1: Simple API Integration

The easiest way to integrate is via HTTP API:

```javascript
// Example client
class RunstrClient {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  async parseRunningNote(content) {
    const response = await fetch(`${this.apiUrl}/api/running_notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await response.json();
    return data.result.extractedData;
  }
  
  async getRunningFeed(limit = 20) {
    const response = await fetch(
      `${this.apiUrl}/api/running_feed?limit=${limit}`
    );
    const data = await response.json();
    return data.result.feed;
  }
}

// Usage
const client = new RunstrClient();
const runData = await client.parseRunningNote('Ran 10K in 48:30 today!');
console.log(`Distance: ${runData.distance.value}${runData.distance.unit}`);
console.log(`Time: ${runData.time.formatted}`);
```

### Option 2: Nostr Protocol Integration (NIP-90)

For a true Nostr integration, use the NIP-90 protocol:

```javascript
// Using nostr-tools
const sendTaskRequest = async (task, params) => {
  const event = {
    kind: 23194, // NIP-90 Task Request
    pubkey: yourPublicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', DVM_PUBKEY]],
    content: JSON.stringify({ task, params })
  };
  
  event.id = getEventHash(event);
  event.sig = getSignature(event, yourPrivateKey);
  
  // Publish to relays
  await relay.publish(event);
  
  // Listen for result
  // ...
};
```

### Option 3: Publishing Workout Events

To publish standardized running workouts:

```javascript
// Create a workout record (NIP-101e)
const event = {
  kind: 1301, // Workout Record
  pubkey: yourPublicKey,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['d', generateUUID()],
    ['title', 'Morning 5K'],
    ['type', 'cardio'],
    ['start', startTime.toString()],
    ['end', endTime.toString()],
    ['heart_rate_avg', '145', 'bpm'],
    ['completed', 'true'],
    ['t', 'running']
  ],
  content: 'Great morning run!'
};

// Sign and publish
event.id = getEventHash(event);
event.sig = getSignature(event, yourPrivateKey);
await relay.publish(event);
```

## API Reference

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/running_notes` | POST | Extract data from running text |
| `/api/running_feed` | GET | Get feed of running notes |
| `/api/workout_templates` | GET | Get running exercise templates |
| `/api/workout_records` | GET | Get completed workouts |

### Query Parameters

Running Feed:
- `limit`: Maximum items to return (default: 20)
- `since`: Unix timestamp to start from
- `until`: Unix timestamp to end at
- `include_workouts`: Include workout events (default: true)

Workout Records:
- `limit`: Maximum items to return (default: 20)
- `completed`: Filter by completion status (true/false)

## Troubleshooting

### Server Won't Start

1. Check for errors in console output
2. Verify all dependencies are installed
3. Make sure no other service is using port 3000
4. Check that your .env file is properly configured

### API Connection Issues

1. Ensure the server is running
2. Try accessing http://localhost:3000/health
3. Check for firewall or network restrictions
4. Try using 127.0.0.1 instead of localhost

### Further Help

For more detailed examples, see the files in the `examples/` directory:
- `test-dvm.js`: Basic DVM testing
- `client-integration-example.js`: Client integration examples
- `workout_events_example.js`: NIP-101e workout events 