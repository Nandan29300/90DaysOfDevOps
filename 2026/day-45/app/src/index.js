const express = require('express');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health probe — used by Docker healthcheck and CI verify step
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.APP_VERSION || '1.0.0' });
});

// Simple greeting endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Hello from Day 45 – Docker CI/CD Pipeline!',
    commit:  process.env.GIT_SHA   || 'local',
    built:   process.env.BUILD_DATE || 'local',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
