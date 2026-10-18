import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsEnabled, publicPage, readConsent, linkEvent, installAnalytics, CONSENT_KEY, CONSENT_DAYS } from '../src/lib/analytics.mjs';

const measurementId = 'G-TEST123456';
const origin = 'https://intaniadebateclub.com';

// Lightweight browser boundary doubles: no Google requests or real identifiers.
function browserFixture({ stored, blockedStorage = false, href = `${origin}/competitions/2017` } = {}) {
  class Surface {
    constructor() { this.listeners = new Map(); this.hidden = true; this.textContent = ''; this.dataset = {}; }
    addEventListener(name, handler) { const list = this.listeners.get(name) || []; list.push(handler); this.listeners.set(name, list); }
    fire(name, data = {}) { for (const handler of this.listeners.get(name) || []) handler(data); }
    focus() { this.focused = true; }
  }
  const panel = new Surface();
  const settings = new Surface();
  const label = new Surface();
  const accept = new Surface(); accept.dataset.analyticsChoice = 'granted';
  const reject = new Surface(); reject.dataset.analyticsChoice = 'denied';
  panel.querySelector = () => reject;
  const doc = new Surface();
  doc.querySelector = selector => selector === '[data-analytics-panel]' ? panel : null;
  doc.querySelectorAll = selector => ({ '[data-analytics-settings]': [settings], '[data-analytics-state]': [label], '[data-analytics-choice]': [reject, accept] })[selector] || [];
  doc.cookie = '';
  doc.referrer = 'https://referrer.example/private?email=test@example.com#secret';
  const win = new Surface();
  let current = new URL(href);
  let reloads = 0;
  win.location = {
    get href() { return current.href; },
    get origin() { return current.origin; },
    get hostname() { return current.hostname; },
    reload() { reloads++; },
  };
  const store = new Map(stored ? [[CONSENT_KEY, JSON.stringify(stored)]] : []);
  Object.defineProperty(win, 'localStorage', { get() {
    if (blockedStorage) throw new Error('Storage unavailable');
    return { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
  } });
  let tagLoads = 0;
  let removals = 0;
  const loadTag = () => { tagLoads++; return { remove() { removals++; } }; };
  return {
    win, doc, panel, settings, label, accept, reject, store,
    install: (enabled, overrides = {}) => installAnalytics({ win, doc, measurementId, enabled, loadTag, ...overrides }),
    navigate: href => { current = new URL(href); },
    get loads() { return tagLoads; }, get reloads() { return reloads; }, get removals() { return removals; },
    commands: () => (win.dataLayer || []).map(value => [...value]),
    events: () => (win.dataLayer || []).map(value => [...value]).filter(value => value[0] === 'event'),
  };
}

test('analytics requires a valid ID, HTTPS production and exact configured origin', () => {
  const config = { production: true, measurementId, siteUrl: origin, href: `${origin}/home` };
  assert.equal(analyticsEnabled(config), true);
  for (const change of [
    { production: false }, { measurementId: '' }, { measurementId: 'G-invalid<script>' },
    { href: 'http://127.0.0.1:4322/home' }, { href: 'https://preview.example/home' },
    { siteUrl: '' }, { href: 'https://intaniadebateclub.com.evil.example/home' },
    { siteUrl: 'http://intaniadebateclub.com', href: 'http://intaniadebateclub.com/home' },
  ]) assert.equal(analyticsEnabled({ ...config, ...change }), false);
});

test('page payload drops query strings, fragments and unrecognized paths', () => {
  assert.deepEqual(publicPage(`${origin}/home/?email=private#token`, origin), { page_location: `${origin}/home`, page_path: '/home' });
  assert.equal(publicPage(`${origin}/people/private@example.com`, origin), null);
  assert.equal(publicPage('https://other.example/home', origin), null);
});

test('consent requires a current version, explicit choice and timestamp within 180 days', () => {
  const now = Date.now();
  const read = value => readConsent({ getItem: () => JSON.stringify(value) }, now);
  assert.equal(read({ version: 1, choice: 'granted', at: now }).choice, 'granted');
  for (const value of [null, { choice: 'granted' }, { version: 1, choice: 'yes', at: now },
    { version: 1, choice: 'granted', at: now + 1 },
    { version: 1, choice: 'granted', at: now - CONSENT_DAYS * 86400000 },
  ]) assert.equal(read(value), null);
  assert.equal(readConsent({ getItem() { throw new Error('Blocked'); } }), null);
});

test('no tag or event is queued until the visitor explicitly accepts', () => {
  const fixture = browserFixture();
  const analytics = fixture.install(true);
  assert.equal(fixture.panel.hidden, false);
  assert.equal(fixture.loads, 0);
  analytics.pageView();
  fixture.doc.fire('click', { button: 0, target: { closest: () => null } });
  assert.equal(fixture.commands().length, 0);
  analytics.choose('denied');
  assert.equal(fixture.loads, 0);
  assert.equal(fixture.reloads, 0);
  assert.equal(fixture.panel.hidden, true);
  assert.equal(JSON.parse(fixture.store.get(CONSENT_KEY)).choice, 'denied');
});

test('disabled previews and unrecognized pages never load even with stored consent', () => {
  const stored = { version: 1, choice: 'granted', at: Date.now() };
  for (const fixture of [browserFixture({ stored }), browserFixture({ stored, href: `${origin}/private/token` })]) {
    assert.equal(fixture.install(fixture.win.location.href.includes('/private')), null);
    assert.equal(fixture.loads, 0);
    assert.equal(fixture.panel.hidden, true);
  }
});

test('acceptance initializes once, denies ads and sends exactly one sanitized page view', () => {
  const fixture = browserFixture({ href: `${origin}/home?email=private#secret` });
  const analytics = fixture.install(true);
  analytics.choose('granted'); analytics.choose('granted'); analytics.pageView();
  assert.equal(fixture.loads, 1);
  assert.equal(fixture.events().length, 1);
  assert.equal(fixture.events()[0][1], 'page_view');
  const config = fixture.commands().find(command => command[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.page_referrer, 'https://referrer.example');
  assert.equal(config.page_location, `${origin}/home`);
  const consent = fixture.commands().find(command => command[0] === 'consent' && command[1] === 'update')[2];
  assert.equal(consent.analytics_storage, 'granted');
  assert.equal(consent.ad_storage, 'denied');
  assert.equal(consent.ad_user_data, 'denied');
  assert.equal(consent.ad_personalization, 'denied');
  assert.ok(!JSON.stringify(fixture.commands()).includes('email='));
});

test('year swaps count only successful new pages; Back counts a view but not a year selection', () => {
  const fixture = browserFixture();
  const analytics = fixture.install(true); analytics.choose('granted');
  fixture.navigate(`${origin}/competitions/2021?token=secret`);
  fixture.win.fire('intania:year-changed', { detail: { kind: 'competitions', year: '2021', source: 'select' } });
  analytics.pageView();
  fixture.navigate(`${origin}/competitions/2017`);
  fixture.win.fire('intania:year-changed', { detail: { kind: 'competitions', year: '2017', source: 'history' } });
  assert.equal(fixture.events().filter(event => event[1] === 'page_view').length, 3);
  assert.equal(fixture.events().filter(event => event[1] === 'year_select').length, 1);
  assert.equal(fixture.events().at(-1)[2].page_referrer, `${origin}/competitions/2021`);
});

test('withdrawal disables the stream, clears pending hits and unloads the tag', () => {
  const fixture = browserFixture();
  const analytics = fixture.install(true); analytics.choose('granted'); analytics.choose('denied');
  assert.equal(fixture.win[`ga-disable-${measurementId}`], true);
  assert.equal(fixture.commands().length, 0);
  assert.equal(fixture.removals, 1);
  assert.equal(fixture.reloads, 1);
  analytics.pageView();
  assert.equal(fixture.commands().length, 0);
});

test('cross-tab withdrawal also stops queued and future events', () => {
  const fixture = browserFixture({ stored: { version: 1, choice: 'granted', at: Date.now() } });
  fixture.install(true);
  fixture.store.set(CONSENT_KEY, JSON.stringify({ version: 1, choice: 'denied', at: Date.now() }));
  fixture.win.fire('storage', { key: CONSENT_KEY });
  assert.equal(fixture.win[`ga-disable-${measurementId}`], true);
  assert.equal(fixture.commands().length, 0);
  assert.equal(fixture.reloads, 1);
});

test('blocked storage remains usable and allows a choice for only this document', () => {
  const fixture = browserFixture({ blockedStorage: true });
  const analytics = fixture.install(true);
  analytics.choose('granted');
  assert.equal(fixture.loads, 1);
  analytics.choose('denied');
  assert.equal(fixture.commands().length, 0);
});

test('link tracking excludes personal profiles and retains only public video IDs', () => {
  const link = (href, video = false) => ({ href, matches: selector => selector === '.match-video' && video });
  assert.deepEqual(linkEvent(link('https://www.instagram.com/intaniadebateclub/?secret=1'), origin), ['contact_click', { platform: 'instagram' }]);
  assert.equal(linkEvent(link('https://www.instagram.com/personal_member/'), origin), null);
  assert.equal(linkEvent(link('javascript:alert(1)'), origin), null);
  assert.deepEqual(linkEvent(link('https://www.youtube.com/watch?v=AbCdEf12345&email=private', true), origin), ['video_click', { video_id: 'AbCdEf12345' }]);
  assert.deepEqual(linkEvent(link(`${origin}/posts/recruitment?token=secret`), origin), ['news_click', { article_slug: 'recruitment' }]);
});

test('the real loader creates only an asynchronous fixed-origin Google tag after consent', () => {
  const fixture = browserFixture();
  const tags = [];
  fixture.doc.createElement = name => { assert.equal(name, 'script'); return {}; };
  fixture.doc.head = { append: script => tags.push(script) };
  const analytics = fixture.install(true, { loadTag: undefined });
  assert.equal(tags.length, 0);
  analytics.choose('granted');
  assert.equal(tags.length, 1);
  assert.equal(tags[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  assert.equal(tags[0].async, true);
  assert.equal(tags[0].referrerPolicy, 'no-referrer');
});

test('delegated match and filter events work on newly inserted content and omit private values', () => {
  const fixture = browserFixture();
  fixture.install(true).choose('granted');
  const match = { open: true, matches: selector => selector === '.match-details', closest: () => ({ id: 'match-2021-freshy-01' }) };
  fixture.doc.fire('toggle', { target: match });
  match.open = false;
  fixture.doc.fire('toggle', { target: match });
  fixture.doc.fire('change', { target: { dataset: { rivalYear: '' }, value: '2021' } });
  fixture.doc.fire('change', { target: { dataset: { rivalYear: '' }, value: 'private@example.com' } });
  assert.equal(fixture.events().filter(event => event[1] === 'match_open').length, 1);
  assert.deepEqual(fixture.events().at(-1).slice(1, 2), ['filter_change']);
  assert.equal(fixture.events().at(-1)[2].filter_value, '2021');
  assert.ok(!JSON.stringify(fixture.commands()).includes('private@example.com'));
});

test('click delegation records public contact links without delaying navigation', () => {
  const fixture = browserFixture();
  fixture.install(true).choose('granted');
  const link = { href: 'https://www.instagram.com/intaniadebateclub/?tracking=ignored', matches: () => false, closest: () => null };
  const target = { closest: selector => selector === 'a[href]' ? link : null };
  fixture.doc.fire('click', { button: 0, target });
  fixture.doc.fire('click', { button: 2, target });
  assert.equal(fixture.events().filter(event => event[1] === 'contact_click').length, 1);
  assert.equal(fixture.events().at(-1)[2].platform, 'instagram');
});

test('settings remain available after declining and return focus when a choice is made', () => {
  const fixture = browserFixture();
  fixture.install(true);
  fixture.reject.fire('click');
  assert.equal(fixture.panel.hidden, true);
  fixture.settings.fire('click');
  assert.equal(fixture.panel.hidden, false);
  assert.equal(fixture.reject.focused, true);
  fixture.accept.fire('click');
  assert.equal(fixture.settings.focused, true);
  assert.equal(fixture.loads, 1);
});

test('an expired choice cannot restart tracking from storage', () => {
  const fixture = browserFixture({ stored: { version: 1, choice: 'granted', at: Date.now() - (CONSENT_DAYS + 1) * 86400000 } });
  fixture.install(true);
  assert.equal(fixture.panel.hidden, false);
  assert.equal(fixture.loads, 0);
  assert.equal(fixture.commands().length, 0);
});
