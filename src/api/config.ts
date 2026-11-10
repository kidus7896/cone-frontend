// Where the Cone backend lives. Edit this file when the backend address changes.
// Settings from environment variables (VITE_API_BASE_URL, VITE_USE_MOCK) win when they are set,
// but this file works even when the build tool ignores environment variables.
const TEST_BACKEND = 'https://super-space-computing-machine-vrrpr7gjq75hxjxp-3000.app.github.dev/api/v1';

// true = fake data only (no backend needed); false = talk to the real backend.
const MOCK_BY_DEFAULT = false;

const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const envMock = (import.meta.env.VITE_USE_MOCK as string | undefined)?.trim();

// An address that points at the developer's own machine cannot work from the hosted preview.
const envUrlUsable = !!envUrl && !/localhost|127\.0\.0\.1/.test(envUrl);

export const API_BASE_URL = (envUrlUsable ? envUrl! : TEST_BACKEND).replace(/\/+$/, '');
export const USE_MOCK = envMock === 'true' ? true : envMock === 'false' ? false : MOCK_BY_DEFAULT;
