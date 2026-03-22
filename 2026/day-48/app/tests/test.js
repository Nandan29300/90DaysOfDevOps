/**
 * Lightweight test suite — no test framework needed.
 * Imports the app module directly and checks route logic.
 * Exits 0 (all pass) or 1 (any fail).
 */
const app = require('../src/index');
const http = require('http');

let PASS = 0;
let FAIL = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    PASS++;
  } else {
    console.log(`  ❌  ${label}`);
    FAIL++;
  }
}

// ── Unit tests (pure logic, no HTTP) ─────────────────────────────────────────
console.log('\n=== Unit Tests ===');

check('app module is an Express instance',
  typeof app === 'function' && app.listen !== undefined);

check('NODE_ENV defaults to development',
  !process.env.NODE_ENV || process.env.NODE_ENV === 'development');

// ── Integration tests (spin up a real server on an ephemeral port) ───────────
console.log('\n=== Integration Tests ===');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;

  function get(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}${path}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });
  }

  try {
    // /health
    const health = await get('/health');
    check('GET /health returns 200', health.status === 200);
    check('GET /health body.status === "ok"', health.body.status === 'ok');
    check('GET /health body.version is a string', typeof health.body.version === 'string');

    // /
    const root = await get('/');
    check('GET / returns 200', root.status === 200);
    check('GET / body.message contains "Day 48"', root.body.message.includes('Day 48'));

    // /tasks
    const tasks = await get('/tasks');
    check('GET /tasks returns 200', tasks.status === 200);
    check('GET /tasks returns an array', Array.isArray(tasks.body));
    check('GET /tasks has at least one item', tasks.body.length > 0);
    check('each task has id, title, done',
      tasks.body.every(t => 'id' in t && 'title' in t && 'done' in t));

  } catch (err) {
    console.error('Test error:', err.message);
    FAIL++;
  } finally {
    server.close();
    console.log(`\n=== Results: ${PASS} passed, ${FAIL} failed ===\n`);
    process.exit(FAIL > 0 ? 1 : 0);
  }
});
