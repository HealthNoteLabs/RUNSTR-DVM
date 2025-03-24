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

  // Start the server
  const server = app.listen(port, host, () => {
    console.log(`API server listening at http://${host}:${port}`);
  });

  return server;
}

module.exports = { startApiServer }; 