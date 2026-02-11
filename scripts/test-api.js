#!/usr/bin/env node

/**
 * Mix Masters API – Endpoint Test Script
 * =======================================
 * Tests all public and authenticated API endpoints.
 *
 * Usage:
 *   node scripts/test-api.js                          # defaults to https://api.mixmasters.club
 *   node scripts/test-api.js http://localhost:4000     # test local backend
 *
 * Requires: ADMIN_PASSWORD env var (or falls back to Qwerty@12345)
 */

const BASE = (process.argv[2] || 'https://api.mixmasters.club').replace(/\/+$/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Qwerty@12345';

const PASS = '\x1b[32m✔ PASS\x1b[0m';
const FAIL = '\x1b[31m✘ FAIL\x1b[0m';
const SKIP = '\x1b[33m⊘ SKIP\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

async function request(method, path, { body, token, expectStatus } = {}) {
    const url = `${BASE}${path}`;
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    }

    return { status: res.status, data, ok: res.ok, url };
}

function test(name, ok, detail = '') {
    totalTests++;
    if (ok) {
        passed++;
        console.log(`  ${PASS}  ${name}${detail ? `  ${DIM}${detail}${RESET}` : ''}`);
    } else {
        failed++;
        failures.push(name);
        console.log(`  ${FAIL}  ${name}${detail ? `  ${DIM}${detail}${RESET}` : ''}`);
    }
}

function skip(name, reason) {
    totalTests++;
    skipped++;
    console.log(`  ${SKIP}  ${name}  ${DIM}(${reason})${RESET}`);
}

