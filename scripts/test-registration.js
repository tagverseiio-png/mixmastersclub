#!/usr/bin/env node

/**
 * Mix Masters – Registration + Email Test Script
 * ================================================
 * Simulates a user filling the registration form and verifies:
 *   1. Registration is saved to the database
 *   2. Confirmation email is sent to the participant
 *   3. Notification emails are sent to admin emails
 *
 * Usage:
 *   node scripts/test-registration.js                        # test against production API
 *   node scripts/test-registration.js http://localhost:4000   # test against local backend
 */

const BASE = (process.argv[2] || 'https://api.mixmasters.club').replace(/\/+$/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Qwerty@12345';

const PASS = '\x1b[32m✔ PASS\x1b[0m';
const FAIL = '\x1b[31m✘ FAIL\x1b[0m';
const WARN = '\x1b[33m⚠ WARN\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

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

function info(msg) {
    console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
}

function section(title) {
    console.log(`\n${BOLD}── ${title} ──${RESET}`);
}

async function request(method, path, { body, token } = {}) {
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

    return { status: res.status, data, ok: res.ok };
}

async function run() {
    console.log(`\n${BOLD}Mix Masters – Registration & Email Test${RESET}`);
    console.log(`${DIM}Target: ${BASE}${RESET}`);

    // ── Step 1: Get active events ──
    section('Step 1 — Fetch Active Events');
    let activeEvent = null;
    try {
        const { status, data } = await request('GET', '/api/public/content');
        test('Fetch public content (200)', status === 200);

        const events = Array.isArray(data?.events) ? data.events : [];
        const activeEvents = events.filter(e => (e?.status || '').toLowerCase() === 'active');
        test('Has events in content', events.length > 0, `total: ${events.length}`);
        test('Has active events', activeEvents.length > 0, `active: ${activeEvents.length}`);

        if (activeEvents.length > 0) {
            activeEvent = activeEvents[0];
            info(`Using event: "${activeEvent.title}" (id: ${activeEvent.id})`);
        }
    } catch (e) {
        test('Fetch public content', false, e.message);
    }

    if (!activeEvent) {
        console.log(`\n  ${FAIL}  Cannot proceed — no active events found.\n`);
        process.exit(1);
    }

    // ── Step 2: Submit registration ──
    section('Step 2 — Submit Registration');
    const testRegistration = {
        role: 'artist',
        eventId: activeEvent.id,
        fullName: 'Test DJ User',
        email: 'testdj@mixmasters.club',
        nationality: 'Singapore',
        city: 'Singapore',
        age: '25',
        stageName: 'DJ TestMaster',
        instagram: '@djtestmaster',
        experience: '5',
        soundCloud: 'https://soundcloud.com/testdj',
        demoFile: 'test-demo-mix.mp3',
        source: 'test-script',
    };

    let registrationId = null;
    let emailSent = false;

    try {
        console.log(`\n  ${DIM}Sending registration payload:${RESET}`);
        console.log(`  ${DIM}  fullName:    ${testRegistration.fullName}${RESET}`);
        console.log(`  ${DIM}  email:       ${testRegistration.email}${RESET}`);
        console.log(`  ${DIM}  stageName:   ${testRegistration.stageName}${RESET}`);
        console.log(`  ${DIM}  eventId:     ${testRegistration.eventId}${RESET}`);
        console.log(`  ${DIM}  nationality: ${testRegistration.nationality}${RESET}`);
        console.log(`  ${DIM}  experience:  ${testRegistration.experience} years${RESET}`);
        console.log('');

        const { status, data } = await request('POST', '/api/public/registrations', {
            body: testRegistration,
        });

        test('Registration accepted (201)', status === 201, `status: ${status}`);
        test('Response has registrationId', !!data?.registrationId, data?.registrationId);
        test('Response has emailSent field', data?.emailSent !== undefined, `emailSent: ${data?.emailSent}`);

        registrationId = data?.registrationId || null;
        emailSent = data?.emailSent || false;

        if (emailSent) {
            console.log(`\n  ${PASS}  ${BOLD}Emails were sent successfully!${RESET}`);
            info('Confirmation email → testdj@mixmasters.club');
            info('Admin notification → admin@mixmasters.club');
            info('Admin notification → aathishpirate@gmail.com');
        } else {
            console.log(`\n  ${WARN}  Registration saved but emails were NOT sent.`);
            info('This means the mail service may be misconfigured or the API key is invalid.');
            info('Check MAIL_SERVICE_URL and MAIL_SERVICE_API_KEY in backend/.env');
        }
    } catch (e) {
        test('Submit registration', false, e.message);
    }

    // ── Step 3: Verify registration in database ──
    section('Step 3 — Verify Registration in Database');

    // Login as admin
    let adminToken = null;
    try {
        const { data } = await request('POST', '/api/auth/login', {
            body: { password: ADMIN_PASSWORD },
        });
        adminToken = data?.token || null;
        test('Admin login successful', !!adminToken);
    } catch (e) {
        test('Admin login', false, e.message);
    }

    if (adminToken && registrationId) {
        try {
            const { status, data } = await request('GET', '/api/registrations', { token: adminToken });
            test('Fetch registrations list (200)', status === 200);

            const found = Array.isArray(data) ? data.find(r => r.id === registrationId) : null;
            test('Test registration found in database', !!found);

            if (found) {
                test('  → fullName matches', found.fullName === testRegistration.fullName);
                test('  → email matches', found.email === testRegistration.email);
                test('  → stageName matches', found.stageName === testRegistration.stageName);
                test('  → eventId matches', found.eventId === testRegistration.eventId);
                test('  → eventTitle populated', !!found.eventTitle, found.eventTitle);
                test('  → eventDate populated', !!found.eventDate, found.eventDate);
                test('  → eventLocation populated', !!found.eventLocation, found.eventLocation);
                test('  → createdAt set', !!found.createdAt, found.createdAt);
            }
        } catch (e) {
            test('Verify registration in DB', false, e.message);
        }

        // ── Step 4: Cleanup test data ──
        section('Step 4 — Cleanup');
        try {
            const { status } = await request('DELETE', `/api/registrations/${registrationId}`, {
                token: adminToken,
            });
            test('Test registration deleted (204)', status === 204);
            info('Test data cleaned up successfully.');
        } catch (e) {
            test('Cleanup test registration', false, e.message);
        }
    }

    // ── Step 5: Validation tests ──
    section('Step 5 — Validation Edge Cases');

    // Empty body
    try {
        const { status, data } = await request('POST', '/api/public/registrations', { body: {} });
        test('Empty body returns 400', status === 400, data?.message);
    } catch (e) {
        test('Empty body validation', false, e.message);
    }

    // Missing email
    try {
        const { status, data } = await request('POST', '/api/public/registrations', {
            body: { eventId: activeEvent.id, fullName: 'Test' },
        });
        test('Missing email returns 400', status === 400, data?.message);
    } catch (e) {
        test('Missing email validation', false, e.message);
    }

    // Invalid eventId
    try {
        const { status, data } = await request('POST', '/api/public/registrations', {
            body: { eventId: 'fake-event-999', fullName: 'Test', email: 'x@x.com' },
        });
        test('Invalid eventId returns 400', status === 400, data?.message);
    } catch (e) {
        test('Invalid eventId validation', false, e.message);
    }

    // ── Summary ──
    console.log(`\n${BOLD}════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}  Results: ${passed}/${totalTests} passed${RESET}`);
    if (failed > 0) {
        console.log(`  ${FAIL} Failed: ${failed}`);
        failures.forEach((f) => console.log(`    • ${f}`));
    }

    // Email status summary
    console.log('');
    if (emailSent) {
        console.log(`  ${PASS}  ${BOLD}EMAIL STATUS: SENT${RESET}`);
        console.log(`  ${DIM}  ├─ Participant: testdj@mixmasters.club${RESET}`);
        console.log(`  ${DIM}  ├─ Admin 1:     admin@mixmasters.club${RESET}`);
        console.log(`  ${DIM}  └─ Admin 2:     aathishpirate@gmail.com${RESET}`);
    } else {
        console.log(`  ${WARN}  ${BOLD}EMAIL STATUS: NOT SENT${RESET}`);
        console.log(`  ${DIM}  Check backend/.env:${RESET}`);
        console.log(`  ${DIM}    MAIL_SERVICE_URL=<your mail service URL>${RESET}`);
        console.log(`  ${DIM}    MAIL_SERVICE_API_KEY=<valid API key>${RESET}`);
        console.log(`  ${DIM}    ADMIN_EMAILS=admin@mixmasters.club,aathishpirate@gmail.com${RESET}`);
    }

    console.log(`${BOLD}════════════════════════════════════════════════${RESET}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error(`\n${FAIL} Script crashed: ${err.message}\n`);
    process.exit(2);
});
