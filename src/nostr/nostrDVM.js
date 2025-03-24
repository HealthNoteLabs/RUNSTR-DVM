const { relayInit, getEventHash, getSignature, generatePrivateKey, getPublicKey } = require('nostr-tools');
const { runningNotesTask } = require('../tasks/runningNotes');
const { activitySummaryTask } = require('../tasks/activitySummary');

class NostrDVM {
  constructor() {
    this.privateKey = process.env.NOSTR_PRIVATE_KEY || generatePrivateKey();
    this.publicKey = getPublicKey(this.privateKey);
    this.relays = (process.env.NOSTR_RELAYS || 'wss://relay.damus.io').split(',');
    this.connectedRelays = [];
    this.tasks = [
      {
        name: 'running_notes',
        description: 'Extract and parse running-related notes',
        handler: runningNotesTask
      },
      {
        name: 'activity_summary',
        description: 'Summarize running activities from a collection of notes',
        handler: activitySummaryTask
      },
      {
        name: 'get_running_feed',
        description: 'Get a feed of recent running-related notes',
        handler: this.getRunningFeed.bind(this)
      },
      {
        name: 'get_workout_templates',
        description: 'Get running exercise templates (NIP-101e)',
        handler: this.getWorkoutTemplates.bind(this)
      },
      {
        name: 'get_workout_records',
        description: 'Get workout records (NIP-101e)',
        handler: this.getWorkoutRecords.bind(this)
      }
    ];
    // Running-related hashtags to monitor
    this.runningHashtags = ['runstr', 'Runstr', 'running', 'Running'];
    // Store running notes feed
    this.runningNotesFeed = [];
    // Store workout related events (NIP-101e)
    this.exerciseTemplates = []; // kind: 33401
    this.workoutTemplates = []; // kind: 33402
    this.workoutRecords = [];   // kind: 1301
    // Maximum size of collections to maintain
    this.maxFeedSize = 100;
    this.maxTemplatesSize = 100;
    this.maxRecordsSize = 100;
  }

  async start() {
    try {
      // Connect to relays
      for (const relayUrl of this.relays) {
        try {
          const relay = relayInit(relayUrl);
          await relay.connect();
          
          relay.on('connect', () => {
            console.log(`Connected to ${relayUrl}`);
            this.connectedRelays.push(relay);
            this.subscribeToTaskRequests(relay);
            this.subscribeToRunningNotes(relay); // Subscribe to running notes
            this.subscribeToWorkoutEvents(relay); // Subscribe to NIP-101e workout events
          });
          
          relay.on('error', () => {
            console.log(`Failed to connect to ${relayUrl}`);
          });
        } catch (error) {
          console.log(`Error connecting to ${relayUrl}: ${error.message}`);
        }
      }

      // Publish DVM capabilities to the network
      this.publishTaskList();
      
    } catch (error) {
      console.error('Failed to start DVM:', error);
    }
  }

  async publishTaskList() {
    const taskListEvent = {
      kind: 31990, // NIP-90 DVM TaskList
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', 'taskList'],
        ['name', 'RUNSTR DVM'],
        ['description', 'Running-related notes and activity analysis']
      ],
      content: JSON.stringify(this.tasks.map(task => ({
        name: task.name,
        description: task.description
      })))
    };

    taskListEvent.id = getEventHash(taskListEvent);
    taskListEvent.sig = getSignature(taskListEvent, this.privateKey);

    for (const relay of this.connectedRelays) {
      await relay.publish(taskListEvent);
    }
    
