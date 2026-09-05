import { getViteConfig } from 'astro/config';
import type { TestUserConfig } from 'vitest/config';

// vitest 4 no longer augments Vite's own `UserConfig` with a `test` key — it exposes its
// config types from `vitest/config` instead — and astro types getViteConfig's argument as
// exactly that Vite `UserConfig`, so `test` is invisible to it. The block below is still
// fully type-checked against vitest's own type; only the outer merge needs the assertion,
// and getViteConfig passes the object straight through at runtime.
const test: TestUserConfig = {
  include: ['src/**/*.test.ts'],
};

export default getViteConfig({ test } as Parameters<typeof getViteConfig>[0]);
