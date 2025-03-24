# RUNSTR DVM - Running Notes Data Vending Machine

RUNSTR DVM is a Nostr-based Data Vending Machine (DVM) that processes and monitors running-related notes. It implements the [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) specification for DVMs in the Nostr ecosystem and supports [NIP-101e](https://github.com/nostr-protocol/nips/pull/1816) for structured workout events.

## Features

- **Running Notes Feed**: Monitors and collects Nostr notes with running-related hashtags:
  - #runstr
  - #Runstr
  - #running
  - #Running
  
- **Workout Events (NIP-101e)**: Supports standardized workout data format including:
  - Exercise Templates (kind 33401)
  - Workout Templates (kind 33402)
  - Workout Records (kind 1301)
  - Running-specific metrics (pace, cadence, heart rate, splits)
  
- **Running Notes Parser**: Extracts structured data from free-form running notes, including:
  - Distance
  - Time
  - Pace
  - Elevation
  - Heart rate
  
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
4. Monitor for running-related hashtags and workout events
5. Start the HTTP API server

## Using the DVM

### Accessing the Running Feed

The DVM monitors Nostr for posts with running-related hashtags and maintains a feed of the most recent notes. You can access this feed in two ways:

#### Via HTTP API

Send a GET request to the running feed endpoint:
```
GET /api/running_feed
```

Optional query parameters:
- `limit`: Maximum number of notes to return (default: 20)
- `since`: Unix timestamp to get notes from (default: 0)
- `until`: Unix timestamp to get notes until (default: now)
- `include_workouts`: Whether to include workout events (default: true)

Example:
```
GET /api/running_feed?limit=10&since=1651363200
```

### Working with Workout Events (NIP-101e)

The DVM supports the structured workout events format proposed in NIP-101e, including exercise templates, workout templates, and workout records specifically optimized for running activities.

#### Creating Workout Events

You can create workout events by publishing Nostr events with the appropriate kinds:

- **Exercise Template (kind 33401)**: Define a running exercise pattern
  ```json
  {
    "kind": 33401,
    "content": "Easy pace run on flat terrain. Focus on maintaining consistent effort.",
    "tags": [
      ["d", "<UUID>"],
      ["title", "Easy Run"],
      ["format", "distance", "duration", "pace", "gps_data", "elevation_gain"],
      ["format_units", "km", "seconds", "min/km", "polyline", "m"],
      ["equipment", "cardio"],
      ["difficulty", "beginner"],
      ["t", "running"],
      ["t", "cardio"]
    ]
  }
  ```

- **Workout Record (kind 1301)**: Record a completed running workout
  ```json
  {
    "kind": 1301,
    "content": "Morning run felt great. Perfect weather conditions.",
    "tags": [
      ["d", "<UUID>"],
      ["title", "Morning 5K"],
      ["type", "cardio"],
      ["start", "1706454000"],
      ["end", "1706455800"],
      ["exercise", "33401:<pubkey>:<UUID-running>", "<relay-url>", "5", "1800", "4:52", "encoded_polyline_string", "125"],
      ["cadence_avg", "172", "spm"],
      ["heart_rate_avg", "142", "bpm"],
      ["weather_temp", "18", "c"],
      ["weather_humidity", "65", "%"],
      ["weather_condition", "partly_cloudy"],
      ["split", "1", "1000", "m", "3:45", "155", "bpm"],
      ["split", "2", "1000", "m", "3:52", "158", "bpm"],
      ["completed", "true"],
      ["t", "running"]
    ]
  }
  ```

See `examples/workout_events_example.js` for a complete example of creating and working with workout events.

#### Accessing Workout Templates and Records

**Workout Templates Endpoint:**
```
GET /api/workout_templates
```

Optional query parameters:
- `limit`: Maximum number of templates to return (default: 20)
- `since`: Unix timestamp to get templates from (default: 0)
- `until`: Unix timestamp to get templates until (default: now)
- `type`: Type of templates to return (`exercise`, `workout`, or not specified for both)

**Workout Records Endpoint:**
```
GET /api/workout_records
```

Optional query parameters:
- `limit`: Maximum number of records to return (default: 20)
- `since`: Unix timestamp to get records from (default: 0)
- `until`: Unix timestamp to get records until (default: now)
- `completed`: Filter by completion status (`true`, `false`, or not specified for both)

### Other Available Tasks

The DVM also supports the following tasks:

#### Running Notes Task

Parses running-related information from note content:

**Endpoint:** `/api/running_notes`  
**Method:** POST  
**Request Format:**
```json
{
  "content": "Your running note text here"
}
```

#### Activity Summary Task

Summarizes running activities from a collection of notes:

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
      }
    }
    // Additional activities...
  ]
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

- [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) - Nostr Data Vending Machines
- [NIP-101e](https://github.com/nostr-protocol/nips/pull/1816) - Workout Events
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- [nostrdvm Python Framework](https://github.com/believethehype/nostrdvm) 