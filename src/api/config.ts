// Where the Cone backend lives. Edit this file when the backend address changes.
// Settings from environment variables (VITE_API_BASE_URL, VITE_USE_MOCK) win when they are set,
// but this file works even when the build tool ignores environment variables.
const TEST_BACKEND = 'https://crispy-goldfish-q44v4g95g7rc69p9-3000.app.github.dev/api/v1';

// true = fake data only (no backend needed); false = talk to the real backend.
const MOCK_BY_DEFAULT = false;

const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const envMock = (import.meta.env.VITE_USE_MOCK as string | undefined)?.trim();

// An address that points at the developer's own machine (or the retired previous codespace) cannot work.
const envUrlUsable =
  !!envUrl &&
  !/localhost|127\.0\.0\.1|super-space-computing-machine-vrrpr7gjq75hxjxp/.test(envUrl);

// The backend only answers under /api/v1, so add it when a setting leaves it out.
function withApiPrefix(url: string): string {
  const normalized = url.replace(/([^:]\/)\/+/g, '$1').replace(/\/+$/, '');
  return /\/api\/v1$/.test(normalized) ? normalized : `${normalized}/api/v1`;
}

export const API_BASE_URL = withApiPrefix(envUrlUsable ? envUrl! : TEST_BACKEND);
export const USE_MOCK = envMock === 'true' ? true : envMock === 'false' ? false : MOCK_BY_DEFAULT;
