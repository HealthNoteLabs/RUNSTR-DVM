/**
 * RUNSTR DVM API Example
 * 
 * This example demonstrates how to use the RUNSTR DVM's API endpoints
 * to parse running notes and generate activity summaries.
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function main() {
  // Example 1: Parse a single running note
  const runningNote = {
    content: "Great run today! Did 5.2 miles in 45:30 with 150ft elevation gain. Felt really good, despite the rainy weather. Heart rate averaged around 155bpm."
  };
  
  const parsedNote = await parseRunningNote(runningNote);
  console.log('Parsed Running Note:');
  console.log(JSON.stringify(parsedNote, null, 2));
  console.log('\n---\n');
  
  // Example 2: Generate activity summary from multiple notes
  const activities = [
    {
      timestamp: '2023-01-05T08:30:00Z',
      extractedData: {
        distance: { value: 5, unit: 'km' },
        time: { 
          hours: 0, 
          minutes: 25, 
          seconds: 30, 
          totalSeconds: 1530,
          formatted: '00:25:30'
        },
        calculatedPace: {
          minutes: 5,
          seconds: 6,
          unit: 'km',
          formatted: '5:06/km'
        }
      }
    },
    {
      timestamp: '2023-01-07T09:15:00Z',
      extractedData: {
        distance: { value: 8, unit: 'km' },
        time: { 
          hours: 0, 
          minutes: 40, 
          seconds: 45, 
          totalSeconds: 2445,
          formatted: '00:40:45'
        },
        calculatedPace: {
          minutes: 5,
          seconds: 5,
          unit: 'km',
          formatted: '5:05/km'
        }
      }
    },
    {
      timestamp: '2023-01-10T07:45:00Z',
      extractedData: {
        distance: { value: 10, unit: 'km' },
        time: { 
          hours: 0, 
          minutes: 50, 
          seconds: 20, 
          totalSeconds: 3020,
          formatted: '00:50:20'
        },
        calculatedPace: {
          minutes: 5,
          seconds: 2,
          unit: 'km',
          formatted: '5:02/km'
        }
      }
    }
  ];
  
  const activitySummary = await generateActivitySummary({ activities });
  console.log('Activity Summary:');
  console.log(JSON.stringify(activitySummary, null, 2));
}

async function parseRunningNote(data) {
  try {
    const response = await fetch(`${API_URL}/api/running_notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error parsing running note:', error);
    throw error;
  }
}

async function generateActivitySummary(data) {
  try {
    const response = await fetch(`${API_URL}/api/activity_summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating activity summary:', error);
    throw error;
  }
}

main().catch(console.error); 