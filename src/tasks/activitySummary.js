/**
 * Activity Summary Task
 * 
 * Summarizes running activities from a collection of running notes.
 * This task can calculate statistics, identify trends, and generate
 * insights from multiple running activities.
 */

/**
 * Summarizes running activities from a collection of notes
 * @param {Object} params - Task parameters 
 * @param {Array} params.activities - Array of parsed running activities
 * @returns {Object} Activity summary and statistics
 */
async function activitySummaryTask(params) {
  const { activities } = params;
  
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    throw new Error('No activities provided for summary');
  }
  
  const summary = {
    totalActivities: activities.length,
    period: {
      start: null,
      end: null
    },
    totals: {
      distance: 0,
      duration: 0
    },
    averages: {
      distance: 0,
      duration: 0,
      pace: 0
    },
    best: {
      pace: null,
      distance: null,
      duration: null
    },
    trends: {
      improvement: false,
      consistency: false
    },
    activityTypes: {}
  };
  
  // Extract timestamps if available
  const timestamps = activities
    .filter(a => a.timestamp)
    .map(a => new Date(a.timestamp))
    .sort((a, b) => a - b);
  
  if (timestamps.length > 0) {
    summary.period.start = timestamps[0].toISOString();
    summary.period.end = timestamps[timestamps.length - 1].toISOString();
  }
  
  // Process activities
  let totalDistance = 0;
  let totalDuration = 0;
  let totalPace = 0;
  let validPaceCount = 0;
  let bestPace = Infinity;
  let bestPaceActivity = null;
  let longestDistance = 0;
  let longestDistanceActivity = null;
  let longestDuration = 0;
  let longestDurationActivity = null;
  
  // Convert all units to km and seconds for consistency
  activities.forEach((activity, index) => {
    // Process distance
    if (activity.extractedData?.distance) {
      const distance = activity.extractedData.distance;
      let distanceInKm = distance.value;
      
      if (distance.unit === 'mi' || distance.unit === 'mile' || distance.unit === 'miles') {
        distanceInKm = distance.value * 1.60934;
      }
      
      totalDistance += distanceInKm;
      
      if (distanceInKm > longestDistance) {
        longestDistance = distanceInKm;
        longestDistanceActivity = index;
      }
      
      // Track activity types based on distance
      let activityType = 'short';
      if (distanceInKm >= 10) {
        activityType = 'long';
      } else if (distanceInKm >= 5) {
        activityType = 'medium';
      }
      
      summary.activityTypes[activityType] = (summary.activityTypes[activityType] || 0) + 1;
    }
    
    // Process duration
    if (activity.extractedData?.time) {
      const duration = activity.extractedData.time.totalSeconds;
      totalDuration += duration;
      
      if (duration > longestDuration) {
        longestDuration = duration;
        longestDurationActivity = index;
      }
    }
    
    // Process pace
    const pace = activity.extractedData?.pace || activity.extractedData?.calculatedPace;
    if (pace) {
      const paceInSecondsPerKm = (pace.minutes * 60 + pace.seconds) * 
        (pace.unit === 'mi' || pace.unit === 'mile' ? 0.621371 : 1);
      
      totalPace += paceInSecondsPerKm;
      validPaceCount++;
      
      if (paceInSecondsPerKm < bestPace) {
        bestPace = paceInSecondsPerKm;
        bestPaceActivity = index;
      }
    }
  });
  
  // Calculate averages
  if (summary.totalActivities > 0) {
    summary.averages.distance = totalDistance / summary.totalActivities;
  }
  
  if (summary.totalActivities > 0) {
    summary.averages.duration = totalDuration / summary.totalActivities;
  }
  
  if (validPaceCount > 0) {
    summary.averages.pace = totalPace / validPaceCount;
  }
  
  // Format averages
  summary.averages.distanceFormatted = `${summary.averages.distance.toFixed(2)} km`;
  
  const avgDurationHours = Math.floor(summary.averages.duration / 3600);
  const avgDurationMinutes = Math.floor((summary.averages.duration % 3600) / 60);
  const avgDurationSeconds = Math.floor(summary.averages.duration % 60);
  summary.averages.durationFormatted = 
    `${avgDurationHours.toString().padStart(2, '0')}:${avgDurationMinutes.toString().padStart(2, '0')}:${avgDurationSeconds.toString().padStart(2, '0')}`;
  
  const avgPaceMinutes = Math.floor(summary.averages.pace / 60);
  const avgPaceSeconds = Math.floor(summary.averages.pace % 60);
  summary.averages.paceFormatted = `${avgPaceMinutes}:${avgPaceSeconds.toString().padStart(2, '0')}/km`;
  
  // Record best performances
  if (bestPaceActivity !== null) {
    const pace = activities[bestPaceActivity].extractedData?.pace || 
                activities[bestPaceActivity].extractedData?.calculatedPace;
    
    summary.best.pace = {
      activityIndex: bestPaceActivity,
      value: pace.formatted
    };
  }
  
  if (longestDistanceActivity !== null) {
    const distance = activities[longestDistanceActivity].extractedData.distance;
    
    summary.best.distance = {
      activityIndex: longestDistanceActivity,
      value: `${distance.value} ${distance.unit}`
    };
  }
  
  if (longestDurationActivity !== null) {
    const time = activities[longestDurationActivity].extractedData.time;
    
    summary.best.duration = {
      activityIndex: longestDurationActivity,
      value: time.formatted
    };
  }
  
  // Calculate totals
  summary.totals.distance = totalDistance;
  summary.totals.distanceFormatted = `${totalDistance.toFixed(2)} km`;
  
  summary.totals.duration = totalDuration;
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);
  const totalSeconds = Math.floor(totalDuration % 60);
  summary.totals.durationFormatted = 
    `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
  
  // Analyze trends (simplified)
  if (activities.length >= 3 && timestamps.length >= 3) {
    // Check for pace improvement
    const paceTrend = analyzePaceTrend(activities);
    summary.trends.improvement = paceTrend.improving;
    summary.trends.consistency = paceTrend.consistent;
  }
  
  return summary;
}

/**
 * Analyzes pace trend from a series of activities
 * @param {Array} activities - Array of parsed running activities
 * @returns {Object} Trend analysis
 */
function analyzePaceTrend(activities) {
  // Extract activities with pace and timestamp
  const activitiesWithPace = activities
    .filter(a => (a.extractedData?.pace || a.extractedData?.calculatedPace) && a.timestamp)
    .map(a => {
      const pace = a.extractedData?.pace || a.extractedData?.calculatedPace;
      const paceInSeconds = pace.minutes * 60 + pace.seconds;
      return {
        timestamp: new Date(a.timestamp),
        paceInSeconds
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (activitiesWithPace.length < 3) {
    return { improving: false, consistent: false };
  }
  
  // Calculate linear regression
  const n = activitiesWithPace.length;
  const timestamps = activitiesWithPace.map(a => a.timestamp.getTime());
  const paces = activitiesWithPace.map(a => a.paceInSeconds);
  
  const avgTimestamp = timestamps.reduce((sum, t) => sum + t, 0) / n;
  const avgPace = paces.reduce((sum, p) => sum + p, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (timestamps[i] - avgTimestamp) * (paces[i] - avgPace);
    denominator += Math.pow(timestamps[i] - avgTimestamp, 2);
  }
  
  const slope = numerator / denominator;
  
  // Calculate standard deviation to measure consistency
  const variance = paces.reduce((sum, p) => sum + Math.pow(p - avgPace, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgPace;
  
  return {
    improving: slope < 0, // Negative slope means pace is improving (lower seconds per km)
    consistent: coefficientOfVariation < 0.1 // Less than 10% variation is considered consistent
  };
}

module.exports = { activitySummaryTask }; 