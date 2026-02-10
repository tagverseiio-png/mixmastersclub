import { IMAGE_SOURCES, VIDEO_SOURCES } from '../src/data/mediaSources.js';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TIMEOUT_MS = 12000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourceUrls = [
    ...Object.values(IMAGE_SOURCES),
    ...Object.values(VIDEO_SOURCES),
];

const urls = [...new Set(sourceUrls)];

const checkUrl = async (url) => {
    if (url.startsWith('/')) {
        const fullPath = path.join(projectRoot, 'public', url.replace(/^\//, ''));
        try {
            await access(fullPath, constants.R_OK);
            return {
                url,
                ok: true,
                status: 200,
                redirected: false,
            };
        } catch {
            return {
                url,
                ok: false,
                status: 404,
                redirected: false,
                error: 'local file not found',
            };
        }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        let response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
        });

        if (response.status === 405 || response.status === 501) {
            response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal,
            });
        }

        return {
            url,
            ok: response.ok && /^image\/|^video\//.test(response.headers.get('content-type') || ''),
            status: response.status,
            redirected: response.redirected,
            error: response.ok && !/^image\/|^video\//.test(response.headers.get('content-type') || '')
                ? `non-media content-type: ${response.headers.get('content-type') || 'unknown'}`
                : undefined,
        };
    } catch (error) {
        return {
            url,
            ok: false,
            status: null,
            redirected: false,
            error: error.name === 'AbortError' ? 'timeout' : error.message,
        };
    } finally {
        clearTimeout(timeout);
    }
};

const results = await Promise.all(urls.map((url) => checkUrl(url)));

const groups = {
    ok: results.filter((result) => result.ok && !result.redirected),
    redirected: results.filter((result) => result.ok && result.redirected),
    failed: results.filter((result) => !result.ok),
};

console.log(`Checked ${results.length} unique media URL(s)\n`);

console.log('OK');
groups.ok.forEach((result) => {
    console.log(`  ${result.status} ${result.url}`);
});

console.log('\nRedirected');
groups.redirected.forEach((result) => {
    console.log(`  ${result.status} ${result.url}`);
});

console.log('\nFailed');
groups.failed.forEach((result) => {
    if (result.error) {
        console.log(`  ERR (${result.error}) ${result.url}`);
        return;
    }
    console.log(`  ${result.status} ${result.url}`);
});

if (groups.failed.length > 0) {
    process.exitCode = 1;
}
