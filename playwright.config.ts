import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    testMatch: '**/*.spec.ts',
    use: {
        baseURL: 'http://127.0.0.1:18373',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    },
    webServer: {
        command: 'npm run build && node tests/e2e/serve-dist.mjs',
        url: 'http://127.0.0.1:18373',
    },
});

