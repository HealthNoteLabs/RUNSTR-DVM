/**
 * RUNSTR DVM - Running Feed Example
 * 
 * This example demonstrates how to access the running feed via the API
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function main() {
  try {
    // Example 1: Get the most recent running notes
    console.log('\n=== Example 1: Get Recent Running Notes ===');
    const recentNotes = await getRunningFeed();
    console.log(`Retrieved ${recentNotes.feed.length} recent running notes`);
    printNotes(recentNotes.feed);
    
    // Example 2: Get running notes with pagination and time filters
    console.log('\n=== Example 2: Get Running Notes with Filters ===');
    // Get 5 notes from the last 24 hours
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    const filteredNotes = await getRunningFeed({
      limit: 5,
      since: oneDayAgo
    });
    console.log(`Retrieved ${filteredNotes.feed.length} running notes from the last 24 hours`);
    printNotes(filteredNotes.feed);
    
    console.log(`\nTotal notes in feed: ${recentNotes.total}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function getRunningFeed(params = {}) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.since) queryParams.append('since', params.since);
    if (params.until) queryParams.append('until', params.until);
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/api/running_feed${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching running feed:', error);
    throw error;
  }
}

function printNotes(notes) {
  if (notes.length === 0) {
    console.log('No notes found.');
    return;
  }
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const date = new Date(note.created_at * 1000).toLocaleString();
    
    console.log(`\n[${i + 1}] Note ID: ${note.id.substring(0, 8)}...`);
    console.log(`Author: ${note.author.name}`);
    console.log(`Date: ${date}`);
    console.log(`Hashtags: #${note.hashtags.join(' #')}`);
    console.log(`Content: ${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}`);
  }
}

main().catch(console.error); 