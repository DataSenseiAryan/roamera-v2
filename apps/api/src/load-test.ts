/**
 * Load test — Sprint 12
 * 100 concurrent connections to GET /api/v1/feed/compass for 30 seconds.
 * Target: p95 latency < 200ms.
 *
 * Usage:
 *   pnpm --filter api load-test
 *   # or: npx ts-node src/load-test.ts
 *
 * The API must be running on API_URL (default: http://localhost:4000).
 * Set a valid AUTH_TOKEN env var to test authenticated endpoints.
 */
import autocannon from 'autocannon';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const AUTH_TOKEN = process.env.AUTH_TOKEN ?? '';
const DURATION = Number(process.env.LOAD_DURATION ?? '30');
const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS ?? '100');
const P95_TARGET_MS = 200;

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
}

console.log(`\n🚀 Roamera Load Test — Sprint 12`);
console.log(`   Target : ${API_URL}/api/v1/feed/compass`);
console.log(`   Concurrency: ${CONNECTIONS} connections`);
console.log(`   Duration: ${DURATION}s`);
console.log(`   P95 target: < ${P95_TARGET_MS}ms\n`);

const instance = autocannon(
  {
    url: `${API_URL}/api/v1/feed/compass`,
    connections: CONNECTIONS,
    duration: DURATION,
    headers,
    requests: [
      {
        method: 'GET',
        path: '/api/v1/feed/compass?limit=20',
      },
    ],
  },
  (err, results) => {
    if (err) {
      console.error('Load test error:', err);
      process.exit(1);
    }

    console.log('\n📊 Results:');
    console.log(`   Requests/sec : ${results.requests.average.toFixed(1)}`);
    console.log(`   Latency avg  : ${results.latency.average.toFixed(1)}ms`);
    console.log(`   Latency p95  : ${results.latency.p97_5.toFixed(1)}ms`);
    console.log(`   Latency p99  : ${results.latency.p99.toFixed(1)}ms`);
    console.log(`   Errors       : ${results.errors}`);
    console.log(`   Timeouts     : ${results.timeouts}`);
    console.log(`   2xx          : ${results['2xx']}`);
    console.log(`   Non-2xx      : ${results.non2xx}`);

    const p95 = results.latency.p97_5;
    const passed = p95 < P95_TARGET_MS;
    console.log(`\n${passed ? '✅' : '❌'} P95 ${p95.toFixed(1)}ms — target < ${P95_TARGET_MS}ms — ${passed ? 'PASSED' : 'FAILED'}`);

    if (!passed) {
      process.exit(1);
    }
  },
);

autocannon.track(instance, { renderProgressBar: true });
