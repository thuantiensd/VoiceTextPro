const { spawn } = require('child_process');
const express = require('express');
const path = require('path');

// Production server for external hosting
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy to your main server
app.use('/api', (req, res) => {
  res.redirect(`http://localhost:5001${req.url}`);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
  
  // Start the main application server on port 5001
  const mainServer = spawn('npm', ['run', 'dev:production'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '5001' }
  });
  
  mainServer.stdout.on('data', (data) => {
    console.log(`App: ${data}`);
  });
  
  mainServer.stderr.on('data', (data) => {
    console.error(`App Error: ${data}`);
  });
});