function section(title) {
    console.log(`\n${BOLD}── ${title} ──${RESET}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function run() {
    console.log(`\n${BOLD}Mix Masters API Test Suite${RESET}`);
    console.log(`${DIM}Target: ${BASE}${RESET}\n`);

    // ── 1. Health ──
    section('Health Check');
    try {
        const { status, data } = await request('GET', '/api/health');
        test('GET /api/health returns 200', status === 200);
        test('  → status field is "ok"', data?.status === 'ok', `got: ${data?.status}`);
        test('  → service is "mix_masters_backend"', data?.service === 'mix_masters_backend');
    } catch (e) {
        test('GET /api/health reachable', false, e.message);
    }

    // ── 2. Public Content ──
    section('Public Endpoints');
    let publicContent = null;
    try {
        const { status, data } = await request('GET', '/api/public/content');
        publicContent = data;
        test('GET /api/public/content returns 200', status === 200);
        test('  → has settings object', typeof data?.settings === 'object');
        test('  → has events array', Array.isArray(data?.events), `length: ${data?.events?.length}`);
        test('  → has judges array', Array.isArray(data?.judges), `length: ${data?.judges?.length}`);
        test('  → has sponsors array', Array.isArray(data?.sponsors), `length: ${data?.sponsors?.length}`);
        test('  → has gallery array', Array.isArray(data?.gallery), `length: ${data?.gallery?.length}`);
        test('  → has faq array', Array.isArray(data?.faq), `length: ${data?.faq?.length}`);
        test('  → has formats array', Array.isArray(data?.formats), `length: ${data?.formats?.length}`);
        test('  → has results object', typeof data?.results === 'object');
    } catch (e) {
        test('GET /api/public/content reachable', false, e.message);
    }

    // ── 3. Public Main Event ──
    try {
        const { status, data } = await request('GET', '/api/public/main-event');
        test('GET /api/public/main-event returns 200', status === 200);
        test('  → has mainEvent field', data?.mainEvent !== undefined);
        if (data?.mainEvent) {
            test('  → mainEvent has title', !!data.mainEvent.title, data.mainEvent.title);
            test('  → mainEvent has date', !!data.mainEvent.date, data.mainEvent.date);
        }
    } catch (e) {
        test('GET /api/public/main-event reachable', false, e.message);
    }

    // ── 4. Auth ──
    section('Authentication');
    let adminToken = null;

    // Bad password
    try {
        const { status } = await request('POST', '/api/auth/login', {
            body: { password: 'wrong-password' },
        });
        test('POST /api/auth/login rejects bad password (401)', status === 401);
    } catch (e) {
        test('POST /api/auth/login (bad password)', false, e.message);
    }

    // Correct password
    try {
        const { status, data } = await request('POST', '/api/auth/login', {
            body: { password: ADMIN_PASSWORD },
        });
        test('POST /api/auth/login accepts correct password (200)', status === 200);
        test('  → returns JWT token', typeof data?.token === 'string' && data.token.length > 0);
        adminToken = data?.token || null;
    } catch (e) {
        test('POST /api/auth/login (correct password)', false, e.message);
    }

    if (!adminToken) {
        skip('All authenticated endpoints', 'no admin token obtained');
        printSummary();
        return;
    }

    // ── 5. Auth-protected Content ──
    section('Authenticated Content CRUD');
    try {
        const { status, data } = await request('GET', '/api/content', { token: adminToken });
        test('GET /api/content (auth) returns 200', status === 200);
        test('  → matches public content structure', typeof data?.settings === 'object');
    } catch (e) {
        test('GET /api/content (auth)', false, e.message);
    }

    // ── 6. Auth-protected without token ──
    try {
        const { status } = await request('GET', '/api/content');
        test('GET /api/content without token returns 401', status === 401);
    } catch (e) {
        test('GET /api/content (no token)', false, e.message);
    }

    // ── 7. Resource endpoints (events, judges, sponsors, gallery, faq, formats) ──
    section('Resource Endpoints (CRUD)');
    const resources = ['events', 'judges', 'sponsors', 'gallery', 'faq', 'formats'];

    for (const resource of resources) {
        try {
            const { status, data } = await request('GET', `/api/${resource}`, { token: adminToken });
            test(`GET /api/${resource} returns 200`, status === 200);
            test(`  → returns array`, Array.isArray(data), `length: ${data?.length}`);
        } catch (e) {
            test(`GET /api/${resource}`, false, e.message);
        }
    }

    // Test POST + PUT + DELETE on a safe resource (faq)
    let createdFaqId = null;
    try {
        const { status, data } = await request('POST', '/api/faq', {
            token: adminToken,
            body: { q: '__TEST_QUESTION__', a: '__TEST_ANSWER__' },
        });
        test('POST /api/faq creates record (201)', status === 201);
        test('  → returns id', !!data?.id);
        createdFaqId = data?.id;
    } catch (e) {
        test('POST /api/faq', false, e.message);
    }

    if (createdFaqId) {
        try {
            const { status, data } = await request('PUT', `/api/faq/${createdFaqId}`, {
                token: adminToken,
                body: { q: '__TEST_QUESTION_UPDATED__', a: '__TEST_ANSWER_UPDATED__' },
            });
            test(`PUT /api/faq/${createdFaqId} returns 200`, status === 200);
            test('  → question updated', data?.q === '__TEST_QUESTION_UPDATED__');
        } catch (e) {
            test(`PUT /api/faq/${createdFaqId}`, false, e.message);
        }

        try {
            const { status } = await request('DELETE', `/api/faq/${createdFaqId}`, {
                token: adminToken,
            });
            test(`DELETE /api/faq/${createdFaqId} returns 204`, status === 204);
        } catch (e) {
            test(`DELETE /api/faq/${createdFaqId}`, false, e.message);
        }
    } else {
        skip('PUT /api/faq/:id', 'no record created');
        skip('DELETE /api/faq/:id', 'no record created');
    }

    // ── 8. Results ──
    section('Results Endpoint');
    try {
        const { status, data } = await request('GET', '/api/results', { token: adminToken });
        test('GET /api/results returns 200', status === 200);
        test('  → has heading field', typeof data?.heading === 'string');
        test('  → has items array', Array.isArray(data?.items));
    } catch (e) {
        test('GET /api/results', false, e.message);
    }

    // ── 9. Registrations (list) ──
    section('Registrations');
    try {
        const { status, data } = await request('GET', '/api/registrations', { token: adminToken });
        test('GET /api/registrations returns 200', status === 200);
        test('  → returns array', Array.isArray(data), `length: ${data?.length}`);
    } catch (e) {
        test('GET /api/registrations', false, e.message);
    }

    // Public registration – test validation
    try {
        const { status, data } = await request('POST', '/api/public/registrations', {
            body: {},
        });
        test('POST /api/public/registrations empty body returns 400', status === 400);
        test('  → error message present', !!data?.message, data?.message);
    } catch (e) {
        test('POST /api/public/registrations (validation)', false, e.message);
    }

    // Public registration with missing event
    try {
        const { status } = await request('POST', '/api/public/registrations', {
            body: { eventId: 'nonexistent-event', fullName: 'Test', email: 'test@test.com' },
        });
        test('POST /api/public/registrations with bad eventId returns 400', status === 400);
    } catch (e) {
        test('POST /api/public/registrations (bad eventId)', false, e.message);
    }

    // ── 10. Unknown resource returns 404 ──
    section('Edge Cases');
    try {
        const { status } = await request('GET', '/api/nonexistent', { token: adminToken });
        test('GET /api/nonexistent returns 404', status === 404);
    } catch (e) {
        test('GET /api/nonexistent', false, e.message);
    }

    // ── 11. Upload endpoint (no file = 400) ──
    try {
        const url = `${BASE}/api/upload`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        test('POST /api/upload without file returns 400', res.status === 400);
    } catch (e) {
        test('POST /api/upload (no file)', false, e.message);
    }

    printSummary();
}

function printSummary() {
    console.log(`\n${BOLD}════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  Results: ${passed}/${totalTests} passed${RESET}`);
    if (skipped > 0) console.log(`  ${SKIP} Skipped: ${skipped}`);
    if (failed > 0) {
        console.log(`  ${FAIL} Failed: ${failed}`);
        failures.forEach((f) => console.log(`    • ${f}`));
    }
    console.log(`${BOLD}════════════════════════════════════════${RESET}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error(`\n${FAIL} Script crashed: ${err.message}\n`);
    process.exit(2);
});
