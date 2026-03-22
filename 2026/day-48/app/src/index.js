const express = require('express');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    version: process.env.APP_VERSION || '1.0.0',
    commit:  process.env.GIT_SHA     || 'local',
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Day 48 – GitHub Actions Capstone', env: process.env.NODE_ENV || 'development' });
});

app.get('/tasks', (_req, res) => {
  res.json([
    { id: 1, title: 'Build a CI/CD pipeline', done: true },
    { id: 2, title: 'Push image to Docker Hub', done: true },
    { id: 3, title: 'Deploy to production',    done: false },
  ]);
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
