const express = require('express');
const cors = require('cors');

function startApiServer(dvm) {
  const app = express();
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || 'localhost';

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API info endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'RUNSTR DVM API',
      description: 'API for running-related notes and activity analysis',
      version: '1.0.0',
      tasks: dvm.tasks.map(task => ({
        name: task.name,
        description: task.description,
        endpoint: `/api/${task.name}`
      }))
    });
  });

  // Task endpoints
  app.post('/api/running_notes', async (req, res) => {
    try {
      const result = await dvm.processApiRequest('running_notes', req.body);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post('/api/activity_summary', async (req, res) => {
    try {
      const result = await dvm.processApiRequest('activity_summary', req.body);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Running feed endpoint
  app.get('/api/running_feed', async (req, res) => {
    try {
      // Parse query parameters
      const params = {
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        since: req.query.since ? parseInt(req.query.since) : 0,
        until: req.query.until ? parseInt(req.query.until) : Number.MAX_SAFE_INTEGER,
        include_workouts: req.query.include_workouts !== 'false' // default true
      };
      
      const result = await dvm.processApiRequest('get_running_feed', params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Workout templates endpoint (NIP-101e)
  app.get('/api/workout_templates', async (req, res) => {
    try {
      // Parse query parameters
      const params = {
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        since: req.query.since ? parseInt(req.query.since) : 0,
        until: req.query.until ? parseInt(req.query.until) : Number.MAX_SAFE_INTEGER,
        type: req.query.type || null // 'exercise', 'workout', or null for both
      };
      
      const result = await dvm.processApiRequest('get_workout_templates', params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Workout records endpoint (NIP-101e)
  app.get('/api/workout_records', async (req, res) => {
    try {
      // Parse query parameters
      const params = {
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        since: req.query.since ? parseInt(req.query.since) : 0,
        until: req.query.until ? parseInt(req.query.until) : Number.MAX_SAFE_INTEGER,
        completed: req.query.completed ? req.query.completed === 'true' : null
      };
      
      const result = await dvm.processApiRequest('get_workout_records', params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Start the server
  const server = app.listen(port, host, () => {
    console.log(`API server listening at http://${host}:${port}`);
  });

  return server;
}

module.exports = { startApiServer }; 