    console.log('Published task list to relays');
  }

  subscribeToTaskRequests(relay) {
    const subscription = relay.sub([
      {
        kinds: [23194], // NIP-90 Task Request
        "#p": [this.publicKey]
      }
    ]);

    subscription.on('event', event => {
      this.handleTaskRequest(event, relay);
    });
  }

  subscribeToRunningNotes(relay) {
    // Create a subscription for kind 1 notes with running-related hashtags
    const hashtagFilters = this.runningHashtags.map(tag => {
      return {
        kinds: [1], // Regular text notes
        "#t": [tag] // Filter by hashtag
      };
    });

    const subscription = relay.sub(hashtagFilters);

    subscription.on('event', event => {
      this.addNoteToFeed(event);
    });
    
    console.log(`Subscribed to notes with hashtags: ${this.runningHashtags.join(', ')}`);
  }

  subscribeToWorkoutEvents(relay) {
    // Subscribe to NIP-101e workout events
    const workoutFilters = [
      {
        kinds: [33401], // Exercise Templates
        "#t": this.runningHashtags // Filter by running-related hashtags
      },
      {
        kinds: [33402], // Workout Templates
        "#t": this.runningHashtags // Filter by running-related hashtags
      },
      {
        kinds: [1301], // Workout Records
        "#t": this.runningHashtags // Filter by running-related hashtags
      },
      {
        kinds: [1301], // Workout Records
        "#type": ["cardio", "running"] // Additional filters
      }
    ];

    const subscription = relay.sub(workoutFilters);

    subscription.on('event', event => {
      this.processWorkoutEvent(event);
    });
    
    console.log('Subscribed to NIP-101e workout events');
  }

  processWorkoutEvent(event) {
    try {
      switch (event.kind) {
        case 33401: // Exercise Template
          this.addExerciseTemplate(event);
          break;
        case 33402: // Workout Template
          this.addWorkoutTemplate(event);
          break;
        case 1301: // Workout Record
          this.addWorkoutRecord(event);
          break;
      }
    } catch (error) {
      console.error(`Error processing workout event: ${error.message}`);
    }
  }

  addExerciseTemplate(event) {
    // Skip if we've already seen this template
    if (this.exerciseTemplates.some(t => t.id === event.id)) {
      return;
    }

    // Process template-specific tags
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] || '';
    const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled Exercise';
    const format = event.tags.filter(t => t[0] === 'format').map(t => t.slice(1));
    const formatUnits = event.tags.filter(t => t[0] === 'format_units').map(t => t.slice(1));
    const equipment = event.tags.filter(t => t[0] === 'equipment').map(t => t.slice(1));
    const difficulty = event.tags.find(t => t[0] === 'difficulty')?.[1] || '';
    const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);

    const template = {
      id: event.id,
      kind: event.kind,
      pubkey: event.pubkey,
      created_at: event.created_at,
      d_tag: dTag,
      title,
      description: event.content,
      format,
      format_units: formatUnits,
      equipment,
      difficulty,
      hashtags,
      raw_event: event // Store the original event for reference
    };

    // Add to templates collection
    this.exerciseTemplates.unshift(template);
    
    // Limit collection size
    if (this.exerciseTemplates.length > this.maxTemplatesSize) {
      this.exerciseTemplates = this.exerciseTemplates.slice(0, this.maxTemplatesSize);
    }
    
    console.log(`Added exercise template: ${title} (${event.id})`);
    
    // Also add to general running feed for completeness
    this.addNoteToFeed(event, 'Exercise Template');
  }

  addWorkoutTemplate(event) {
    // Skip if we've already seen this template
    if (this.workoutTemplates.some(t => t.id === event.id)) {
      return;
    }

    // Process template-specific tags
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] || '';
    const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled Workout';
    const exercises = event.tags.filter(t => t[0] === 'exercise').map(t => t.slice(1));
    const duration = event.tags.find(t => t[0] === 'duration')?.[1] || '';
    const difficulty = event.tags.find(t => t[0] === 'difficulty')?.[1] || '';
    const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);

    const template = {
      id: event.id,
      kind: event.kind,
      pubkey: event.pubkey,
      created_at: event.created_at,
      d_tag: dTag,
      title,
      description: event.content,
      exercises,
      duration,
      difficulty,
      hashtags,
      raw_event: event // Store the original event for reference
    };

    // Add to templates collection
    this.workoutTemplates.unshift(template);
    
    // Limit collection size
    if (this.workoutTemplates.length > this.maxTemplatesSize) {
      this.workoutTemplates = this.workoutTemplates.slice(0, this.maxTemplatesSize);
    }
    
    console.log(`Added workout template: ${title} (${event.id})`);
    
    // Also add to general running feed for completeness
    this.addNoteToFeed(event, 'Workout Template');
  }

  addWorkoutRecord(event) {
    // Skip if we've already seen this record
    if (this.workoutRecords.some(r => r.id === event.id)) {
      return;
    }

    // Process record-specific tags
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] || '';
    const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled Workout';
    const type = event.tags.find(t => t[0] === 'type')?.[1] || '';
    const start = event.tags.find(t => t[0] === 'start')?.[1] || '';
    const end = event.tags.find(t => t[0] === 'end')?.[1] || '';
    const exercises = event.tags.filter(t => t[0] === 'exercise').map(t => t.slice(1));
    const completed = event.tags.find(t => t[0] === 'completed')?.[1] === 'true';
    const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);
    
    // Running-specific metrics
    const heartRateAvg = event.tags.find(t => t[0] === 'heart_rate_avg')?.slice(1) || [];
    const cadenceAvg = event.tags.find(t => t[0] === 'cadence_avg')?.slice(1) || [];
    const weatherInfo = {
      temp: event.tags.find(t => t[0] === 'weather_temp')?.slice(1) || [],
      humidity: event.tags.find(t => t[0] === 'weather_humidity')?.slice(1) || [],
      condition: event.tags.find(t => t[0] === 'weather_condition')?.[1] || ''
    };
    
    // Get split data if available
    const splits = event.tags.filter(t => t[0] === 'split').map(t => ({
      number: t[1],
      distance: t[2],
      unit: t[3],
      time: t[4],
      heart_rate: t[5] === 'bpm' ? null : t[5],
      heart_rate_unit: t[6] === 'bpm' ? t[6] : null
    }));

    const record = {
      id: event.id,
      kind: event.kind,
      pubkey: event.pubkey,
      created_at: event.created_at,
      d_tag: dTag,
      title,
      description: event.content,
      type,
      start: start ? parseInt(start) : null,
      end: end ? parseInt(end) : null,
      duration: (start && end) ? (parseInt(end) - parseInt(start)) : null,
      exercises,
      heart_rate_avg: heartRateAvg,
      cadence_avg: cadenceAvg,
      weather: weatherInfo,
      splits,
      completed,
      hashtags,
      raw_event: event // Store the original event for reference
    };

    // Add to records collection
    this.workoutRecords.unshift(record);
    
    // Limit collection size
    if (this.workoutRecords.length > this.maxRecordsSize) {
      this.workoutRecords = this.workoutRecords.slice(0, this.maxRecordsSize);
    }
    
    console.log(`Added workout record: ${title} (${event.id})`);
    
    // Also add to general running feed for completeness
    this.addNoteToFeed(event, 'Workout Record');
  }

  addNoteToFeed(event, eventType = null) {
    try {
      // Skip if we've already seen this note
      if (this.runningNotesFeed.some(note => note.id === event.id)) {
        return;
      }
      
      // Extract author information from the event
      const author = {
        pubkey: event.pubkey,
        // These would typically come from profile information, 
        // which would require additional lookups
        name: event.pubkey.substring(0, 8) // Using truncated pubkey for now
      };
      
      // Extract hashtags from event tags
      const hashtags = event.tags
        .filter(tag => tag[0] === 't')
        .map(tag => tag[1]);
      
      // Add note to feed
      const noteWithMetadata = {
        id: event.id,
        pubkey: event.pubkey,
        author,
        content: event.content,
        hashtags,
        created_at: event.created_at,
        relay: event.relay || "unknown", // Some implementations include source relay
        kind: event.kind,
        eventType: eventType // Add the type of event if provided
      };
      
      // Add to beginning of array (newest first)
      this.runningNotesFeed.unshift(noteWithMetadata);
      
      // Limit feed size
      if (this.runningNotesFeed.length > this.maxFeedSize) {
        this.runningNotesFeed = this.runningNotesFeed.slice(0, this.maxFeedSize);
      }
      
      console.log(`Added note to running feed: ${event.id}`);
    } catch (error) {
      console.error('Error adding note to feed:', error);
    }
  }

  // Task handler for getting the running feed
  async getRunningFeed(params = {}) {
    // Optional parameters for pagination/filtering
    const { limit = 20, since = 0, until = Number.MAX_SAFE_INTEGER, include_workouts = true } = params;
    
    // Filter and return the feed
    let filteredFeed = this.runningNotesFeed
      .filter(note => note.created_at >= since && note.created_at <= until);
      
    // Filter out workout events if not requested
    if (!include_workouts) {
      filteredFeed = filteredFeed.filter(note => 
        note.kind === 1 && !note.eventType
      );
    }
    
    // Apply limit
    filteredFeed = filteredFeed.slice(0, limit);
    
    return {
      feed: filteredFeed,
      total: this.runningNotesFeed.length
    };
  }

  // Task handler for getting workout templates
  async getWorkoutTemplates(params = {}) {
    const { limit = 20, since = 0, until = Number.MAX_SAFE_INTEGER, type = null } = params;
    
    // Filter templates by time
    let templates = [...this.exerciseTemplates, ...this.workoutTemplates]
      .filter(template => template.created_at >= since && template.created_at <= until);
    
    // Filter by type if specified
    if (type === 'exercise') {
      templates = templates.filter(t => t.kind === 33401);
    } else if (type === 'workout') {
      templates = templates.filter(t => t.kind === 33402);
    }
    
    // Sort by timestamp (newest first)
    templates.sort((a, b) => b.created_at - a.created_at);
    
    // Apply limit
    templates = templates.slice(0, limit);
    
    return {
      templates,
      total: {
        exercise: this.exerciseTemplates.length,
        workout: this.workoutTemplates.length
      }
    };
  }

  // Task handler for getting workout records
  async getWorkoutRecords(params = {}) {
    const { 
      limit = 20, 
      since = 0, 
      until = Number.MAX_SAFE_INTEGER,
      completed = null
    } = params;
    
    // Filter records
    let records = this.workoutRecords
      .filter(record => record.created_at >= since && record.created_at <= until);
    
    // Filter by completion status if specified
    if (completed === true) {
      records = records.filter(r => r.completed === true);
    } else if (completed === false) {
      records = records.filter(r => r.completed === false);
    }
    
    // Sort by timestamp (newest first)
    records.sort((a, b) => b.created_at - a.created_at);
    
    // Apply limit
    records = records.slice(0, limit);
    
    return {
      records,
      total: this.workoutRecords.length
    };
  }

  async handleTaskRequest(event, relay) {
    try {
      const taskRequest = JSON.parse(event.content);
      const { task, params } = taskRequest;
      
      console.log(`Received task request: ${task}`);
      
      const taskHandler = this.tasks.find(t => t.name === task)?.handler;
      
      if (!taskHandler) {
        await this.publishTaskResult(event, relay, {
          success: false,
          error: `Unknown task: ${task}`
        });
        return;
      }
      
      // Process the task
      const result = await taskHandler(params);
      
      // Publish the result
      await this.publishTaskResult(event, relay, {
        success: true,
        result
      });
      
    } catch (error) {
      console.error('Error handling task request:', error);
      await this.publishTaskResult(event, relay, {
        success: false,
        error: error.message
      });
    }
  }

  async publishTaskResult(requestEvent, relay, resultContent) {
    const resultEvent = {
      kind: 23195, // NIP-90 Task Result
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', requestEvent.id],
        ['p', requestEvent.pubkey]
      ],
      content: JSON.stringify(resultContent)
    };

    resultEvent.id = getEventHash(resultEvent);
    resultEvent.sig = getSignature(resultEvent, this.privateKey);

    await relay.publish(resultEvent);
    console.log(`Published task result for ${requestEvent.id}`);
  }

  // Method to handle API requests
  async processApiRequest(taskName, params) {
    const taskHandler = this.tasks.find(t => t.name === taskName)?.handler;
    
    if (!taskHandler) {
      throw new Error(`Unknown task: ${taskName}`);
    }
    
    return await taskHandler(params);
  }
}

module.exports = { NostrDVM }; 