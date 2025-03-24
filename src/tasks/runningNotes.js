/**
 * Running Notes Task
 * 
 * Extracts and parses running-related information from notes.
 * This task can identify key metrics like distance, pace, time,
 * and other running-related data from unstructured text.
 */

// Regular expressions for parsing running data
const DISTANCE_REGEX = /(\d+(?:\.\d+)?)\s*(km|mi|mile|miles|kilometers)/i;
const TIME_REGEX = /(\d+):(\d+):(\d+)|(\d+):(\d+)|(\d+)\s*(h|hr|hrs|hour|hours)|(\d+)\s*(m|min|mins|minute|minutes)|(\d+)\s*(s|sec|secs|second|seconds)/ig;
const PACE_REGEX = /(\d+):(\d+)(?:\/|\s+per\s+)(km|mi|mile|miles|kilometer|kilometers)/i;
const ELEVATION_REGEX = /(\d+(?:\.\d+)?)\s*(m|meters|ft|feet)\s+(?:elevation|elev|climb|gain)/i;
const HEART_RATE_REGEX = /(\d+)\s*(?:bpm|hr|heart\s+rate)/i;
const WEATHER_REGEX = /(sunny|cloudy|rainy|snowy|windy|hot|cold|warm|cool|humid)/ig;
const MOOD_REGEX = /(great|good|okay|ok|bad|terrible|amazing|excellent|difficult|hard|easy|challenging|tough|struggled)/ig;

/**
 * Parses running notes to extract structured data
 * @param {Object} params - Task parameters
 * @param {string} params.content - The note content to parse
 * @returns {Object} Structured running data
 */
async function runningNotesTask(params) {
  const { content } = params;
  
  if (!content) {
    throw new Error('No content provided to parse');
  }
  
  const result = {
    rawContent: content,
    extractedData: {}
  };
  
  // Extract distance
  const distanceMatch = content.match(DISTANCE_REGEX);
  if (distanceMatch) {
    result.extractedData.distance = {
      value: parseFloat(distanceMatch[1]),
      unit: distanceMatch[2].toLowerCase()
    };
  }
  
  // Extract time
  const timeMatches = [...content.matchAll(TIME_REGEX)];
  if (timeMatches.length > 0) {
    let totalSeconds = 0;
    
    for (const match of timeMatches) {
      if (match[1] && match[2] && match[3]) {
        // HH:MM:SS format
        totalSeconds += parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
      } else if (match[4] && match[5]) {
        // MM:SS format
        totalSeconds += parseInt(match[4]) * 60 + parseInt(match[5]);
      } else if (match[6] && (match[7]?.toLowerCase().startsWith('h'))) {
        // X hours format
        totalSeconds += parseInt(match[6]) * 3600;
      } else if (match[8] && (match[9]?.toLowerCase().startsWith('m'))) {
        // X minutes format
        totalSeconds += parseInt(match[8]) * 60;
      } else if (match[10] && (match[11]?.toLowerCase().startsWith('s'))) {
        // X seconds format
        totalSeconds += parseInt(match[10]);
      }
    }
    
    // Convert seconds to HH:MM:SS
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    result.extractedData.time = {
      hours,
      minutes,
      seconds,
      totalSeconds,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }
  
  // Extract pace
  const paceMatch = content.match(PACE_REGEX);
  if (paceMatch) {
    result.extractedData.pace = {
      minutes: parseInt(paceMatch[1]),
      seconds: parseInt(paceMatch[2]),
      unit: paceMatch[3].toLowerCase().startsWith('km') ? 'km' : 'mi',
      formatted: `${paceMatch[1]}:${paceMatch[2].padStart(2, '0')}/${paceMatch[3].toLowerCase().startsWith('km') ? 'km' : 'mi'}`
    };
  }
  
  // Extract elevation
  const elevationMatch = content.match(ELEVATION_REGEX);
  if (elevationMatch) {
    result.extractedData.elevation = {
      value: parseFloat(elevationMatch[1]),
      unit: elevationMatch[2].toLowerCase().startsWith('m') ? 'meters' : 'feet'
    };
  }
  
  // Extract heart rate
  const heartRateMatch = content.match(HEART_RATE_REGEX);
  if (heartRateMatch) {
    result.extractedData.heartRate = parseInt(heartRateMatch[1]);
  }
  
  // Extract weather conditions
  const weatherMatches = [...content.matchAll(WEATHER_REGEX)];
  if (weatherMatches.length > 0) {
    result.extractedData.weather = weatherMatches.map(match => match[0].toLowerCase());
  }
  
  // Extract mood
  const moodMatches = [...content.matchAll(MOOD_REGEX)];
  if (moodMatches.length > 0) {
    result.extractedData.mood = moodMatches.map(match => match[0].toLowerCase());
  }
  
  // Calculate derived metrics if possible
  if (result.extractedData.distance && result.extractedData.time) {
    // Calculate pace if not directly provided
    if (!result.extractedData.pace) {
      const paceInSeconds = result.extractedData.time.totalSeconds / result.extractedData.distance.value;
      const paceMinutes = Math.floor(paceInSeconds / 60);
      const paceSeconds = Math.floor(paceInSeconds % 60);
      
      result.extractedData.calculatedPace = {
        minutes: paceMinutes,
        seconds: paceSeconds,
        unit: result.extractedData.distance.unit,
        formatted: `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/${result.extractedData.distance.unit}`
      };
    }
  }
  
  return result;
}

module.exports = { runningNotesTask }; 