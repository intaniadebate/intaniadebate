import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  base: process.env.PUBLIC_BASE_PATH || '/',
  output: 'static',
  publicDir: process.env.INTANIA_MEDIA_PREVIEW === 'true' ? './.local-public' : './public',
  server: { host: '127.0.0.1', port: 4321 },
  build: { inlineStylesheets: 'never' },
});
