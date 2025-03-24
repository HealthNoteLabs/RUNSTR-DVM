# RUNSTR DVM - Running Notes Data Vending Machine

RUNSTR DVM is a Nostr-based Data Vending Machine (DVM) that processes and analyzes running-related notes. It implements the [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) specification for DVMs in the Nostr ecosystem.

## Features

- **Running Notes Parser**: Extracts structured data from free-form running notes, including:
  - Distance
  - Time
  - Pace
  - Elevation
  - Heart rate
  - Weather conditions
  - Mood
  
- **Activity Summary**: Aggregates multiple running activities to generate insights, including:
  - Total distance and time
  - Average pace
  - Personal records
  - Improvement trends
  - Activity categorization

- **Dual Interface**:
  - Nostr protocol interface (NIP-90)
  - HTTP API for direct integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/runstr-dvm.git
   cd runstr-dvm
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file to add your Nostr private key and configure your relays:
   ```
   NOSTR_PRIVATE_KEY=your_private_key_here
   NOSTR_RELAYS=wss://relay.damus.io,wss://relay.nostr.info
   ```

### Running the DVM

Start the DVM:
```
npm start
```

The DVM will:
1. Connect to the configured Nostr relays
2. Publish its capabilities to the network
3. Listen for task requests
4. Start the HTTP API server

## Using the DVM

### Via Nostr

To use the DVM through Nostr:

1. Find the DVM's public key (printed when the DVM starts)
2. Send a NIP-90 task request (kind: 23194) with one of the supported tasks:
   - `running_notes`
   - `activity_summary`
3. Wait for the task result event (kind: 23195)

See `examples/nostr_example.js` for a complete example.

### Via HTTP API

To use the DVM through its HTTP API:

1. Send a POST request to one of the endpoints:
   - `/api/running_notes`
   - `/api/activity_summary`
2. Receive the structured data in the response

See `examples/api_example.js` for a complete example.

## API Reference

### Running Notes Task

**Endpoint:** `/api/running_notes`  
**Method:** POST  
**Request Format:**
```json
{
  "content": "Your running note text here"
}
```

**Response Format:**
```json
{
  "success": true,
  "result": {
    "rawContent": "Your running note text here",
    "extractedData": {
      "distance": { "value": 5.2, "unit": "miles" },
      "time": { 
        "hours": 0, 
        "minutes": 45, 
        "seconds": 30, 
        "totalSeconds": 2730,
        "formatted": "00:45:30"
      },
      "pace": {
        "minutes": 8,
        "seconds": 45,
        "unit": "mi",
        "formatted": "8:45/mi"
      }
      // Additional extracted data...
    }
  }
}
```

### Activity Summary Task

**Endpoint:** `/api/activity_summary`  
**Method:** POST  
**Request Format:**
```json
{
  "activities": [
    {
      "timestamp": "2023-01-01T12:00:00Z",
      "extractedData": {
        "distance": { "value": 5, "unit": "km" },
        "time": { 
          "hours": 0, 
          "minutes": 25, 
          "seconds": 0, 
          "totalSeconds": 1500,
          "formatted": "00:25:00"
        }
        // Other activity data...
      }
    }
    // Additional activities...
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "result": {
    "totalActivities": 1,
    "period": {
      "start": "2023-01-01T12:00:00Z",
      "end": "2023-01-01T12:00:00Z"
    },
    "totals": {
      "distance": 5,
      "distanceFormatted": "5.00 km",
      "duration": 1500,
      "durationFormatted": "00:25:00"
    },
    "averages": {
      "distance": 5,
      "distanceFormatted": "5.00 km",
      "duration": 1500,
      "durationFormatted": "00:25:00",
      "pace": 300,
      "paceFormatted": "5:00/km"
    }
    // Additional summary data...
  }
}
```

## Extending the DVM

You can extend the DVM by:

1. Adding new tasks to the `src/tasks/` directory
2. Registering the tasks in `src/nostr/nostrDVM.js`
3. Adding API endpoints in `src/api/server.js`

## License

MIT

## Acknowledgements

- [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md)
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- [nostrdvm Python Framework](https://github.com/believethehype/nostrdvm) 