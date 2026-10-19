import test from 'node:test';
import assert from 'node:assert/strict';
import { initYearNavigation } from '../src/scripts/year-navigation.js';
function fixture() {
  const on = new Map(), listen = (name, fn) => on.set(name, [...(on.get(name) || []), fn]), fire = (name, data) => { for (const fn of on.get(name) || []) fn(data); };
  const rail = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } }, loading = { textContent: '' };
  const link = { href: 'https://intaniadebateclub.com/competitions/2019/', target: '', hasAttribute: () => false };
  const surface = { dataset: { yearSurface: 'competitions' }, contains: node => node === link, querySelector: s => ({ '.year-navigation': rail, '[data-year-loading]': loading })[s] };
  const loc = new URL('https://intaniadebateclub.com/competitions/2018/#rivals'), fetches = [];
  Object.assign(globalThis, {
    location: loc, history: { state: null, replaceState(state) { this.state = state; }, pushState() {} },
    document: { querySelector: s => s === '[data-year-surface]' ? surface : null, addEventListener: listen },
    window: { scrollX: 0, scrollY: 0, addEventListener: listen, scrollTo() {} },
    fetch: (url, { signal }) => new Promise((_, reject) => { fetches.push(url); signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))); }),
  });
  initYearNavigation();
  const click = () => fire('click', { target: { closest: () => link }, button: 0, preventDefault() {} });
  return { rail, loading, fetches, click, fire };
}
test('going back to the same year page during a slow load clears the busy year rail', async () => {
  const f = fixture(); f.click();
  assert.equal(f.rail.attrs['aria-busy'], 'true'); assert.equal(f.loading.textContent, 'กำลังเปิดปี…'); assert.equal(f.fetches.length, 1);
  f.fire('popstate', { state: { intaniaYear: { kind: 'competitions', x: 0, y: 0 } } });
  await new Promise(resolve => setTimeout(resolve));
  assert.equal(f.rail.attrs['aria-busy'], undefined); assert.equal(f.loading.textContent, '');
});
