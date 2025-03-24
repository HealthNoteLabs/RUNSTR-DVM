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
      }
    ];
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