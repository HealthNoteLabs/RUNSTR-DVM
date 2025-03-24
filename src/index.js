require('dotenv').config();
require('websocket-polyfill');
const { NostrDVM } = require('./nostr/nostrDVM');
const { startApiServer } = require('./api/server');

// Initialize the Nostr DVM
const dvm = new NostrDVM();

// Start listening for events
dvm.start();

// Start the API server
startApiServer(dvm);

console.log('RUNSTR DVM is now running!');
console.log('- Listening for Nostr events on configured relays');
console.log(`- API server running at http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`); 