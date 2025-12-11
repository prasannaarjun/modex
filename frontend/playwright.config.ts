import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './src/tests/e2e',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 720 },
    },
    webServer: {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
