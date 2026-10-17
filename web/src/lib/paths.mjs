// Astro's base is '/' locally and '/intaniadebate/' on GitHub Pages.
export function withBase(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return value;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base || value === base || value.startsWith(`${base}/`)) return value;
  return `${base}${value}`;
}
export function srcsetWithBase(value) {
  return value?.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (_match, prefix, url) => prefix + withBase(url));
}
